/**
 * Shared types for the notifications domain.
 *
 * Framework-agnostic: usable by Server Actions, API Routes, or future Nest.js services.
 */
import type {
  TipoNotificacion,
  EstadoNotificacion,
  CanalNotificacion,
  Notificacion as PrismaNotificacion,
  PreferenciaNotificacion as PrismaPreferencia,
} from "@/generated/prisma/client";

export {
  TipoNotificacion,
  EstadoNotificacion,
  CanalNotificacion,
};

export type Notificacion = PrismaNotificacion;
export type PreferenciaNotificacion = PrismaPreferencia;

/** Categorías para agrupar tipos de notificación en la UI de preferencias. */
export type CategoriaNotificacion = "pedidos" | "reservas" | "pagos" | "cuenta" | "sistema";

/** Mapeo de TipoNotificacion -> categoría. */
export const CATEGORIA_NOTIFICACION: Record<TipoNotificacion, CategoriaNotificacion> =
  {
    PEDIDO_CREADO: "pedidos",
    PEDIDO_ESTADO_CAMBIADO: "pedidos",
    PEDIDO_ASIGNADO_LOGISTICA: "pedidos",
    RESERVA_CREADA: "reservas",
    RESERVA_CANCELADA: "reservas",
    PAGO_COMPROBANTE_SUBIDO: "pagos",
    PAGO_CONFIRMADO: "pagos",
    PAGO_RECHAZADO: "pagos",
    PAGO_REEMBOLSADO: "pagos",
    CODIGO_ENTREGA_REGENERADO: "pagos",
    SOLICITUD_ALTA_CREADA: "sistema",
    SOLICITUD_ALTA_APROBADA: "sistema",
    SOLICITUD_ALTA_RECHAZADA: "sistema",
    DISPONIBILIDAD_AGOTADA: "sistema",
    STOCK_BAJO: "sistema",
    TRANSPORTE_CONTRATADO: "sistema",
    CUPON_PROXIMO_A_EXPIRAR: "sistema",
    PROMOCION_AGOTADA: "sistema",
    BIENVENIDA: "cuenta",
    PASSWORD_CAMBIADO: "cuenta",
    LOGIN_NUEVO_DISPOSITIVO: "cuenta",
  };

/** Etiquetas legibles para cada categoría. */
export const ETIQUETA_CATEGORIA: Record<CategoriaNotificacion, string> = {
  pedidos: "Pedidos",
  reservas: "Reservas",
  pagos: "Pagos",
  cuenta: "Cuenta",
  sistema: "Sistema",
};

/** Destinatario abstracto resuelto por el servicio. */
export interface DestinoNotificacion {
  userId: string;
  tipo: "usuario";
}

export interface EventoNotificacion {
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  enlace?: string | null;
  metadata?: Record<string, unknown> | null;
  actorId?: string | null;
  destinatarios?: DestinoNotificacion[];
  /**
   * Alternativas de resolución directa (mutuamente excluyentes con `destinatarios`).
   * Usado cuando el emisor conoce userId o negocioId pero no ha resuelto aún.
   */
  destinatarioUserId?: string | null;
  destinatarioNegocioId?: string | null;
  destinatarioRol?: string | null;
  /**
   * Clave de idempotencia. Si se emite otro evento con la misma clave dentro
   * del TTL, se descarta (no se duplica).
   */
  claveIdempotencia?: string | null;
}

/** Resultado del envío de un email (usado por EmailQueue). */
export interface ResultadoEnvioEmail {
  ok: boolean;
  error?: string;
}
