/**
 * DTOs y tipos compartidos para el panel de autogestión del negocio (Fase 1 — Punto 3).
 * Framework-agnostic.
 */

import type {
  Negocio,
  HorarioNegocio,
  SolicitudAltaNegocio,
  RegimenFiscal,
  ModoPrecio,
  TratamientoIVA,
} from "@/generated/prisma/client";

export interface DatosFiscalesDTO {
  regimenFiscal: RegimenFiscal;
  tasaIVA: number | string;
  modoPrecio: ModoPrecio;
  nit?: string | null;
  direccionFiscal?: string | null;
  telefonoFiscal?: string | null;
  emailFiscal?: string | null;
  confirmarCambioRegimen?: boolean;
}

export interface NegocioDTO {
  id?: string;
  nombre: string;
  descripcion?: string | null;
  slug?: string;
  areaId?: string | null;
  subareaIds?: string[];
  provincia?: string | null;
  municipio?: string | null;
  telefono?: string | null;
  emailContacto?: string | null;
  direccion?: string | null;
  permiteReservas: boolean;
  permiteEnvio: boolean;
  estado?: string;
}

export interface HorarioNegocioDTO {
  id?: string;
  negocioId?: string;
  diaSemana: number;
  horaApertura: string;
  horaCierre: string;
  cerrado: boolean;
}

export interface SolicitudAltaDTO {
  nombreNegocio: string;
  descripcion?: string | null;
  areaId?: string | null;
  subareaIds?: string[];
  provincia?: string | null;
  municipio?: string | null;
  telefono?: string | null;
  emailContacto?: string | null;
  direccion?: string | null;
}

export interface ProductoNegocioDTO {
  id?: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  unidadMedida: string;
  imagenUrl: string;
  subareaId: string;
  activo?: boolean;
  disponibleHoy?: boolean;
  tratamientoIVA?: TratamientoIVA;
  tasaIVAOverride?: number | string | null;
}

export interface ServicioNegocioDTO {
  id?: string;
  nombre: string;
  descripcion?: string | null;
  duracionMinutos: number;
  capacidad: number;
  imagenUrl: string;
  horariosDisponibles: Record<string, string[]>;
  subareaId: string;
  activo?: boolean;
  permiteReservas?: boolean;
  tratamientoIVA?: TratamientoIVA;
  tasaIVAOverride?: number | string | null;
}

export interface InventarioDTO {
  cantidadActual: number;
  puntoReorden: number;
  ubicacion: string;
}

export interface OpcionLogisticaDTO {
  id?: string;
  proveedorId: string;
  nombre: string;
  tipo: string;
  tarifaBase: number;
  tarifaPorDistancia: number;
  tiempoEstimado: string;
}

export interface DashboardResumenDTO {
  pedidosPendientes: number;
  reservasProximas: number;
  ventasPeriodo: number;
  stockBajo: number;
  disponibleHoyCount: number;
  negocio: { id: string; nombre: string };
}

export interface DashboardFiscalDTO {
  negocio: { id: string; nombre: string };
  totalFacturado: number;
  montoIVA: number;
  numeroFacturas: number;
  facturasEmitidas: number;
  facturasPendientes: number;
  tasaIVA: number;
  regimenFiscal: string;
  nit: string | null;
}

export type NegocioConHorarios = Negocio & { horarios: HorarioNegocio[] };
export type SolicitudConUsuario = SolicitudAltaNegocio & { user: { id: string; email: string; nombre: string | null } };
