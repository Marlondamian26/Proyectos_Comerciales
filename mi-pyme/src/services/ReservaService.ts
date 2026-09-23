/**
 * ReservaService - business logic for service reservations.
 *
 * Encapsula las operaciones de reserva con validacion de TTL y capacidad.
 * Framework-agnostic: puede ser usado por Server Actions, API Routes, o Nest.js.
 */

import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { ICache, getCache } from "@/infrastructure";
import { cacheKeys, cachePrefixes, cacheTTL } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import { DisponibilidadService } from "./DisponibilidadService";
import type { Reserva, Servicio } from "@/generated/prisma/client";

const RESERVA_TTL_MS = 15 * 60 * 1000;

export interface CrearReservaParams {
  servicioId: string;
  fechaHoraInicio: string;
}

export interface ListarReservasParams {
  estado?: string[];
}

export class ReservaService extends Service {
  private dispService: DisponibilidadService;
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
    this.dispService = new DisponibilidadService(cache);
  }

  async listarReservas(
    userId: string,
    params: ListarReservasParams = {}
  ): Promise<Reserva[]> {
    void params;
    const cacheKey = cacheKeys.reservas.usuario(userId);
    const cached = await this.cache.get<Reserva[]>(cacheKey);
    if (cached) return cached;

    const reservas = await prisma.reserva.findMany({
      where: {
        usuarioId: userId,
        estado: {
          in: params.estado || ["pendiente", "confirmada"],
        },
      },
      include: {
        servicio: true,
        negocio: true,
      },
      orderBy: { fechaHoraFin: "desc" },
    });

    await this.cache.set(cacheKey, reservas, cacheTTL.reservas);
    return reservas;
  }

  async crearReserva(
    userId: string,
    datos: CrearReservaParams
  ): Promise<Reserva> {
    const fechaIni = new Date(datos.fechaHoraInicio);

    const servicio = await prisma.servicio.findUnique({
      where: { id: datos.servicioId },
      select: {
        id: true,
        activo: true,
        duracionMinutos: true,
        capacidad: true,
        negocioId: true,
      },
    });

    if (!servicio) {
      throw new BusinessError("Servicio no encontrado");
    }

    if (!servicio.activo) {
      throw new BusinessError("Servicio no disponible");
    }

    await this.dispService.puedeReservarServicio(
      datos.servicioId,
      fechaIni,
      1
    );

    const fechaFin = new Date(
      fechaIni.getTime() + servicio.duracionMinutos * 60 * 1000
    );

    const venceEn = new Date(Date.now() + RESERVA_TTL_MS);

    const reserva = await prisma.reserva.create({
      data: {
        usuarioId: userId,
        servicioId: datos.servicioId,
        negocioId: servicio.negocioId,
        fechaHoraInicio: fechaIni,
        fechaHoraFin: fechaFin,
        venceEn,
        estado: "pendiente",
      },
    });

    await this.cache.del(cacheKeys.reservas.usuario(userId));
    await this.dispService.invalidateServicioCache(servicio.id, fechaIni);

    return reserva;
  }

  async cancelarReserva(
    reservaId: string,
    userId?: string
  ): Promise<void> {
    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
      select: { servicioId: true },
    });

    await prisma.reserva.update({
      where: { id: reservaId },
      data: { estado: "cancelada" },
    });

    if (userId) {
      await this.cache.del(cacheKeys.reservas.usuario(userId));
    }
    if (reserva?.servicioId) {
      await this.dispService.invalidateServicioCache(
        reserva.servicioId,
        new Date()
      );
    }
  }

  async invalidateCache(userId: string): Promise<void> {
    await this.cache.del(cacheKeys.reservas.usuario(userId));
  }
}

export default ReservaService;
