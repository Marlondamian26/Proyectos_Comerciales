/**
 * DTOs y tipos compartidos para el checkout con logística elegible.
 * Framework-agnostic.
 */
import type { MetodoPago, TipoEntrega, ModoPrecio, RegimenFiscal, TratamientoIVA } from "@/generated/prisma/client";

export type { MetodoPago, TipoEntrega };

export type DecimalValue = number | string;

export interface NegocioCheckoutDTO {
  id: string;
  nombre: string;
  direccion: string | null;
  provincia: string | null;
  municipio: string | null;
  permiteEnvio: boolean;
  regimenFiscal?: RegimenFiscal | null;
  tasaIVA?: DecimalValue | null;
  modoPrecio?: ModoPrecio | null;
}

export interface ItemCheckoutDTO {
  id: string;
  productoId?: string | null;
  servicioId?: string | null;
  cantidad: number;
  precioUnitario: number;
  tipo: string;
  fechaEntrega?: Date | null;
  producto?: { id: string; nombre: string; precio: number; imagenUrl?: string } | null;
  servicio?: { id: string; nombre: string; imagenUrl?: string | null } | null;
  tratamientoIVA?: TratamientoIVA | null;
  tasaIVA?: DecimalValue | null;
  tasaIVAOverride?: DecimalValue | null;
  precioUnitarioBase?: DecimalValue | null;
  precioUnitarioConIVA?: DecimalValue | null;
  baseImponible?: DecimalValue | null;
  montoIVA?: DecimalValue | null;
  subtotal?: DecimalValue | null;
}

export interface OpcionLogisticaCheckoutDTO {
  id: string;
  nombre: string;
  tipo: string;
  costo: number;
  tiempoEstimado: string;
}

export interface GrupoCheckoutDTO {
  negocioId: string;
  negocio: NegocioCheckoutDTO;
  items: ItemCheckoutDTO[];
  subtotal: number;
  iva: number;
  baseImponible?: DecimalValue | null;
  montoIVA?: DecimalValue | null;
  totalConIVA?: DecimalValue | null;
  total?: DecimalValue | null;
  regimenFiscal?: RegimenFiscal | null;
  tasaIVA?: DecimalValue | null;
  modoPrecio?: ModoPrecio | null;
  opcionesLogistica: OpcionLogisticaCheckoutDTO[];
  puedeRecogerEnTienda: boolean;
  disponibilidadOk: boolean;
  erroresDisponibilidad: string[];
}

export interface TotalesCheckoutDTO {
  subtotal: number;
  iva: number;
  envio: number;
  total: number;
  baseImponible?: DecimalValue | null;
  montoIVA?: DecimalValue | null;
  totalConIVA?: DecimalValue | null;
  regimenFiscal?: RegimenFiscal | null;
  tasaIVA?: DecimalValue | null;
  modoPrecio?: ModoPrecio | null;
}

export interface CheckoutPreparadoDTO {
  checkoutToken: string;
  grupos: GrupoCheckoutDTO[];
  totales: TotalesCheckoutDTO;
  direccionUsuario?: string | null;
}

export interface SeleccionEntregaGrupo {
  negocioId: string;
  tipoEntrega: "DOMICILIO" | "RECOGIDA_TIENDA";
  opcionLogisticaId?: string;
  direccionEntrega?: string;
  notas?: string;
}

export interface DatosPagoCheckout {
  referencia?: string | null;
  comprobanteUrl?: string | null;
  notasCliente?: string | null;
}

export interface ConfirmarCheckoutPayload {
  checkoutToken: string;
  fechaEntrega?: Date | string;
  metodoPago?: MetodoPago;
  datosPago?: DatosPagoCheckout;
  grupos: SeleccionEntregaGrupo[];
}

export interface PedidoCreadoDTO {
  id: string;
  negocioId: string;
  total: number;
  estado: string;
  codigoEntrega?: string | null;
}

export interface RecalcularSeleccion {
  grupos: SeleccionEntregaGrupo[];
}

export interface ConfirmarCheckoutResultDTO {
  pedidosCreados: PedidoCreadoDTO[];
  totalGeneral: number;
}
