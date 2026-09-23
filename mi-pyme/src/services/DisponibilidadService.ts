/**
 * DisponibilidadService - business logic for daily product/service availability.
 *
 * Modelo híbrido:
 *  - `DisponibilidadProducto`: oferta diaria explícita (fuente de verdad).
 *  - `Inventario`: stock físico global (se mantiene para reportes / punto de reorden).
 *  - Regla: cantidadDisponibleDia = min(ofertada - reservada, stockFisico).
 *    Si no hay registro de DisponibilidadProducto para el día → NO disponible.
 *  - Servicios: disponibilidad derivada de `Servicio.capacidad` y reservas activas.
 *
 * Framework-agnostic: no Next.js imports. Usa prisma via infra layer pattern.
 * Cachea con TTL corto (60s) e invalida al escribir.
 */

import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { ICache, getCache, cacheKeys, cacheTTL } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import {
  normalizarFecha,
  fechaHoy,
  formatFechaISO,
  horaLocal,
  esHoy,
} from "@/shared/utils/fecha";
import {
  HORA_CORTE_DISPONIBILIDAD,
  DIAS_VISTA_DISPONIBILIDAD,
  CODIGO_SIN_DISPONIBILIDAD,
  CODIGO_SIN_CUPO,
  CODIGO_FECHA_INVALIDA,
  CODIGO_FUERA_DE_HORARIO,
} from "@/core/constants";
import type {
  DisponibilidadProductoDTO,
  CuposServicioDTO,
  ListadoDisponibilidadDia,
} from "@/shared/disponibilidad.types";

const RESERVA_ESTADOS_ACTIVOS = ["pendiente", "confirmada"];

/** Devuelve las próximas `dias` fechas normalizadas (hoy incluido). */
function fechasProximas(dias: number): Date[] {
  const hoy = fechaHoy();
  const arr: Date[] = [];
  for (let i = 0; i < dias; i++) {
    const d = new Date(hoy);
    d.setUTCDate(d.getUTCDate() + i);
    arr.push(d);
  }
  return arr;
}

