/**
 * ReservaService - business logic for service reservations.
 *
 * Encapsula las operaciones de reserva con validacion de TTL y capacidad.
 * Framework-agnostic: puede ser usado por Server Actions, API Routes, o Nest.js.
 */

import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { getCache } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import type { Reserva, Servicio } from "@/generated/prisma/client";

const RESERVA_TTL_MS = 15 * 60 * 1000;

export interface CrearReservaParams {
  servicioId: string;
  fechaHoraFincio: string;
}

export interface ListarReservasParams {
  estado?: string[];
}

export class ReservaService extends Service {
  async listarReservas(
    userId: string,
    params: ListarReservasParams = {}
  ): Promise<Reserva[]> {
    const cacheKey = "reservas:" + userId;
    const cached = getCache().get<Reserva[]>(cacheKey);
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

    getCache().set(cacheKey, reservas);
    return reservas;
  }

  async crearReserva(
    userId: string,
    datos: CrearReservaParams
  ): Promise<Reserva> {
    const fechaIni = new Date;

    const servicio = await prisma.servicio.findUnique({
      where: { id: datos.servicioId },
      select: {
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

    const fechaFin = new Date(
      fechaIni.getTime() + servicio.duracionMinutos * 60 * 1000
    );

    const existingCount = await prisma.reserva.count({
      where: {
        servicioId: datos.servicioId,
        fechaHoraFin: fechaIni,
        estado: { not: "cancelada" },
      },
    });

    if (existingCount >= servicio.capacidad) {
      throw new BusinessError("Servicio sin disponibilidad en esta fecha y hora");
    }

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

    getCache().del("reservas:" + userId);

    return reserva;
  }

  async cancelarReserva(
    reservaId: string,
    userId?: string
  ): Promise<void> {
    await prisma.reserva.update({
      where: { id: reservaId },
      data: { estado: "cancelada" },
    });

    if (userId) {
      getCache().del("reservas:" + userId);
    }
  }

  invalidateCache(userId: string): void {
    getCache().del("reservas:" + userId);
  }
}