/**
 * DTOs y tipos compartidos para la disponibilidad diaria.
 * Framework-agnostic.
 */

export interface DisponibilidadProductoDTO {
  cantidadOfertada: number;
  cantidadReservada: number;
  cantidadDisponible: number;
  stockFisico: number;
  disponible: boolean;
}

export interface CuposServicioDTO {
  capacidad: number;
  reservadas: number;
  cuposDisponibles: number;
  disponible: boolean;
}

export interface ListadoDisponibilidadDia {
  fecha: string;
  fechaNormalizada: string;
  cantidadOfertada: number;
  cantidadReservada: number;
  cantidadDisponible: number;
  disponible: boolean;
}

export interface ItemCarritoConDisponibilidad {
  id: string;
  productoId?: string | null;
  servicioId?: string | null;
  cantidad: number;
  precioUnitario: number;
  tipo: string;
  fechaEntrega?: Date | null;
  producto?: { id: string; nombre: string; precio: number; imagenUrl?: string } | null;
  servicio?: { id: string; nombre: string; imagenUrl?: string } | null;
  disponibilidad: DisponibilidadProductoDTO | null;
  cupos: CuposServicioDTO | null;
  problema: string | null;
}

export interface ValidacionCarritoItem {
  itemId: string;
  productoId?: string | null;
  servicioId?: string | null;
  cantidad: number;
  fechaEntrega: Date;
  problema: string | null;
}
