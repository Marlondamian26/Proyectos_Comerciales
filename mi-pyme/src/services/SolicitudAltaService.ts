/**
 * SolicitudAltaService - business logic for the business registration request flow.
 *
 * Permite a un usuario CLIENTE/NEGOCIO crear una solicitud de alta de negocio.
 * El ADMIN aprueba/rechaza. Al aprobar, se crea el Negocio real en estado ACTIVO
 * y se enlaza al User.
 *
 * Framework-agnostic: no Next.js imports.
 */
import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { ICache, getCache, cacheKeys, cachePrefixes, cacheTTL } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import { logAudit } from "./utils/audit";
import { NegocioService } from "./NegocioService";
import type { SolicitudAltaNegocio } from "@/generated/prisma/client";
import type { SolicitudAltaDTO } from "@/shared/negocio.types";

export class SolicitudAltaService extends Service {
  private negocioService: NegocioService;
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
    this.negocioService = new NegocioService(this.cache);
  }

  /**
   * Crea una solicitud de alta. Valida que el usuario no tenga ya un negocio activo.
   */
  async crearSolicitud(userId: string, datos: SolicitudAltaDTO): Promise<SolicitudAltaNegocio> {
    if (!datos.nombreNegocio || datos.nombreNegocio.trim().length < 3) {
      throw new BusinessError(
        "El nombre del negocio debe tener al menos 3 caracteres",
        "VALIDACION",
        400
      );
    }

    if (!datos.telefono) {
      throw new BusinessError("El teléfono es obligatorio", "VALIDACION", 400);
    }

    if (!datos.emailContacto) {
      throw new BusinessError("El email de contacto es obligatorio", "VALIDACION", 400);
    }

    const negocioActivo = await prisma.negocio.findFirst({
      where: { userId, estado: "ACTIVO" },
    });

    if (negocioActivo) {
      throw new BusinessError(
        "Ya tienes un negocio activo. No puedes crear otra solicitud.",
        "CONFLICTO",
        409
      );
    }

    const solicitudExistente = await prisma.solicitudAltaNegocio.findFirst({
      where: { userId, estado: "PENDIENTE_APROBACION" },
    });

    if (solicitudExistente) {
      throw new BusinessError(
        "Ya tienes una solicitud pendiente de aprobación",
        "CONFLICTO",
        409
      );
    }

    const slugBase = datos.nombreNegocio
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]/g, "");

    const solicitud = await prisma.solicitudAltaNegocio.create({
      data: {
        userId,
        nombreNegocio: datos.nombreNegocio,
        descripcion: datos.descripcion ?? undefined,
        areaId: datos.areaId ?? undefined,
        subareaIds: datos.subareaIds && datos.subareaIds.length > 0
          ? JSON.stringify(datos.subareaIds)
          : undefined,
        provincia: datos.provincia ?? undefined,
        municipio: datos.municipio ?? undefined,
        telefono: datos.telefono,
        emailContacto: datos.emailContacto,
        direccion: datos.direccion ?? undefined,
        estado: "PENDIENTE_APROBACION",
      },
    });

    await this.cache.del(cacheKeys.solicitudes.pending());
    return solicitud;
  }

  /**
    * Lista las solicitudes de un usuario específico. El propio usuario o ADMIN.
    */
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

  /**
    * Lista solicitudes, opcionalmente filtradas por estado. Solo ADMIN.
   */
  async listarSolicitudes(estado?: string): Promise<SolicitudAltaNegocio[]> {
    const cacheKey = estado
      ? cacheKeys.solicitudes.byEstado(estado)
      : "solicitudes";

    const cached = await this.cache.get<SolicitudAltaNegocio[]>(cacheKey);
    if (cached) return cached;

    const solicitudes = await prisma.solicitudAltaNegocio.findMany({
      where: estado ? { estado: estado as "PENDIENTE_APROBACION" | "ACTIVO" | "SUSPENDIDO" | "RECHAZADO" } : {},
      include: {
        user: { select: { id: true, email: true, nombre: true } },
        area: true,
      },
      orderBy: { createdAt: "desc" },
    });

    await this.cache.set(cacheKey, solicitudes, cacheTTL.solicitudes);
    return solicitudes;
  }

  /**
   * Obtiene una solicitud. El propietario o ADMIN pueden verla.
   */
  async getSolicitud(id: string, userId: string, rolActual?: string): Promise<SolicitudAltaNegocio | null> {
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

  /**
   * Cancela una solicitud pendiente (solo el propietario).
   */
  async cancelarSolicitud(id: string, userId: string): Promise<SolicitudAltaNegocio> {
    const solicitud = await prisma.solicitudAltaNegocio.findUnique({
      where: { id },
      select: { userId: true, estado: true },
    });

    if (!solicitud) {
      throw new BusinessError("Solicitud no encontrada", "NO_ENCONTRADO", 404);
    }

    if (solicitud.userId !== userId) {
      throw new BusinessError("No puedes cancelar una solicitud que no es tuya", "NO_AUTORIZADO", 403);
    }

    if (solicitud.estado !== "PENDIENTE_APROBACION") {
      throw new BusinessError(
        "Solo se pueden cancelar solicitudes pendientes",
        "ESTADO_INVALIDO",
        409
      );
    }

    const result = await prisma.solicitudAltaNegocio.update({
      where: { id },
      data: { estado: "RECHAZADO", motivoRechazo: "Cancelada por el usuario" },
    });

    await this.cache.del(cacheKeys.solicitudes.pending());
    await this.cache.del(cacheKeys.solicitudes.detail(id));
    return result;
  }

  /**
    * Aprueba una solicitud: crea el Negocio real y lo enlaza al usuario.
   * Solo ADMIN.
   */
  async aprobarSolicitud(solicitudId: string, adminId: string): Promise<{ negocio: Awaited<ReturnType<typeof prisma.negocio.findUnique>>; solicitud: SolicitudAltaNegocio }> {
    const solicitud = await prisma.solicitudAltaNegocio.findUnique({
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

    const slugBase = solicitud.nombreNegocio
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]/g, "");

    let slug = slugBase;
    let intento = 0;
    while (await prisma.negocio.findUnique({ where: { slug }, select: { id: true } })) {
      intento++;
      slug = `${slugBase}-${intento}`;
    }

    const negocio = await prisma.negocio.create({
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

    // Horarios por defecto
    const DIAS_DEFAULT = [
      { diaSemana: 1, horaApertura: "08:00", horaCierre: "18:00" },
      { diaSemana: 2, horaApertura: "08:00", horaCierre: "18:00" },
      { diaSemana: 3, horaApertura: "08:00", horaCierre: "18:00" },
      { diaSemana: 4, horaApertura: "08:00", horaCierre: "18:00" },
      { diaSemana: 5, horaApertura: "08:00", horaCierre: "18:00" },
      { diaSemana: 6, horaApertura: "08:00", horaCierre: "13:00" },
      { diaSemana: 0, horaApertura: "00:00", horaCierre: "00:00", cerrado: true },
    ];

    await prisma.horarioNegocio.createMany({
      data: DIAS_DEFAULT.map((d) => ({
        negocioId: negocio.id,
        diaSemana: d.diaSemana,
        horaApertura: d.horaApertura,
        horaCierre: d.horaCierre,
        cerrado: d.diaSemana === 0,
      })),
    });

    // Marcar solicitud como aprobada
    await prisma.solicitudAltaNegocio.update({
      where: { id: solicitudId },
      data: {
        estado: "ACTIVO",
        revisadoPorId: adminId,
        revisadoEn: new Date(),
      },
    });

    // Otorgar rol NEGOCIO al usuario si no lo tiene
    const userActual = await prisma.user.findUnique({
      where: { id: solicitud.userId },
      select: { rol: true },
    });

    if (userActual && userActual.rol !== "NEGOCIO" && userActual.rol !== "ADMIN") {
      await prisma.user.update({
        where: { id: solicitud.userId },
        data: { rol: "NEGOCIO" },
      });
       await this.cache.del(cacheKeys.usuario.detalle(solicitud.userId));
    }

    await logAudit("SOLICITUD_APROBADA", adminId, solicitudId, { negocioId: negocio.id });

    await this.cache.del(cacheKeys.solicitudes.pending());
    await this.cache.del(cacheKeys.solicitudes.detail(solicitudId));
    this.negocioService.invalidateCache(negocio.id);

    return { negocio, solicitud };
  }

  /**
    * Rechaza una solicitud con motivo. Solo ADMIN.
    */
  async rechazarSolicitud(solicitudId: string, adminId: string, motivo: string): Promise<SolicitudAltaNegocio> {
    const solicitud = await prisma.solicitudAltaNegocio.findUnique({
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

    if (!motivo || motivo.trim().length < 5) {
      throw new BusinessError("El motivo de rechazo es obligatorio", "VALIDACION", 400);
    }

    const result = await prisma.solicitudAltaNegocio.update({
      where: { id: solicitudId },
      data: {
        estado: "RECHAZADO",
        motivoRechazo: motivo,
        revisadoPorId: adminId,
        revisadoEn: new Date(),
      },
    });

    await logAudit("SOLICITUD_RECHAZADA", adminId, solicitudId, { motivo });

    await this.cache.del(cacheKeys.solicitudes.pending());
    await this.cache.del(cacheKeys.solicitudes.detail(solicitudId));
    return result;
  }
}

export default SolicitudAltaService;
