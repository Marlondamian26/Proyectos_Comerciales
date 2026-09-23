/**
 * NegocioService - business logic for negocio self-management.
 *
 * Encapsulates: datos generales, horarios, estado de aprobación,
 * listado de negocios por usuario, operaciones de aprobación/rechazo
 * de solicitudes de alta (solo ADMIN), y datos fiscales.
 *
 * Framework-agnostic: no Next.js imports.
 */
import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { ICache, getCache, cacheKeys, cachePrefixes, cacheTTL } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import { assertPertenencia } from "./utils/permisos";
import { logAudit } from "./utils/audit";
import type { Negocio, HorarioNegocio } from "@/generated/prisma/client";
import type {
  NegocioDTO,
  HorarioNegocioDTO,
  DashboardFiscalDTO,
} from "@/shared/negocio.types";

const DIAS_DEFAULT: { diaSemana: number; horaApertura: string; horaCierre: string; cerrado: boolean }[] = [
  { diaSemana: 1, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 2, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 3, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 4, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 5, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 6, horaApertura: "08:00", horaCierre: "13:00", cerrado: false },
  { diaSemana: 0, horaApertura: "00:00", horaCierre: "00:00", cerrado: true },
];

const REGIMENES_SIN_IVA = ["SIMPLIFICADO", "EXENTO", "NO_SUJETO"];

