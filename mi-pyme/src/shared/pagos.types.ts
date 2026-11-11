/**
 * DTOs y tipos compartidos para el flujo de pago (Fase 1 — Punto 5).
 * Framework-agnostic.
 */
import type { MetodoPago, EstadoPago } from "@/generated/prisma/client";

export type { MetodoPago, EstadoPago };

export interface CrearPagoParams {
  pedidoId: string;
  metodo: MetodoPago;
  monto?: number;
  moneda?: string;
  referencia?: string | null;
  comprobanteUrl?: string | null;
  idTransferencia?: string | null;
  entidadPago?: string | null;
  fechaTransferencia?: Date | null;
  notasCliente?: string | null;
}

export interface SubirComprobanteParams {
  referencia?: string | null;
  comprobanteUrl?: string | null;
  idTransferencia?: string | null;
  entidadPago?: string | null;
  fechaTransferencia?: Date | null;
  notasCliente?: string | null;
}

export interface ConfirmarPagoParams {
  notasNegocio?: string | null;
}

export interface ConfirmarPagoConCodigoParams {
  codigoIngresado: string;
}

export interface ConfirmarPagoManualParams {
  motivo: string;
}

export interface RegenerarCodigoParams {
  motivo: string;
}

export interface PagoDTO {
  id: string;
  pedidoId: string;
  facturaId: string | null;
  metodo: MetodoPago;
  estado: EstadoPago;
  monto: number;
  moneda: string;
  referencia: string | null;
  comprobanteUrl: string | null;
  idTransferencia: string | null;
  entidadPago: string | null;
  fechaTransferencia: Date | null;
  idTransferenciaReembolso: string | null;
  fechaReembolso: Date | null;
  notasCliente: string | null;
  notasNegocio: string | null;
  confirmadoPorId: string | null;
  confirmadoEn: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PagoCodigosEntregaDTO {
  codigoEntregaHash: string | null;
  codigoEntregaExpira: Date | null;
  codigoEntregaIntentos: number;
  codigoEntregaRegeneraciones: number;
  codigoEntregaUsadoEn: Date | null;
  codigoEntregaBloqueado: boolean;
  confirmacionManual: boolean;
  motivoConfirmacionManual: string | null;
  codigoEntrega: string | null;
}

export interface PagoConRelacionesDTO extends PagoDTO, PagoCodigosEntregaDTO {
  pedido: {
    id: string;
    total: number;
    estado: string;
    tipoEntrega: "DOMICILIO" | "RECOGIDA_TIENDA";
    direccionEntrega: string | null;
    fechaEntrega: Date | null;
    negocio: {
      id: string;
      nombre: string;
      direccion: string | null;
    };
    usuario: {
      id: string;
      email: string;
      nombre: string | null;
    };
  };
  factura: {
    id: string;
    numero: string;
  } | null;
}

export interface ListPagosFiltros {
  estado?: EstadoPago[];
  metodo?: MetodoPago[];
  entidadPago?: string[];
  idTransferencia?: string;
  negocioId?: string;
  desde?: Date;
  hasta?: Date;
  page?: number;
  limit?: number;
}

export interface ResumenPagosDTO {
  totalCobrado: number;
  totalPendiente: number;
  totalReembolsado: number;
  totalFallido: number;
  porMetodo: Record<string, { completado: number; pendiente: number; total: number }>;
  porEstado: Record<string, number>;
  cantidadTotal: number;
}

export interface ResumenPagosPorEntidadDTO {
  totalCobrado: number;
  totalPendiente: number;
  totalReembolsado: number;
  totalFallido: number;
  porEntidad: Record<string, { completado: number; pendiente: number; total: number; count: number }>;
  porEstado: Record<string, number>;
  cantidadTotal: number;
}
