/**
 * Business logic for user role requests.
 *
 * Framework-agnostic: no Next.js imports.
 */
import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { ICache, getCache, cacheKeys, cacheTTL } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import { NegocioService } from "./NegocioService";
import { LogisticaNegocioService } from "./LogisticaNegocioService";
import type {
  EstadoSolicitud,
  Negocio,
  Prisma,
  ProveedorLogistico,
  SolicitudAltaNegocio,
  TipoSolicitud,
} from "@/generated/prisma/client";
import type { SolicitudAltaDTO } from "@/shared/negocio.types";

const ESTADOS_SOLICITUD: readonly string[] = [
  "PENDIENTE_APROBACION",
  "APROBADA",
  "RECHAZADA",
  "CANCELADA",
  "SUSPENDIDA",
];

const TIPOS_SOLICITUD: readonly string[] = ["NEGOCIO", "LOGISTICA"];
type SolicitudListItem = Prisma.SolicitudAltaNegocioGetPayload<{
  include: {
    user: { select: { id: true; email: true; nombre: true } };
    area: true;
  };
}>;

const DIAS_DEFAULT = [
  { diaSemana: 1, horaApertura: "08:00", horaCierre: "18:00" },
  { diaSemana: 2, horaApertura: "08:00", horaCierre: "18:00" },
  { diaSemana: 3, horaApertura: "08:00", horaCierre: "18:00" },
  { diaSemana: 4, horaApertura: "08:00", horaCierre: "18:00" },
  { diaSemana: 5, horaApertura: "08:00", horaCierre: "18:00" },
  { diaSemana: 6, horaApertura: "08:00", horaCierre: "13:00" },
  { diaSemana: 0, horaApertura: "00:00", horaCierre: "00:00", cerrado: true },
];

function normalizeErrorCode(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
  return null;
}

function normalizeSlug(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "negocio";
}

function parseSubareaIds(value: string | null): string[] {
  if (!value) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new BusinessError(
      "La solicitud contiene una lista de subáreas no válida",
      "DATOS_SOLICITUD_INVALIDOS",
      409
    );
  }
  if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === "string")) {
    throw new BusinessError(
      "La solicitud contiene una lista de subáreas no válida",
      "DATOS_SOLICITUD_INVALIDOS",
      409
    );
  }
  return [...new Set(parsed)];
}

function estadoValido(value: string): value is EstadoSolicitud {
  return ESTADOS_SOLICITUD.includes(value);
}

function tipoValido(value: string): value is TipoSolicitud {
  return TIPOS_SOLICITUD.includes(value);
}