export class NegocioService extends Service {
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
  }

  /**
   * Devuelve el negocio si el usuario es propietario/gestor o ADMIN.
   */
  async getNegocio(id: string, userId: string, rolActual?: string): Promise<Negocio | null> {
    await assertPertenencia(userId, id, rolActual);
    return prisma.negocio.findUnique({
      where: { id },
      include: {
        area: true,
        subareas: { include: { subarea: true } },
        horarios: true,
      },
    });
  }

  /**
   * Negocios donde el usuario es propietario (1:1 actual) o gestor (N:N Fase 2).
   */
  async listNegociosDeUsuario(userId: string): Promise<Negocio[]> {
    return prisma.negocio.findMany({
      where: {
        OR: [{ userId }, { negocioUsuarios: { some: { userId } } }],
      },
      include: {
        area: true,
        subareas: { include: { subarea: true } },
        horarios: { orderBy: { diaSemana: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Indica si el usuario es propietario de al menos un negocio (activa o no).
   * Usado por el middleware para el workaround C8: un cliente que es dueño de
   * un negocio puede acceder a /negocio sin necesidad de tener rol NEGOCIO.
   */
  async esPropietarioDeAlgunNegocio(userId: string): Promise<boolean> {
    const cacheKey = cacheKeys.negocio.porUsuario(userId);
    const cached = await this.cache.get<boolean>(cacheKey);
    if (cached !== undefined) return cached;

    const negocio = await prisma.negocio.findFirst({
      where: { userId },
      select: { id: true },
    });

    const result = !!negocio;
    await this.cache.set(cacheKey, result, cacheTTL.negocioUsuario);
    return result;
  }

  /**
    * Actualiza datos generales del negocio (valida permisos).
    */
  async actualizarNegocio(id: string, datos: Partial<NegocioDTO>, userId: string, rolActual?: string): Promise<Negocio> {
    await assertPertenencia(userId, id, rolActual);

    const data: Record<string, unknown> = {
      nombre: datos.nombre,
      descripcion: datos.descripcion ?? undefined,
      provincia: datos.provincia ?? undefined,
      municipio: datos.municipio ?? undefined,
      telefono: datos.telefono ?? undefined,
      emailContacto: datos.emailContacto ?? undefined,
      direccion: datos.direccion ?? undefined,
      permiteReservas: datos.permiteReservas,
      permiteEnvio: datos.permiteEnvio,
    };

    if (datos.areaId !== undefined) {
      data.areaId = datos.areaId;
    }

    const negocio = await prisma.negocio.update({
      where: { id },
      data,
    });

    this.invalidateCache(negocio.id);
    return negocio;
  }

  /**
   * Upsert masivo de horarios semanales.
   */
  async actualizarHorarios(negocioId: string, horarios: HorarioNegocioDTO[], userId: string, rolActual?: string): Promise<HorarioNegocio[]> {
    await assertPertenencia(userId, negocioId, rolActual);

    await prisma.$transaction(async (tx) => {
      await tx.horarioNegocio.deleteMany({ where: { negocioId } });

      const toCreate = horarios.map((h) => ({
        negocioId,
        diaSemana: h.diaSemana,
        horaApertura: h.horaApertura,
        horaCierre: h.horaCierre,
        cerrado: h.cerrado,
      }));

      if (toCreate.length > 0) {
        await tx.horarioNegocio.createMany({ data: toCreate });
      }
    });

    this.invalidateCache(negocioId);
    return prisma.horarioNegocio.findMany({ where: { negocioId }, orderBy: { diaSemana: "asc" } });
  }

  /**
   * Indica si el negocio tiene horario abierto hoy.
   */
  async estaAbiertoHoy(negocioId: string): Promise<boolean> {
    const hoy = new Date().getDay(); // 0 = domingo, 1 = lunes...
    const horario = await prisma.horarioNegocio.findFirst({
      where: { negocioId, diaSemana: hoy },
    });

    if (!horario || horario.cerrado) {
      return false;
    }

    const ahora = new Date();
    const [hApertura, mApertura] = horario.horaApertura.split(":").map(Number);
    const [hCierre, mCierre] = horario.horaCierre.split(":").map(Number);
    const aperturaMin = hApertura * 60 + mApertura;
    const cierreMin = hCierre * 60 + mCierre;
    const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();

    return ahoraMin >= aperturaMin && ahoraMin < cierreMin;
  }

  // -- Datos fiscales --

  /**
   * Obtiene los datos fiscales de un negocio.
   */
  async getDatosFiscales(
    negocioId: string,
    userId: string,
    rolActual?: string
  ): Promise<{
    regimenFiscal: string;
    tasaIVA: number;
    modoPrecio: string;
    nit: string | null;
    direccionFiscal: string | null;
    telefonoFiscal: string | null;
    emailFiscal: string | null;
     numeroFacturaConsecutivo: number;
     prefijoFactura: string;
   }> {
    await assertPertenencia(userId, negocioId, rolActual);

    const negocio = await prisma.negocio.findUnique({
      where: { id: negocioId },
      select: {
        regimenFiscal: true,
        tasaIVA: true,
        modoPrecio: true,
        nit: true,
        direccionFiscal: true,
        telefonoFiscal: true,
        emailFiscal: true,
         numeroFacturaConsecutivo: true,
         prefijoFactura: true,
      },
    });

    if (!negocio) {
      throw new BusinessError("Negocio no encontrado", "NO_ENCONTRADO", 404);
    }

    return {
      regimenFiscal: negocio.regimenFiscal,
      tasaIVA: Number(negocio.tasaIVA),
      modoPrecio: negocio.modoPrecio,
      nit: negocio.nit,
      direccionFiscal: negocio.direccionFiscal,
      telefonoFiscal: negocio.telefonoFiscal,
      emailFiscal: negocio.emailFiscal,
      numeroFacturaConsecutivo: negocio.numeroFacturaConsecutivo,
      prefijoFactura: negocio.prefijoFactura,
    };
  }

  /**
   * Actualiza los datos fiscales del negocio.
   * Valida que solo el propietario o ADMIN pueda cambiarlo.
   * Si cambia el régimen a SIMPLIFICADO/EXENTO/NO_SUJETO, fuerza tasaIVA = 0.
   */
  async actualizarDatosFiscales(
    negocioId: string,
    datos: {
      regimenFiscal?: string;
      tasaIVA?: number | string;
      modoPrecio?: string;
      nit?: string | null;
      direccionFiscal?: string | null;
      telefonoFiscal?: string | null;
       emailFiscal?: string | null;
       prefijoFactura?: string;
       confirmarCambioRegimen?: boolean;
     },
     userId: string,
     rolActual?: string
   ): Promise<{ regimenFiscal: string; tasaIVA: number; modoPrecio: string; nit: string | null; prefijoFactura: string }> {
    await assertPertenencia(userId, negocioId, rolActual);

    let tasaIVA = datos.tasaIVA !== undefined ? Number(datos.tasaIVA) : undefined;

    if (
      datos.regimenFiscal &&
      REGIMENES_SIN_IVA.includes(datos.regimenFiscal) &&
      datos.confirmarCambioRegimen !== false
    ) {
      tasaIVA = 0;
    }

    const data: Record<string, unknown> = {};
    if (datos.regimenFiscal !== undefined) data.regimenFiscal = datos.regimenFiscal;
    if (tasaIVA !== undefined) data.tasaIVA = tasaIVA;
    if (datos.modoPrecio !== undefined) data.modoPrecio = datos.modoPrecio;
    if (datos.nit !== undefined) data.nit = datos.nit;
    if (datos.direccionFiscal !== undefined) data.direccionFiscal = datos.direccionFiscal;
    if (datos.telefonoFiscal !== undefined) data.telefonoFiscal = datos.telefonoFiscal;
    if (datos.emailFiscal !== undefined) data.emailFiscal = datos.emailFiscal;
    if (datos.prefijoFactura !== undefined) data.prefijoFactura = datos.prefijoFactura;

    await prisma.negocio.update({
      where: { id: negocioId },
      data,
    });

    await logAudit("DATOS_FISCALES_ACTUALIZADOS", userId, negocioId, {
      regimenFiscal: data.regimenFiscal,
      tasaIVA: data.tasaIVA,
      modoPrecio: data.modoPrecio,
    });

    const negocio = await prisma.negocio.findUnique({
      where: { id: negocioId },
      select: {
        regimenFiscal: true,
        tasaIVA: true,
        modoPrecio: true,
        nit: true,
        prefijoFactura: true,
      },
    });

    this.invalidateCache(negocioId);

    return {
      regimenFiscal: negocio!.regimenFiscal,
      tasaIVA: Number(negocio!.tasaIVA),
       modoPrecio: negocio!.modoPrecio,
       nit: negocio!.nit,
       prefijoFactura: negocio!.prefijoFactura,
    };
  }

  /**
   * KPIs fiscales del negocio: total facturado, IVA repercutido, número de facturas.
   */
  async getKPIsFiscales(
    negocioId: string,
    userId: string,
    rolActual?: string,
    rangoFechas?: { desde?: Date; hasta?: Date }
  ): Promise<DashboardFiscalDTO> {
    await assertPertenencia(userId, negocioId, rolActual);

    const cacheKey = cacheKeys.negocio.dashboardFiscal(negocioId, rangoFechas ?? {});
    const cached = await this.cache.get<DashboardFiscalDTO>(cacheKey);
    if (cached) return cached;

    const desde = rangoFechas?.desde ?? new Date(0);
    const hasta = rangoFechas?.hasta ?? new Date();

    const negocio = await prisma.negocio.findUnique({
      where: { id: negocioId },
      select: {
        id: true,
        nombre: true,
        tasaIVA: true,
        regimenFiscal: true,
        nit: true,
      },
    });

    if (!negocio) {
      throw new BusinessError("Negocio no encontrado", "NO_ENCONTRADO", 404);
    }

    const facturas = await prisma.factura.findMany({
      where: {
        negocioId,
        fecha: { gte: desde, lte: hasta },
      },
      select: { total: true, baseImponible: true, montoIVA: true, estado: true },
    });

    const totalFacturado = Number(
      facturas.reduce((sum, f) => sum + (Number(f.total) || 0), 0)
    );
    const montoIVA = Number(
      facturas.reduce((sum, f) => sum + (Number(f.montoIVA) || 0), 0)
    );

    const resultado: DashboardFiscalDTO = {
      negocio: { id: negocio.id, nombre: negocio.nombre },
      totalFacturado,
      montoIVA,
      numeroFacturas: facturas.length,
      facturasEmitidas: facturas.filter((f) => f.estado === "emitida" || f.estado === "pagada").length,
      facturasPendientes: facturas.filter((f) => f.estado === "pendiente").length,
      tasaIVA: Number(negocio.tasaIVA),
      regimenFiscal: negocio.regimenFiscal,
      nit: negocio.nit,
    };

    await this.cache.set(cacheKey, resultado, cacheTTL.dashboardFiscal);
    return resultado;
  }

  // -- Operaciones ADMIN (aprobación de solicitudes) --

  async listarNegociosPendientes(): Promise<Negocio[]> {
    return prisma.negocio.findMany({
      where: { estado: "PENDIENTE_APROBACION" },
      include: { area: true, user: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async listarNegociosPorEstado(estado: string): Promise<Negocio[]> {
    return prisma.negocio.findMany({
      where: { estado: estado as "PENDIENTE_APROBACION" | "ACTIVO" | "SUSPENDIDO" | "RECHAZADO" },
      include: { area: true, user: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  async aprobarNegocio(negocioId: string, adminId: string): Promise<Negocio> {
    const negocio = await prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { id: true, estado: true, userId: true },
    });

    if (!negocio) {
      throw new BusinessError("Negocio no encontrado", "NO_ENCONTRADO", 404);
    }

    if (negocio.estado !== "PENDIENTE_APROBACION") {
      throw new BusinessError(
        "Solo se pueden aprobar negocios en estado PENDIENTE_APROBACION",
        "ESTADO_INVALIDO",
        409
      );
    }

    const result = await prisma.negocio.update({
      where: { id: negocioId },
      data: {
        estado: "ACTIVO",
        aprobadoPorId: adminId,
        aprobadoEn: new Date(),
        motivoRechazo: null,
      },
    });

     if (negocio.userId) {
      const user = await prisma.user.findUnique({
        where: { id: negocio.userId },
        select: { rol: true },
      });
      if (user && user.rol !== "NEGOCIO" && user.rol !== "ADMIN") {
        await prisma.user.update({
          where: { id: negocio.userId },
          data: {
            rol: "NEGOCIO",
            sessionVersion: { increment: 1 },
          },
        });
        await this.cache.del(cacheKeys.usuario.detalle(negocio.userId));
        await this.cache.del(cacheKeys.negocio.porUsuario(negocio.userId));
      }
    }

    await logAudit("NEGOCIO_APROBADO", adminId, negocioId, {
      estadoAnterior: negocio.estado,
      estadoNuevo: "ACTIVO",
      sessionVersionIncrementado: true,
    });

    this.invalidateCache(negocioId);
    return result;
  }

  async rechazarNegocio(negocioId: string, adminId: string, motivo: string): Promise<Negocio> {
    const negocio = await prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { id: true, estado: true },
    });

    if (!negocio) {
      throw new BusinessError("Negocio no encontrado", "NO_ENCONTRADO", 404);
    }

    if (negocio.estado !== "PENDIENTE_APROBACION") {
      throw new BusinessError(
        "Solo se pueden rechazar negocios en estado PENDIENTE_APROBACION",
        "ESTADO_INVALIDO",
        409
      );
    }

    if (!motivo || motivo.trim().length < 5) {
      throw new BusinessError("El motivo de rechazo es obligatorio", "VALIDACION", 400);
    }

    const result = await prisma.negocio.update({
      where: { id: negocioId },
      data: {
        estado: "RECHAZADO",
        motivoRechazo: motivo,
      },
    });

    await logAudit("NEGOCIO_RECHAZADO", adminId, negocioId, { motivo });

    this.invalidateCache(negocioId);
    return result;
  }

  async suspenderNegocio(negocioId: string, adminId: string): Promise<Negocio> {
    const negocio = await prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { id: true, estado: true },
    });

    if (!negocio) {
      throw new BusinessError("Negocio no encontrado", "NO_ENCONTRADO", 404);
    }

    if (negocio.estado !== "ACTIVO") {
      throw new BusinessError(
        "Solo se pueden suspender negocios activos",
        "ESTADO_INVALIDO",
        409
      );
    }

    const result = await prisma.negocio.update({
      where: { id: negocioId },
      data: { estado: "SUSPENDIDO" },
    });

    await logAudit("NEGOCIO_SUSPENDIDO", adminId, negocioId, {});

    this.invalidateCache(negocioId);
    return result;
  }

  async reactivarNegocio(negocioId: string, adminId: string): Promise<Negocio> {
    const negocio = await prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { id: true, estado: true },
    });

    if (!negocio) {
      throw new BusinessError("Negocio no encontrado", "NO_ENCONTRADO", 404);
    }

    if (negocio.estado !== "SUSPENDIDO") {
      throw new BusinessError(
        "Solo se pueden reactivar negocios suspendidos",
        "ESTADO_INVALIDO",
        409
      );
    }

    const result = await prisma.negocio.update({
      where: { id: negocioId },
      data: { estado: "ACTIVO", aprobadoPorId: adminId, aprobadoEn: new Date() },
    });

    if (result.userId) {
      const user = await prisma.user.findUnique({
        where: { id: result.userId },
        select: { rol: true },
      });
      if (user && user.rol !== "NEGOCIO" && user.rol !== "ADMIN") {
        await prisma.user.update({
          where: { id: result.userId },
          data: {
            rol: "NEGOCIO",
            sessionVersion: { increment: 1 },
          },
        });
        await this.cache.del(cacheKeys.usuario.detalle(result.userId));
        await this.cache.del(cacheKeys.negocio.porUsuario(result.userId));
      }
    }

    await logAudit("NEGOCIO_REACTIVADO", adminId, negocioId, {
      sessionVersionIncrementado: result.userId ? true : false,
    });

    this.invalidateCache(negocioId);
    return result;
  }

  async invalidateCache(negocioId?: string, userId?: string): Promise<void> {
    await this.cache.invalidatePrefix(cachePrefixes.negocio);
    if (negocioId) {
      await this.cache.del(cacheKeys.negocio.detalle(negocioId));
      await this.cache.invalidatePrefix("negocio:" + negocioId + ":dashboard:fiscal");
      await this.cache.del(cacheKeys.logistica.checkout(negocioId));
    }
    if (userId) {
      await this.cache.del(cacheKeys.negocio.porUsuario(userId));
    }
  }
}

export default NegocioService;
