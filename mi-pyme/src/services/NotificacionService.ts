/**
 * NotificacionService - lógica de negocio para notificaciones multicanal.
 *
 * Framework-agnostic: puede ser usado por Server Actions, API Routes, o
 * futuros servicios Nest.js. No importa nada de Next.js.
 *
 * Responsabilidades:
 *  - Emitir notificaciones (in-app + email) respetando preferencias.
 *  - Listar, marcar leída, archivar, eliminar.
 *  - Gestionar preferencias por usuario y tipo de evento.
 *  - Rate limiting e idempotencia por evento único.
 */
import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { getCache, cacheKeys, cacheTTL } from "@/infrastructure";
import type { ICache } from "@/infrastructure";
import { logAudit } from "./utils/audit";
import { BusinessError } from "@/shared/types";
import {
  CODIGO_NO_ENCONTRADA_NOTIFICACION,
  CODIGO_NO_AUTORIZADO,
  CODIGO_PREFERENCIA_INVALIDA,
  CODIGO_NOTIFICACION_RATE_LIMIT,
  NOTIFICACION_RATE_LIMIT_POR_HORA,
} from "@/core/constants";
import type {
  TipoNotificacion,
  EstadoNotificacion,
  PreferenciaNotificacion as PrismaPreferencia,
} from "@/generated/prisma/client";
import type {
  EventoNotificacion,
  DestinoNotificacion,
  Notificacion as NotificacionType,
} from "@/shared/notificaciones.types";
import { getEmailQueue } from "@/infrastructure/email/EmailQueue";
import { obtenerPlantilla, contextoDesdeNotificacion } from "@/infrastructure/email/templates";
import { Rol } from "@/lib/auth/roles";

type PreferenciaUsuario = {
  inApp: boolean;
  email: boolean;
};

const TIPOS_TODOS: TipoNotificacion[] = [
  "PEDIDO_CREADO",
  "PEDIDO_ESTADO_CAMBIADO",
  "PEDIDO_ASIGNADO_LOGISTICA",
  "RESERVA_CREADA",
  "RESERVA_CANCELADA",
  "PAGO_COMPROBANTE_SUBIDO",
  "PAGO_CONFIRMADO",
  "PAGO_RECHAZADO",
  "PAGO_REEMBOLSADO",
  "CODIGO_ENTREGA_REGENERADO",
  "SOLICITUD_ALTA_CREADA",
  "SOLICITUD_ALTA_APROBADA",
  "SOLICITUD_ALTA_RECHAZADA",
  "DISPONIBILIDAD_AGOTADA",
  "STOCK_BAJO",
  "TRANSPORTE_CONTRATADO",
  "CUPON_PROXIMO_A_EXPIRAR",
  "PROMOCION_AGOTADA",
  "BIENVENIDA",
  "PASSWORD_CAMBIADO",
  "LOGIN_NUEVO_DISPOSITIVO",
];

interface ListarFiltros {
  tipo?: TipoNotificacion[];
  estado?: EstadoNotificacion[];
  page?: number;
  limit?: number;
}