export class SolicitudAltaService extends Service {
  private negocioService: NegocioService;
  private logisticaService: LogisticaNegocioService;
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
    this.negocioService = new NegocioService(this.cache);
    this.logisticaService = new LogisticaNegocioService(this.cache);
  }

  async crearSolicitud(
    userId: string,
    datos: SolicitudAltaDTO
  ): Promise<SolicitudAltaNegocio> {
    if (!datos || typeof datos !== "object") {
      throw new BusinessError("Datos de solicitud no válidos", "VALIDACION", 400);
    }
    const requestedType: unknown = datos.tipo ?? "NEGOCIO";
    if (typeof requestedType !== "string" || !tipoValido(requestedType)) {
      throw new BusinessError("Tipo de solicitud no válido", "ROL_INVALIDO", 400);
    }
    const tipo = requestedType;
    if (
      typeof datos.nombreNegocio !== "string" ||
      datos.nombreNegocio.trim().length < 3
    ) {
      throw new BusinessError(
        "El nombre debe tener al menos 3 caracteres",
        "VALIDACION",
        400
      );
    }
    if (datos.telefono !== undefined && typeof datos.telefono !== "string") {
      throw new BusinessError("El teléfono no es válido", "VALIDACION", 400);
    }
    if (datos.emailContacto !== undefined && typeof datos.emailContacto !== "string") {
      throw new BusinessError("El email de contacto no es válido", "VALIDACION", 400);
    }
    if (!datos.telefono?.trim()) {
      throw new BusinessError("El teléfono es obligatorio", "VALIDACION", 400);
    }
    if (!datos.emailContacto?.trim()) {
      throw new BusinessError("El email de contacto es obligatorio", "VALIDACION", 400);
    }
    const telefono = datos.telefono.trim();
    const emailContacto = datos.emailContacto.trim().toLowerCase();
    if (tipo === "NEGOCIO" && !datos.areaId) {
      throw new BusinessError("Selecciona el área del negocio", "VALIDACION", 400);
    }
    if (
      datos.subareaIds !== undefined &&
      (!Array.isArray(datos.subareaIds) ||
        !datos.subareaIds.every((id) => typeof id === "string"))
    ) {
      throw new BusinessError("La lista de subáreas no es válida", "VALIDACION", 400);
    }
    const subareaIds = [...new Set(datos.subareaIds ?? [])];
    if (tipo === "LOGISTICA") {
      const tiposEnvio = datos.tiposEnvio ?? [];
      const permitidos = new Set(["paquete", "mudanza", "personas", "carga"]);
      if (
        !Array.isArray(tiposEnvio) ||
        tiposEnvio.length === 0 ||
        tiposEnvio.some((tipoEnvio) => !permitidos.has(tipoEnvio))
      ) {
        throw new BusinessError(
          "Selecciona al menos un tipo de envío válido",
          "VALIDACION",
          400
        );
      }
    }

    try {
      const solicitud = await prisma.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: {
              rol: true,
              isActive: true,
              deletedAt: true,
              email: true,
              negocios: { select: { id: true }, take: 1 },
              proveedoresLogisticos: { select: { id: true }, take: 1 },
            },
          });
          if (!user || !user.isActive || user.deletedAt) {
            throw new BusinessError("Usuario no encontrado o inactivo", "NO_AUTORIZADO", 403);
          }
          if (user.rol !== "CLIENTE") {
            throw new BusinessError(
              "Solo los usuarios CLIENTE pueden solicitar un cambio de rol",
              "ROL_INVALIDO",
              403
            );
          }
          if (user.negocios.length > 0 || user.proveedoresLogisticos.length > 0) {
            throw new BusinessError(
              "Ya tienes un perfil profesional asociado",
              "YA_TIENE_PERFIL",
              409
            );
          }

          const pendiente = await tx.solicitudAltaNegocio.findFirst({
            where: { userId, estado: "PENDIENTE_APROBACION" },
            select: { id: true },
          });
          if (pendiente) {
            throw new BusinessError(
              "Ya tienes una solicitud pendiente de aprobación",
              "SOLICITUD_PENDIENTE",
              409
            );
          }

          if (tipo === "NEGOCIO") {
            const area = await tx.area.findUnique({
              where: { id: datos.areaId! },
              select: { id: true, activo: true },
            });
            if (!area || !area.activo) {
              throw new BusinessError("El área seleccionada no está disponible", "VALIDACION", 400);
            }
            if (subareaIds.length > 0) {
              const subareas = await tx.subarea.findMany({
                where: {
                  id: { in: subareaIds },
                  areaId: area.id,
                  activo: true,
                },
                select: { id: true },
              });
              if (subareas.length !== subareaIds.length) {
                throw new BusinessError(
                  "Una o más subáreas no pertenecen al área seleccionada o ya no están disponibles",
                  "VALIDACION",
                  400
                );
              }
            }
          }

          const created = await tx.solicitudAltaNegocio.create({
            data: {
              userId,
              tipo,
              nombreNegocio: datos.nombreNegocio.trim(),
              descripcion: datos.descripcion?.trim() || undefined,
              areaId: tipo === "NEGOCIO" ? datos.areaId ?? undefined : undefined,
              subareaIds:
                tipo === "NEGOCIO" && subareaIds.length > 0
                  ? JSON.stringify(subareaIds)
                  : undefined,
              provincia: datos.provincia?.trim() || undefined,
              municipio: datos.municipio?.trim() || undefined,
              telefono,
              emailContacto,
              direccion: datos.direccion?.trim() || undefined,
              alcanceNacional: tipo === "LOGISTICA" ? Boolean(datos.alcanceNacional) : false,
              tiposEnvio:
                tipo === "LOGISTICA" ? JSON.stringify(datos.tiposEnvio) : undefined,
              estado: "PENDIENTE_APROBACION",
            },
          });

          await tx.auditLog.create({
            data: {
              eventType: "SOLICITUD_ROL_CREADA",
              actorId: userId,
              targetId: created.id,
              meta: { tipo, solicitudId: created.id },
            },
          });
          return created;
        },
        { isolationLevel: "Serializable" }
      );

      await this.invalidateSolicitudCache(solicitud.id);
      return solicitud;
    } catch (error: unknown) {
      if (normalizeErrorCode(error) === "P2034" || normalizeErrorCode(error) === "P2002") {
        throw new BusinessError(
          "Ya tienes una solicitud pendiente de aprobación",
          "SOLICITUD_PENDIENTE",
          409
        );
      }
      throw error;
    }
  }

  async listarSolicitudesUsuario(
    usuarioId: string,
    userId: string,
    rolActual?: string
  ): Promise<SolicitudAltaNegocio[]> {
    if (rolActual !== "ADMIN" && usuarioId !== userId) {
      throw new BusinessError(
        "No puedes ver las solicitudes de otro usuario",
        "NO_AUTORIZADO",
        403
      );
    }

    return prisma.solicitudAltaNegocio.findMany({
      where: { userId: usuarioId },
      include: {
        user: { select: { id: true, email: true, nombre: true } },
        area: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async tieneSolicitudPendiente(userId: string): Promise<boolean> {
    const solicitud = await prisma.solicitudAltaNegocio.findFirst({
      where: { userId, estado: "PENDIENTE_APROBACION" },
      select: { id: true },
    });
    return solicitud !== null;
  }

  async listarSolicitudes(
    estado?: string,
    tipo?: string
  ): Promise<SolicitudListItem[]> {
    let estadoFiltro: EstadoSolicitud | undefined;
    let tipoFiltro: TipoSolicitud | undefined;
    if (estado) {
      if (!estadoValido(estado)) {
        throw new BusinessError("Estado de solicitud no válido", "VALIDACION", 400);
      }
      estadoFiltro = estado;
    }
    if (tipo) {
      if (!tipoValido(tipo)) {
        throw new BusinessError("Tipo de solicitud no válido", "VALIDACION", 400);
      }
      tipoFiltro = tipo;
    }

    const cacheKey = `solicitudes:${estadoFiltro ?? "todas"}:${tipoFiltro ?? "todos"}`;
    const cached = await this.cache.get<SolicitudListItem[]>(cacheKey);
    if (cached) return cached;

    const solicitudes = await prisma.solicitudAltaNegocio.findMany({
      where: {
        ...(estadoFiltro ? { estado: estadoFiltro } : {}),
        ...(tipoFiltro ? { tipo: tipoFiltro } : {}),
      },
      include: {
        user: { select: { id: true, email: true, nombre: true } },
        area: true,
      },
      orderBy: { createdAt: "desc" },
    });
    await this.cache.set(cacheKey, solicitudes, cacheTTL.solicitudes);
    return solicitudes;
  }

  async getSolicitud(
    id: string,
    userId: string,
    rolActual?: string
  ): Promise<SolicitudAltaNegocio> {
    const solicitud = await prisma.solicitudAltaNegocio.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, nombre: true } },
        area: true,
      },
    });
    if (!solicitud) {
      throw new BusinessError("Solicitud no encontrada", "NO_ENCONTRADO", 404);
    }
    if (rolActual !== "ADMIN" && solicitud.userId !== userId) {
      throw new BusinessError(
        "No tienes permiso para ver esta solicitud",
        "NO_AUTORIZADO",
        403
      );
    }
    return solicitud;
  }

  async cancelarSolicitud(id: string, userId: string): Promise<SolicitudAltaNegocio> {
    const result = await prisma.$transaction(async (tx) => {
      const solicitud = await tx.solicitudAltaNegocio.findUnique({
        where: { id },
        select: { userId: true, estado: true },
      });
      if (!solicitud) {
        throw new BusinessError("Solicitud no encontrada", "NO_ENCONTRADO", 404);
      }
      if (solicitud.userId !== userId) {
        throw new BusinessError(
          "No puedes cancelar una solicitud que no es tuya",
          "NO_AUTORIZADO",
          403
        );
      }
      if (solicitud.estado !== "PENDIENTE_APROBACION") {
        throw new BusinessError(
          "Solo se pueden cancelar solicitudes pendientes",
          "ESTADO_INVALIDO",
          409
        );
      }

      const cancelled = await tx.solicitudAltaNegocio.update({
        where: { id },
        data: { estado: "CANCELADA", motivoRechazo: "Cancelada por el usuario" },
      });
      await tx.auditLog.create({
        data: {
          eventType: "SOLICITUD_ROL_CANCELADA",
          actorId: userId,
          targetId: id,
          meta: { solicitudId: id },
        },
      });
      return cancelled;
    });
    await this.invalidateSolicitudCache(id);
    return result;
  }

  async aprobarSolicitud(
    solicitudId: string,
    adminId: string
  ): Promise<{
    negocio: Negocio | null;
    proveedorLogistico: ProveedorLogistico | null;
    solicitud: SolicitudAltaNegocio;
  }> {
    const result = await prisma.$transaction(
      async (tx) => {
        const admin = await tx.user.findUnique({
          where: { id: adminId },
          select: { rol: true, isActive: true, deletedAt: true },
        });
        if (!admin || admin.rol !== "ADMIN" || !admin.isActive || admin.deletedAt) {
          throw new BusinessError("Acceso denegado", "NO_AUTORIZADO", 403);
        }

        const solicitud = await tx.solicitudAltaNegocio.findUnique({
          where: { id: solicitudId },
          include: { user: true, area: true },
        });
        if (!solicitud) {
          throw new BusinessError("Solicitud no encontrada", "NO_ENCONTRADO", 404);
        }
        if (solicitud.estado !== "PENDIENTE_APROBACION") {
          throw new BusinessError(
            "Solo se pueden aprobar solicitudes pendientes",
            "ESTADO_INVALIDO",
            409
          );
        }
        if (solicitud.user.rol !== "CLIENTE" || !solicitud.user.isActive || solicitud.user.deletedAt) {
          throw new BusinessError(
            "El usuario ya no puede recibir el rol solicitado",
            "ROL_INVALIDO",
            409
          );
        }

        const [negocioExistente, proveedorExistente] = await Promise.all([
          tx.negocio.findFirst({
            where: { userId: solicitud.userId },
            select: { id: true },
          }),
          tx.proveedorLogistico.findFirst({
            where: { usuarioId: solicitud.userId },
            select: { id: true },
          }),
        ]);
        if (negocioExistente || proveedorExistente) {
          throw new BusinessError(
            "El usuario ya tiene un perfil profesional asociado",
            "YA_TIENE_PERFIL",
            409
          );
        }

        let negocio: Negocio | null = null;
        let proveedorLogistico: ProveedorLogistico | null = null;

        if (solicitud.tipo === "NEGOCIO") {
          const subareaIds = parseSubareaIds(solicitud.subareaIds);
          if (subareaIds.length > 0) {
            if (!solicitud.areaId) {
              throw new BusinessError(
                "La solicitud no indica el área de las subáreas",
                "DATOS_SOLICITUD_INVALIDOS",
                409
              );
            }
            const subareas = await tx.subarea.findMany({
              where: {
                id: { in: subareaIds },
                areaId: solicitud.areaId,
                activo: true,
              },
              select: { id: true },
            });
            if (subareas.length !== subareaIds.length) {
              throw new BusinessError(
                "Una o más subáreas de la solicitud ya no están disponibles",
                "DATOS_SOLICITUD_INVALIDOS",
                409
              );
            }
          }
          const slugBase = normalizeSlug(solicitud.nombreNegocio);
          let slug = slugBase;
          let intento = 0;
          while (
            await tx.negocio.findUnique({
              where: { slug },
              select: { id: true },
            })
          ) {
            intento += 1;
            slug = `${slugBase}-${intento}`;
          }

          negocio = await tx.negocio.create({
            data: {
              nombre: solicitud.nombreNegocio,
              descripcion: solicitud.descripcion ?? undefined,
              slug,
              estado: "ACTIVO",
              areaId: solicitud.areaId ?? undefined,
              userId: solicitud.userId,
              provincia: solicitud.provincia ?? undefined,
              municipio: solicitud.municipio ?? undefined,
              telefono: solicitud.telefono ?? undefined,
              emailContacto: solicitud.emailContacto ?? undefined,
              direccion: solicitud.direccion ?? undefined,
              permiteReservas: true,
              permiteEnvio: true,
              aprobadoPorId: adminId,
              aprobadoEn: new Date(),
            },
          });
          if (subareaIds.length > 0) {
            await tx.negocioSubarea.createMany({
              data: subareaIds.map((subareaId) => ({
                negocioId: negocio!.id,
                subareaId,
              })),
            });
          }

          await tx.horarioNegocio.createMany({
            data: DIAS_DEFAULT.map((dia) => ({
              negocioId: negocio!.id,
              diaSemana: dia.diaSemana,
              horaApertura: dia.horaApertura,
              horaCierre: dia.horaCierre,
              cerrado: "cerrado" in dia && dia.cerrado === true,
            })),
          });
        } else {
          const zonaCobertura = solicitud.alcanceNacional
            ? "Nacional"
            : [
                solicitud.provincia,
                solicitud.municipio,
                solicitud.direccion,
              ]
                .filter((value): value is string => Boolean(value?.trim()))
                .join(", ") || "Por definir";
          proveedorLogistico = await tx.proveedorLogistico.create({
            data: {
              usuarioId: solicitud.userId,
              nombre: solicitud.nombreNegocio,
              zonaCobertura,
              alcanceNacional: solicitud.alcanceNacional,
              contacto:
                solicitud.telefono ??
                solicitud.emailContacto ??
                solicitud.user.email,
            },
          });
        }

        const updatedSolicitud = await tx.solicitudAltaNegocio.update({
          where: { id: solicitudId },
          data: {
            estado: "APROBADA",
            revisadoPorId: adminId,
            revisadoEn: new Date(),
          },
        });
        await tx.user.update({
          where: { id: solicitud.userId },
          data: {
            rol: solicitud.tipo,
            sessionVersion: { increment: 1 },
          },
        });
        await tx.auditLog.create({
          data: {
            eventType: "SOLICITUD_ROL_APROBADA",
            actorId: adminId,
            targetId: solicitudId,
            meta: {
              tipo: solicitud.tipo,
              userId: solicitud.userId,
              negocioId: negocio?.id ?? null,
              proveedorLogisticoId: proveedorLogistico?.id ?? null,
            },
          },
        });
        return { negocio, proveedorLogistico, solicitud: updatedSolicitud };
      },
      { isolationLevel: "Serializable" }
    );

    await this.invalidateSolicitudCache(solicitudId);
    await this.cache.del(cacheKeys.usuario.detalle(result.solicitud.userId));
    await this.cache.del(cacheKeys.negocio.porUsuario(result.solicitud.userId));
    if (result.negocio) {
      await this.negocioService.invalidateCache(result.negocio.id);
    }
    if (result.proveedorLogistico) {
      await this.logisticaService.invalidateCache();
    }
    return result;
  }

  async rechazarSolicitud(
    solicitudId: string,
    adminId: string,
    motivo: string
  ): Promise<SolicitudAltaNegocio> {
    const trimmedMotivo = motivo.trim();
    if (trimmedMotivo.length < 20) {
      throw new BusinessError(
        "El motivo de rechazo debe tener al menos 20 caracteres",
        "VALIDACION",
        400
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const admin = await tx.user.findUnique({
        where: { id: adminId },
        select: { rol: true, isActive: true, deletedAt: true },
      });
      if (!admin || admin.rol !== "ADMIN" || !admin.isActive || admin.deletedAt) {
        throw new BusinessError("Acceso denegado", "NO_AUTORIZADO", 403);
      }
      const solicitud = await tx.solicitudAltaNegocio.findUnique({
        where: { id: solicitudId },
        select: { estado: true },
      });
      if (!solicitud) {
        throw new BusinessError("Solicitud no encontrada", "NO_ENCONTRADO", 404);
      }
      if (solicitud.estado !== "PENDIENTE_APROBACION") {
        throw new BusinessError(
          "Solo se pueden rechazar solicitudes pendientes",
          "ESTADO_INVALIDO",
          409
        );
      }

      const rejected = await tx.solicitudAltaNegocio.update({
        where: { id: solicitudId },
        data: {
          estado: "RECHAZADA",
          motivoRechazo: trimmedMotivo,
          revisadoPorId: adminId,
          revisadoEn: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          eventType: "SOLICITUD_ROL_RECHAZADA",
          actorId: adminId,
          targetId: solicitudId,
          meta: { motivo: trimmedMotivo },
        },
      });
      return rejected;
    });
    await this.invalidateSolicitudCache(solicitudId);
    return result;
  }

  private async invalidateSolicitudCache(id: string): Promise<void> {
    await Promise.all([
      this.cache.del(cacheKeys.solicitudes.pending()),
      this.cache.del(cacheKeys.solicitudes.detail(id)),
      this.cache.del("solicitudes"),
      this.cache.del("solicitudes:PENDIENTE_APROBACION:todos"),
      this.cache.del("solicitudes:APROBADA:todos"),
      this.cache.del("solicitudes:RECHAZADA:todos"),
      this.cache.del("solicitudes:CANCELADA:todos"),
      this.cache.del("solicitudes:SUSPENDIDA:todos"),
    ]);
  }
}

export default SolicitudAltaService;