export class DisponibilidadService extends Service {
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
  }
  /**
   * Valida que la fecha no sea pasada ni (si es hoy) esté después de la hora de corte.
   */
  private validarFechaOperable(fechaNorm: Date): void {
    const hoy = fechaHoy();

    if (fechaNorm.getTime() < hoy.getTime()) {
      throw new BusinessError(
        "No se puede operar sobre fechas pasadas",
        CODIGO_FECHA_INVALIDA,
        400
      );
    }

    if (esHoy(fechaNorm) && horaLocal(new Date()) >= HORA_CORTE_DISPONIBILIDAD) {
      throw new BusinessError(
        "Ya no se vende para hoy",
        CODIGO_FUERA_DE_HORARIO,
        400
      );
    }
  }

  /**
   * Cuenta la cantidad reservada (en carritos activos + pedidos no cancelados)
   * para un producto y una fecha de entrega dada.
   *
   * TODO: En PostgreSQL migrar a transacción Serializable para evitar la
   *  ventana de carrera entre validar y persistir. En SQLite se usa
   *  `prisma.$transaction` en la creación de pedidos (ver PedidosService).
   */
  private async cantidadReservadaDelDia(
    productoId: string,
    fechaNorm: Date
  ): Promise<number> {
    const [enCarrito, enPedidos] = await Promise.all([
      prisma.carritoItem.aggregate({
        where: {
          productoId,
          fechaEntrega: fechaNorm,
          carrito: { estado: "activo" },
        },
        _sum: { cantidad: true },
      }),
      prisma.pedidoItem.aggregate({
        where: {
          productoId,
          fechaEntrega: fechaNorm,
          pedido: { estado: { not: "cancelada" } },
        },
        _sum: { cantidad: true },
      }),
    ]);

    const carritoSum = enCarrito._sum.cantidad ?? 0;
    const pedidosSum = enPedidos._sum.cantidad ?? 0;
    return carritoSum + pedidosSum;
  }

  async getDisponibilidadProducto(
    productoId: string,
    fecha?: Date | string | number
  ): Promise<DisponibilidadProductoDTO> {
    const fechaNorm = normalizarFecha(fecha);
    const fechaISO = formatFechaISO(fechaNorm);

    const cacheKey = cacheKeys.disponibilidad.producto(productoId, fechaISO);
    const cached = await this.cache.get<DisponibilidadProductoDTO>(cacheKey);
    if (cached) {
      return cached;
    }

    const [dispRecord, stockFisicoRaw, cantidadReservada] = await Promise.all([
      prisma.disponibilidadProducto.findUnique({
        where: {
          productoId_fecha: {
            productoId,
            fecha: fechaNorm,
          },
        },
      }),
      prisma.inventario.aggregate({
        where: { productoId },
        _sum: { cantidadActual: true },
      }),
      this.cantidadReservadaDelDia(productoId, fechaNorm),
    ]);

    const stockFisico = stockFisicoRaw._sum.cantidadActual ?? 0;

    let resultado: DisponibilidadProductoDTO;

    if (!dispRecord) {
      resultado = {
        cantidadOfertada: 0,
        cantidadReservada: 0,
        cantidadDisponible: 0,
        stockFisico,
        disponible: false,
      };
    } else {
      const ofertadaMenosReservada = Math.max(
        0,
        dispRecord.cantidad - cantidadReservada
      );
      const cantidadDisponible = Math.min(ofertadaMenosReservada, stockFisico);
      resultado = {
        cantidadOfertada: dispRecord.cantidad,
        cantidadReservada,
        cantidadDisponible,
        stockFisico,
        disponible: cantidadDisponible > 0,
      };
    }

    await this.cache.set(cacheKey, resultado, cacheTTL.disponibilidad);
    return resultado;
  }

  /**
   * Versión batch para listados: evita N+1 consultando disponibilidad de
   * varios productos en una sola pasada para una fecha dada.
   */
  async getDisponibilidadProductos(
    productoIds: string[],
    fecha?: Date | string | number
  ): Promise<Map<string, DisponibilidadProductoDTO>> {
    const fechaNorm = normalizarFecha(fecha);
    const fechaISO = formatFechaISO(fechaNorm);
    const mapa = new Map<string, DisponibilidadProductoDTO>();

    const missings: string[] = [];
    for (const id of productoIds) {
      const cached = await this.cache.get<DisponibilidadProductoDTO>(
        cacheKeys.disponibilidad.producto(id, fechaISO)
      );
      if (cached) {
        mapa.set(id, cached);
      } else {
        missings.push(id);
      }
    }

    if (missings.length === 0) {
      return mapa;
    }

    const [dispRecords, inventarios, reservasPorProducto] = await Promise.all([
      prisma.disponibilidadProducto.findMany({
        where: {
          productoId: { in: missings },
          fecha: fechaNorm,
        },
      }),
      prisma.inventario.groupBy({
        by: ["productoId"],
        where: { productoId: { in: missings } },
        _sum: { cantidadActual: true },
      }),
      Promise.all(
        missings.map((pid) => this.cantidadReservadaDelDia(pid, fechaNorm))
      ),
    ]);

    const inventarioPorProducto = new Map<string, number>();
    for (const inv of inventarios) {
      inventarioPorProducto.set(
        inv.productoId,
        inv._sum.cantidadActual ?? 0
      );
    }

    for (let i = 0; i < missings.length; i++) {
      const pid = missings[i]!;
      const dispRecord = dispRecords.find((d) => d.productoId === pid);
      const stockFisico = inventarioPorProducto.get(pid) ?? 0;
      const cantidadReservada = reservasPorProducto[i] ?? 0;

      let resultado: DisponibilidadProductoDTO;
      if (!dispRecord) {
        resultado = {
          cantidadOfertada: 0,
          cantidadReservada: 0,
          cantidadDisponible: 0,
          stockFisico,
          disponible: false,
        };
      } else {
        const ofertadaMenosReservada = Math.max(
          0,
          dispRecord.cantidad - cantidadReservada
        );
        const cantidadDisponible = Math.min(
          ofertadaMenosReservada,
          stockFisico
        );
        resultado = {
          cantidadOfertada: dispRecord.cantidad,
          cantidadReservada,
          cantidadDisponible,
          stockFisico,
          disponible: cantidadDisponible > 0,
        };
      }

      mapa.set(pid, resultado);
      await this.cache.set(
        cacheKeys.disponibilidad.producto(pid, fechaISO),
        resultado,
        cacheTTL.disponibilidad
      );
    }

    return mapa;
  }

  /**
   * Deriva cupos de un servicio para una fecha:
   * capacidad - reservas activas (pendiente/confirmada) cuyo inicio cae ese día.
   *
   * Simplificación: cuando el modelo no tiene franjas horarias, se asume
   * capacidad diaria total. TODO: futuras iteraciones pueden usar horariosDisponibles.
   */
  async getCuposServicio(
    servicioId: string,
    fecha?: Date | string | number
  ): Promise<CuposServicioDTO> {
    const fechaNorm = normalizarFecha(fecha);
    const fechaISO = formatFechaISO(fechaNorm);

    const cacheKey = cacheKeys.disponibilidad.servicio(servicioId, fechaISO);
    const cached = await this.cache.get<CuposServicioDTO>(cacheKey);
    if (cached) {
      return cached;
    }

    const servicio = await prisma.servicio.findUnique({
      where: { id: servicioId },
      select: { capacidad: true, activo: true },
    });

    if (!servicio || !servicio.activo) {
      const dto: CuposServicioDTO = {
        capacidad: 0,
        reservadas: 0,
        cuposDisponibles: 0,
        disponible: false,
      };
      await this.cache.set(cacheKey, dto, cacheTTL.disponibilidad);
      return dto;
    }

    const inicioDia = fechaNorm;
    const finDia = new Date(fechaNorm);
    finDia.setUTCDate(finDia.getUTCDate() + 1);

    const reservadas = await prisma.reserva.count({
      where: {
        servicioId,
        estado: { in: RESERVA_ESTADOS_ACTIVOS },
        fechaHoraInicio: { gte: inicioDia, lt: finDia },
      },
    });

    const cuposDisponibles = Math.max(0, servicio.capacidad - reservadas);
    const dto: CuposServicioDTO = {
      capacidad: servicio.capacidad,
      reservadas,
      cuposDisponibles,
      disponible: cuposDisponibles > 0,
    };

    await this.cache.set(cacheKey, dto, cacheTTL.disponibilidad);
    return dto;
  }

  async puedeComprarProducto(
    productoId: string,
    cantidad: number,
    fecha?: Date | string | number
  ): Promise<boolean> {
    const fechaNorm = normalizarFecha(fecha);
    this.validarFechaOperable(fechaNorm);

    if (cantidad < 1) {
      throw new BusinessError(
        "La cantidad debe ser al menos 1",
        "VALIDATION_ERROR",
        422
      );
    }

    const disp = await this.getDisponibilidadProducto(productoId, fechaNorm);

    if (!disp.disponible || disp.cantidadDisponible < cantidad) {
      throw new BusinessError(
        `No hay suficiente disponibilidad hoy (disponibles: ${disp.cantidadDisponible})`,
        CODIGO_SIN_DISPONIBILIDAD,
        409
      );
    }

    return true;
  }

  async puedeReservarServicio(
    servicioId: string,
    fecha?: Date | string | number,
    cantidad: number = 1
  ): Promise<boolean> {
    const fechaNorm = normalizarFecha(fecha);
    this.validarFechaOperable(fechaNorm);

    if (cantidad < 1) {
      throw new BusinessError(
        "La cantidad debe ser al menos 1",
        "VALIDATION_ERROR",
        422
      );
    }

    const cupos = await this.getCuposServicio(servicioId, fechaNorm);

    if (!cupos.disponible || cupos.cuposDisponibles < cantidad) {
      throw new BusinessError(
        `No hay cupos disponibles hoy (cupos: ${cupos.cuposDisponibles})`,
        CODIGO_SIN_CUPO,
        409
      );
    }

    return true;
  }

  /**
   * Placeholder: en la integración futura con pedidos, reserva la cantidad
   * marcando las unidades como no disponibles. Por ahora solo invalida caché.
   */
  async reservarCantidadProducto(
    productoId: string,
    cantidad: number,
    fecha?: Date | string | number
  ): Promise<void> {
    void cantidad;
    const fechaNorm = normalizarFecha(fecha);
    await this.invalidateProductoCache(productoId, fechaNorm);
  }

  /**
   * Placeholder: libera una reserva previamente hecha. Solo invalida caché.
   */
  async liberarCantidadProducto(
    productoId: string,
    cantidad: number,
    fecha?: Date | string | number
  ): Promise<void> {
    void cantidad;
    const fechaNorm = normalizarFecha(fecha);
    await this.invalidateProductoCache(productoId, fechaNorm);
  }

  async listarDisponibilidadSemana(
    productoId: string
  ): Promise<ListadoDisponibilidadDia[]> {
    const cached = await this.cache.get<ListadoDisponibilidadDia[]>(
      cacheKeys.disponibilidad.semana(productoId)
    );
    if (cached) {
      return cached;
    }

    const dias = fechasProximas(DIAS_VISTA_DISPONIBILIDAD);

    const resultados: ListadoDisponibilidadDia[] = await Promise.all(
      dias.map(async (f) => {
        const disp = await this.getDisponibilidadProducto(productoId, f);
        return {
          fecha: formatFechaISO(f),
          fechaNormalizada: f.toISOString(),
          cantidadOfertada: disp.cantidadOfertada,
          cantidadReservada: disp.cantidadReservada,
          cantidadDisponible: disp.cantidadDisponible,
          disponible: disp.disponible,
        };
      })
    );

    await this.cache.set(
      cacheKeys.disponibilidad.semana(productoId),
      resultados,
      cacheTTL.disponibilidad
    );
    return resultados;
  }

  async invalidateProductoCache(
    productoId: string,
    fecha?: Date | string | number
  ): Promise<void> {
    await this.cache.del(cacheKeys.disponibilidad.semana(productoId));

    if (fecha) {
      const fechaNorm = normalizarFecha(fecha);
      await this.cache.del(
        cacheKeys.disponibilidad.producto(productoId, formatFechaISO(fechaNorm))
      );
    } else {
      for (const f of fechasProximas(DIAS_VISTA_DISPONIBILIDAD + 1)) {
        await this.cache.del(
          cacheKeys.disponibilidad.producto(productoId, formatFechaISO(f))
        );
      }
    }
  }

  async invalidateServicioCache(
    servicioId: string,
    fecha?: Date | string | number
  ): Promise<void> {
    if (fecha) {
      const fechaNorm = normalizarFecha(fecha);
      await this.cache.del(
        cacheKeys.disponibilidad.servicio(servicioId, formatFechaISO(fechaNorm))
      );
    } else {
      for (const f of fechasProximas(DIAS_VISTA_DISPONIBILIDAD + 1)) {
        await this.cache.del(
          cacheKeys.disponibilidad.servicio(servicioId, formatFechaISO(f))
        );
      }
    }
  }
}

export default DisponibilidadService;
