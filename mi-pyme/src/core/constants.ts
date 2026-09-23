/**
 * Constantes del dominio para disponibilidad diaria.
 */
export const HORA_CORTE_DISPONIBILIDAD = 22;
export const DIAS_VISTA_DISPONIBILIDAD = 7;
export const CACHE_TTL_DISPONIBILIDAD_SEG = 60;
export const CODIGO_SIN_DISPONIBILIDAD = "SIN_DISPONIBILIDAD";
export const CODIGO_SIN_CUPO = "SIN_CUPO";
export const CODIGO_FECHA_INVALIDA = "FECHA_INVALIDA";
export const CODIGO_FUERA_DE_HORARIO = "FUERA_DE_HORARIO";

// ---------------------------------------------------------------------------
// Constantes de checkout y facturación (Fase 1 — Punto 4)
// ---------------------------------------------------------------------------

/**
 * Tasa de IVA por defecto para negocios en régimen GENERAL (10% según Ley 113/2012).
 * @deprecated Usar IVAService con los datos fiscales del negocio en lugar de esta constante.
 */
export const IVA_PORCENTAJE = 10;

/**
 * Umbral a partir del cual el envío es gratuito. 0 = nunca gratis por ahora.
 * Futuro: configurable por negocio.
 */
export const ENVIO_GRATIS_DESDE = 0;

/** Moneda de la plataforma (a decidir por el negocio). */
export const MONEDA = "CUP";

/** Códigos de error de negocio para el checkout. */
export const CODIGO_CARRITO_VACIO = "CARRITO_VACIO";
export const CODIGO_DIRECCION_REQUERIDA = "DIRECCION_REQUERIDA";
export const CODIGO_OPCION_INVALIDA = "OPCION_INVALIDA";
export const CODIGO_NO_AUTORIZADO = "NO_AUTORIZADO";
export const CODIGO_CONFLICTO = "CONFLICTO";

// ---------------------------------------------------------------------------
// Constantes de pago (Fase 1 — Punto 5)
// ---------------------------------------------------------------------------

import type { MetodoPago } from "@/generated/prisma/client";

export const METODOS_PAGO_DISPONIBLES: MetodoPago[] = [
  "EFECTIVO_CONTRA_ENTREGA",
  "TRANSFERENCIA_BANCARIA",
  "PAGO_MOVIL",
];
export const METODOS_PAGO_PROXIMAMENTE: MetodoPago[] = ["TARJETA"];
export const MONEDA_DEFECTO = "CUP";

export const CODIGO_PAGO_YA_EXISTE = "PAGO_YA_EXISTE";
export const CODIGO_ESTADO_INVALIDO = "ESTADO_INVALIDO";
export const CODIGO_METODO_NO_DISPONIBLE = "METODO_NO_DISPONIBLE";
export const CODIGO_REEMBOLSO_REQUERIDO = "REEMBOLSO_REQUERIDO";
export const CODIGO_NO_ENCONTRADO = "NO_ENCONTRADO";
export const CODIGO_DUPLICADO = "DUPLICADO";
export const CODIGO_VALIDACION = "VALIDACION";

// --- Código de confirmación EFECTIVO_CONTRA_ENTREGA ---
export const CODIGO_LONGITUD = 6;
export const CODIGO_DIAS_EXPIRACION = 7;
export const CODIGO_INTENTOS_MAXIMOS = 5;
export const CODIGO_REGENERACIONES_MAXIMAS = 3;
export const CODIGO_MOTIVO_MIN_CARACTERES = 20;

export const CODIGO_ERROR_INCORRECTO = "CODIGO_INCORRECTO";
export const CODIGO_ERROR_EXPIRADO = "CODIGO_EXPIRADO";
export const CODIGO_ERROR_BLOQUEADO = "CODIGO_BLOQUEADO";
export const CODIGO_ERROR_LIMITE_REGENERACIONES = "LIMITE_REGENERACIONES";
export const CODIGO_ERROR_METODO_INCORRECTO = "METODO_INCORRECTO";
export const CODIGO_ERROR_MOTIVO_REQUERIDO = "MOTIVO_REQUERIDO";

export const CODIGO_CACHE_TTL_SEG = 7 * 24 * 60 * 60;

export const ENTIDADES_PAGO_CON_TRANSFERENCIA: string[] = [
  "Transfermovil",
  "EnZona",
  "BPA",
  "BancoMetropolitano",
  "BPI",
];

export const FORMATO_ID_TRANSFERENCIA: Record<string, RegExp> = {
  Transfermovil: /^TM-\d{4}-\d{6}$/,
  EnZona: /^EZ-\d{4}-\d{6}$/,
  BPA: /^BPA-\d{4}-\d{6}$/,
  BancoMetropolitano: /^BM-\d{4}-\d{6}$/,
  BPI: /^BPI-\d{4}-\d{6}$/,
};

// Tamaño máximo de comprobante: 5 MB
export const COMPROBANTE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const COMPROBANTE_TIPOS_PERMITIDOS = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
];
