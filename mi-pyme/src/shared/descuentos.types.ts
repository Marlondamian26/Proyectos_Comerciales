/**
 * DTOs y tipos compartidos para promociones, cupones y combos.
 * Framework-agnostic.
 */
import type { Prisma } from "@/generated/prisma/client";
import type { TipoDescuento, EstadoPromocion, EstadoCupon } from "@/generated/prisma/client";
import type { JsonValue } from "@/shared/checkout.types";

export type { TipoDescuento, EstadoPromocion, EstadoCupon };

export interface ItemCarritoParaDescuento {
  id: string;
  productoId?: string | null;
  servicioId?: string | null;
  cantidad: number;
  precioUnitario: number;
  tipo: string;
  negocioId: string;
  producto?: {
    id: string;
    nombre: string;
    precio: number;
    imagenUrl?: string;
    negocioId?: string;
    subareaId?: string;
    tratamientoIVA?: string;
    tasaIVAOverride?: string | null;
  } | null;
  servicio?: {
    id: string;
    nombre: string;
    imagenUrl?: string;
    negocioId?: string;
    subareaId?: string;
    tratamientoIVA?: string;
    tasaIVAOverride?: string | null;
    tipo?: string;
    tipoTransporte?: string;
    precio?: number;
  } | null;
  metadata?: JsonValue;
}

export interface DescuentoItem {
  id: string;
  productoId?: string | null;
  servicioId?: string | null;
  cantidad: number;
  precioOriginal: number;
  precioConDescuento: number;
  descuento: number;
}

export interface DescuentoPorNegocio {
  negocioId: string;
  itemsOriginales: DescuentoItem[];
  subtotalOriginal: number;
  subtotalConDescuento: number;
  descuentoTotal: number;
  envioGratis: boolean;
  promocionesAplicadas: Array<{
    id: string;
    nombre: string;
    tipo: TipoDescuento;
    descuento: number;
  }>;
}

export interface DescuentoComboPorNegocio {
  negocioId: string;
  descuentoAsignado: number;
  items: Array<{
    id: string;
    productoId?: string | null;
    servicioId?: string | null;
    cantidad: number;
    precioOriginal: number;
    precioConDescuento: number;
  }>;
}

export interface ResultadoDescuentos {
  grupos: DescuentoPorNegocio[];
  comboAplicado: {
    comboId: string;
    nombre: string;
    descuentoTotal: number;
    repartoNegocios: DescuentoComboPorNegocio[];
    itemsDescompuestos: Array<{
      productoId?: string | null;
      servicioId?: string | null;
      cantidad: number;
      negocioId: string;
      precioOriginal: number;
      precioConDescuento: number;
      tratamientoIVA?: string;
      tasaIVAOverride?: string | null;
      baseImponible: number;
      montoIVA: number;
      subtotal: number;
    }>;
  } | null;
  cuponAplicado: {
    cuponId: string;
    codigo: string;
    tipo: TipoDescuento;
    valor: number | null;
    descuentoTotal: number;
  } | null;
  descuentoTotal: number;
  subtotalOriginal: number;
  subtotalConDescuento: number;
  iva: number;
  envio: number;
  total: number;
  baseImponible: number;
  montoIVA: number;
}

export interface PromocionDTO {
  id: string;
  negocioId: string;
  nombre: string;
  descripcion?: string | null;
  tipo: TipoDescuento;
  valor?: Prisma.Decimal | null;
  productoIds: string[];
  servicioIds: string[];
  subareaIds: string[];
  montoMinimo?: Prisma.Decimal | null;
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
  usosMaximos?: number | null;
  usosPorUsuario?: number | null;
  usosActuales: number;
  exclusiva: boolean;
  estado: EstadoPromocion;
  createdAt: Date;
  updatedAt: Date;
}

export interface CuponDTO {
  id: string;
  codigo: string;
  descripcion?: string | null;
  tipo: TipoDescuento;
  valor?: Prisma.Decimal | null;
  negocioId?: string | null;
  montoMinimo?: Prisma.Decimal | null;
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
  usosMaximos?: number | null;
  usosPorUsuario?: number | null;
  usosActuales: number;
  unaVezPorUsuario: boolean;
  primeraCompra: boolean;
  estado: EstadoCupon;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComboItemDTO {
  id: string;
  comboId: string;
  productoId?: string | null;
  servicioId?: string | null;
  cantidad: number;
}

export interface ComboDTO {
  id: string;
  nombre: string;
  descripcion?: string | null;
  imagen?: string | null;
  precio: Prisma.Decimal;
  negocioId?: string | null;
  activo: boolean;
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
  usosMaximos?: number | null;
  usosActuales: number;
  items: ComboItemDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CrearPromocionParams {
  negocioId: string;
  nombre: string;
  descripcion?: string | null;
  tipo: TipoDescuento;
  valor?: number | string | null;
  productoIds?: string[];
  servicioIds?: string[];
  subareaIds?: string[];
  montoMinimo?: number | string | null;
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
  usosMaximos?: number | null;
  usosPorUsuario?: number | null;
  exclusiva?: boolean;
  estado?: EstadoPromocion;
}

export interface ActualizarPromocionParams {
  nombre?: string;
  descripcion?: string | null;
  tipo?: TipoDescuento;
  valor?: number | string | null;
  productoIds?: string[];
  servicioIds?: string[];
  subareaIds?: string[];
  montoMinimo?: number | string | null;
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
  usosMaximos?: number | null;
  usosPorUsuario?: number | null;
  exclusiva?: boolean;
  estado?: EstadoPromocion;
}

export interface CrearCuponParams {
  codigo: string;
  descripcion?: string | null;
  tipo: TipoDescuento;
  valor?: number | string | null;
  negocioId?: string | null;
  montoMinimo?: number | string | null;
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
  usosMaximos?: number | null;
  usosPorUsuario?: number | null;
  unaVezPorUsuario?: boolean;
  primeraCompra?: boolean;
  estado?: EstadoCupon;
}

export interface ActualizarCuponParams {
  codigo?: string;
  descripcion?: string | null;
  tipo?: TipoDescuento;
  valor?: number | string | null;
  negocioId?: string | null;
  montoMinimo?: number | string | null;
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
  usosMaximos?: number | null;
  usosPorUsuario?: number | null;
  unaVozPorUsuario?: boolean;
  unaVezPorUsuario?: boolean;
  primeraCompra?: boolean;
  estado?: EstadoCupon;
}

export interface CrearComboParams {
  nombre: string;
  descripcion?: string | null;
  imagen?: string | null;
  precio: number | string;
  negocioId?: string | null;
  activo?: boolean;
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
  usosMaximos?: number | null;
  items: Array<{
    productoId?: string | null;
    servicioId?: string | null;
    cantidad: number;
  }>;
}

export interface ActualizarComboParams {
  nombre?: string;
  descripcion?: string | null;
  imagen?: string | null;
  precio?: number | string;
  negocioId?: string | null;
  activo?: boolean;
  fechaInicio?: Date | null;
  fechaFin?: Date | null;
  usosMaximos?: number | null;
  items?: Array<{
    id?: string;
    productoId?: string | null;
    servicioId?: string | null;
    cantidad: number;
  }>;
}

export interface ValidarCuponResult {
  valido: boolean;
  cupon?: CuponDTO;
  errores: string[];
}

export interface AplicarCuponResult {
  descuentoTotal: number;
  detalle: Array<{
    negocioId: string;
    descuento: number;
  }>;
}