interface PaginatedNotificaciones {
  data: NotificacionType[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class NotificacionService extends Service {
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
  }

  async init(): Promise<void> {}

  // ---------------------------------------------------------------------------
  // Evento
  // ---------------------------------------------------------------------------

  /**
   * Emite una notificación multicanal.
   *
   * - No bloquea el flujo llamador: siempre envuelve en try/catch y no relanza.
   * - Resuelve destinatarios (userId, negocioId→owner, rol).
   * - Respeta preferencias por tipo.
   * - Idempotente por claveIdempotencia (TTL corto).
   * - No notifica al actor ni a usuarios inactivos/borrados.
   * - Rate limiting: máximo N por tipo por usuario por hora.
   */
  async emitir(evento: EventoNotificacion): Promise<void> {
    try {
      const destinatarios = await this.resolverDestinatarios(evento);
      for (const destino of destinatarios) {
        try {
          await this.emitirAUsuario(evento, destino);
        } catch (err) {
          this.logError("Error emitiendo a usuario", {
            userId: destino.userId,
            tipo: evento.tipo,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } catch (err) {
      this.logError("Error en emitir notificación", {
        tipo: evento.tipo,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /** Versión que lanza errores. Usada por tests. */
  async emitirOrThrow(evento: EventoNotificacion): Promise<void> {
    const destinatarios = await this.resolverDestinatarios(evento);
    for (const destino of destinatarios) {
      await this.emitirAUsuario(evento, destino);
    }
  }

  private async emitirAUsuario(
    evento: EventoNotificacion,
    destino: DestinoNotificacion
  ): Promise<void> {
    const { userId } = destino;

    // Evitar auto-notificación
    if (evento.actorId && evento.actorId === userId) {
      return;
    }

    // No notificar usuarios inactivos o borrados
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true, deletedAt: true, email: true },
    });
    if (!usuario || !usuario.isActive || usuario.deletedAt) {
      return;
    }

    // Idempotencia
    if (evento.claveIdempotencia) {
      const cacheKey = `notificaciones:idempotencia:${evento.claveIdempotencia}`;
      const yaEmitida = await this.cache.get<boolean>(cacheKey);
      if (yaEmitida) {
        return;
      }
      // TTL corto: 5 minutos
      await this.cache.set(cacheKey, true, 300);
    }

    // Rate limiting por tipo/hora
    if (!(await this.respetarRateLimit(userId, evento.tipo))) {
      await logAudit(
        "NOTIFICACION_RATE_LIMITED",
        evento.actorId ?? null,
        userId,
        { tipo: evento.tipo }
      );
      return;
    }

    // Preferencias
    const prefs = await this.obtenerPreferenciasUsuario(userId);
    const pref = prefs[evento.tipo] ?? { inApp: true, email: true };

    let notificacion: NotificacionType | null = null;

    if (pref.inApp) {
      notificacion = await prisma.notificacion.create({
        data: {
          userId,
          tipo: evento.tipo,
          estado: "NO_LEIDA" as EstadoNotificacion,
          titulo: evento.titulo,
          mensaje: evento.mensaje,
          enlace: evento.enlace ?? undefined,
          metadata: evento.metadata as never,
        },
      });
    }

    // Email (asíncrono, no bloqueante)
    if (pref.email) {
      // Si in-app está desactivado, persistimos de todos modos para tracking
      // de email, marcándola como LEIDA (no aparece en el listado in-app).
      if (!notificacion) {
        notificacion = await prisma.notificacion.create({
          data: {
            userId,
            tipo: evento.tipo,
            estado: "LEIDA" as EstadoNotificacion,
            titulo: evento.titulo,
            mensaje: evento.mensaje,
            enlace: evento.enlace ?? undefined,
            metadata: evento.metadata as never,
          },
        });
      }

      const ctx = contextoDesdeNotificacion(notificacion);
      const plantilla = obtenerPlantilla(evento.tipo, ctx);

      const emailQueue = getEmailQueue();
      emailQueue.encolar({
        notificacionId: notificacion.id,
        to: usuario.email ?? "",
        asunto: plantilla.subject,
        html: plantilla.html,
        text: plantilla.text,
      });
    }

    // Auditoría
    await logAudit("NOTIFICACION_EMITIDA", evento.actorId ?? null, userId, {
      tipo: evento.tipo,
      canal: pref.inApp ? "inApp" : pref.email ? "email" : "none",
      notificacionId: notificacion?.id ?? null,
    });

    // Invalidar caché de contador
    await this.cache.del(cacheKeys.notificaciones.noLeidas(userId));
  }

  // ---------------------------------------------------------------------------
  // Resolución de destinatarios
  // ---------------------------------------------------------------------------

  private async resolverDestinatarios(
    evento: EventoNotificacion
  ): Promise<DestinoNotificacion[]> {
    const destinos: DestinoNotificacion[] = [];

    // 1. Lista explícita
    if (evento.destinatarios && evento.destinatarios.length > 0) {
      for (const d of evento.destinatarios) {
        destinos.push({ userId: d.userId, tipo: "usuario" });
      }
      return destinos;
    }

    const ids = new Set<string>();

    // 2. userId directo
    if (evento.destinatarioUserId) {
      ids.add(evento.destinatarioUserId);
    }

    // 3. negocioId → owner
    if (evento.destinatarioNegocioId) {
      const negocio = await prisma.negocio.findUnique({
        where: { id: evento.destinatarioNegocioId },
        select: { userId: true },
      });
      if (negocio?.userId) {
        ids.add(negocio.userId);
      }
    }

    // 4. rol
    if (evento.destinatarioRol) {
      const usuarios = await prisma.user.findMany({
        where: {
          rol: evento.destinatarioRol as Rol,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });
      for (const u of usuarios) {
        ids.add(u.id);
      }
    }

    for (const id of ids) {
      destinos.push({ userId: id, tipo: "usuario" });
    }

    return destinos;
  }

  // ---------------------------------------------------------------------------
  // Rate limiting
  // ---------------------------------------------------------------------------

  private async respetarRateLimit(
    userId: string,
    tipo: TipoNotificacion
  ): Promise<boolean> {
    const cacheKey = `notificaciones:ratelimit:${userId}:${tipo}`;
    const count = (await this.cache.get<number>(cacheKey)) ?? 0;

    if (count >= NOTIFICACION_RATE_LIMIT_POR_HORA) {
      return false;
    }

    await this.cache.set(cacheKey, count + 1, 3600);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Preferencias
  // ---------------------------------------------------------------------------

  /**
   * Obtiene todas las preferencias del usuario como un mapa.
   * Incluye defaults para tipos no configurados.
   */
  async getPreferencias(userId: string): Promise<Record<string, PreferenciaUsuario>> {
    const cacheKey = cacheKeys.notificaciones.preferencias(userId);
    const cached = await this.cache.get<Record<string, PreferenciaUsuario>>(cacheKey);
    if (cached) return cached;

    const preferencias = await prisma.preferenciaNotificacion.findMany({
      where: { userId },
    });

    const mapa: Record<string, PreferenciaUsuario> = {};
    for (const tipo of TIPOS_TODOS) {
      const pref = preferencias.find((p) => p.tipo === tipo);
      mapa[tipo] = {
        inApp: pref?.inApp ?? true,
        email: pref?.email ?? (tipo !== "LOGIN_NUEVO_DISPOSITIVO"),
      };
    }

    await this.cache.set(cacheKey, mapa, cacheTTL.notificaciones);
    return mapa;
  }

  /** Versión usada internamente por emitirAUsuario (solo inApp/email). */
  private async obtenerPreferenciasUsuario(
    userId: string
  ): Promise<Record<string, PreferenciaUsuario>> {
    return this.getPreferencias(userId);
  }

  /**
   * Actualiza las preferencias del usuario. Reemplaza todas las preferencias
   * del usuario con la lista proporcionada.
   */
  async actualizarPreferencias(
    userId: string,
    preferencias: Array<{ tipo: TipoNotificacion; inApp: boolean; email: boolean }>
  ): Promise<PrismaPreferencia[]> {
    if (!preferencias || !Array.isArray(preferencias)) {
      throw new BusinessError("Preferencias inválidas", CODIGO_PREFERENCIA_INVALIDA, 400);
    }

    for (const p of preferencias) {
      if (!Object.values(TIPOS_TODOS).includes(p.tipo)) {
        throw new BusinessError(
          `Tipo de notificación inválido: ${p.tipo}`,
          CODIGO_PREFERENCIA_INVALIDA,
          400
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Borrar existentes
      await tx.preferenciaNotificacion.deleteMany({ where: { userId } });

      // Crear nuevas
      const creadas: PrismaPreferencia[] = [];
      for (const p of preferencias) {
        const creada = await tx.preferenciaNotificacion.create({
          data: {
            userId,
            tipo: p.tipo,
            inApp: p.inApp,
            email: p.email,
          },
        });
        creadas.push(creada);
      }

      return creadas;
    });

    await this.cache.del(cacheKeys.notificaciones.preferencias(userId));
    return result;
  }

  // ---------------------------------------------------------------------------
  // Listado y gestión
  // ---------------------------------------------------------------------------

  async listar(
    userId: string,
    filtros: ListarFiltros = {}
  ): Promise<PaginatedNotificaciones> {
    const page = filtros.page ?? 1;
    const limit = filtros.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: {
      userId: string;
      tipo?: { in: TipoNotificacion[] };
      estado?: { in: EstadoNotificacion[] };
    } = { userId };

    if (filtros.tipo && filtros.tipo.length > 0) {
      where.tipo = { in: filtros.tipo };
    }
    if (filtros.estado && filtros.estado.length > 0) {
      where.estado = { in: filtros.estado };
    }

    const [data, total] = await Promise.all([
      prisma.notificacion.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notificacion.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      hasNext: skip + limit < total,
      hasPrev: page > 1,
    };
  }

  async contarNoLeidas(userId: string): Promise<number> {
    const cacheKey = cacheKeys.notificaciones.noLeidas(userId);
    const cached = await this.cache.get<number>(cacheKey);
    if (cached !== null && cached !== undefined) return cached;

    const count = await prisma.notificacion.count({
      where: { userId, estado: "NO_LEIDA" },
    });

    await this.cache.set(cacheKey, count, cacheTTL.notificaciones);
    return count;
  }

  async marcarLeida(id: string, userId: string): Promise<void> {
    const notificacion = await prisma.notificacion.findUnique({
      where: { id },
      select: { userId: true, estado: true },
    });

    if (!notificacion) {
      throw new BusinessError(
        "Notificación no encontrada",
        CODIGO_NO_ENCONTRADA_NOTIFICACION,
        404
      );
    }

    if (notificacion.userId !== userId) {
      throw new BusinessError(
        "No tienes permiso para modificar esta notificación",
        CODIGO_NO_AUTORIZADO,
        403
      );
    }

    if (notificacion.estado === "NO_LEIDA") {
      await prisma.notificacion.update({
        where: { id },
        data: { estado: "LEIDA", leidaEn: new Date() },
      });
      await logAudit("NOTIFICACION_LEIDA", userId, id, {});
    }

    await this.cache.del(cacheKeys.notificaciones.noLeidas(userId));
  }

  async marcarTodasLeidas(userId: string): Promise<number> {
    const actualizadas = await prisma.notificacion.updateMany({
      where: { userId, estado: "NO_LEIDA" },
      data: { estado: "LEIDA", leidaEn: new Date() },
    });

    if (actualizadas.count > 0) {
      await logAudit("NOTIFICACIONES_MARCADAS_LEIDAS", userId, null, {
        cantidad: actualizadas.count,
      });
    }

    await this.cache.del(cacheKeys.notificaciones.noLeidas(userId));
    return actualizadas.count;
  }

  async archivar(id: string, userId: string): Promise<void> {
    const notificacion = await prisma.notificacion.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!notificacion) {
      throw new BusinessError(
        "Notificación no encontrada",
        CODIGO_NO_ENCONTRADA_NOTIFICACION,
        404
      );
    }

    if (notificacion.userId !== userId) {
      throw new BusinessError(
        "No tienes permiso para modificar esta notificación",
        CODIGO_NO_AUTORIZADO,
        403
      );
    }

    await prisma.notificacion.update({
      where: { id },
      data: { estado: "ARCHIVADA" },
    });

    await logAudit("NOTIFICACION_ARCHIVADA", userId, id, {});
    await this.cache.del(cacheKeys.notificaciones.noLeidas(userId));
  }

  async eliminar(id: string, userId: string): Promise<void> {
    const notificacion = await prisma.notificacion.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!notificacion) {
      throw new BusinessError(
        "Notificación no encontrada",
        CODIGO_NO_ENCONTRADA_NOTIFICACION,
        404
      );
    }

    if (notificacion.userId !== userId) {
      throw new BusinessError(
        "No tienes permiso para eliminar esta notificación",
        CODIGO_NO_AUTORIZADO,
        403
      );
    }

    await prisma.notificacion.delete({ where: { id } });

    await logAudit("NOTIFICACION_ELIMINADA", userId, id, {});
    await this.cache.del(cacheKeys.notificaciones.noLeidas(userId));
    await this.cache.del(cacheKeys.notificaciones.lista(userId));
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private logError(mensaje: string, meta?: Record<string, unknown>): void {
    const esProd = process.env.NODE_ENV === "production";
    if (esProd) {
      console.error(`[NotificacionService] ${mensaje}`, JSON.stringify(meta ?? {}));
    } else {
      console.error(`[NotificacionService] ${mensaje}`, meta ?? {});
    }
  }
}

export type {
  PreferenciaUsuario,
  ListarFiltros,
  PaginatedNotificaciones,
  TIPOS_TODOS,
};

export default NotificacionService;
