/**
 * Helpers de fecha para disponibilidad diaria.
 *
 * Todas las fechas de disponibilidad se normalizan a UTC 00:00:00 del día
 * para poder comparar fechas sin importar la zona horaria del servidor.
 *
 * NOTA: El codebase no incluye `date-fns`, así que se implementan helpers
 * mínimos con la API nativa de Date.
 */

/**
 * Normaliza una fecha a las 00:00:00 UTC del día correspondiente.
 * Acepta Date, string ISO, número (timestamp) o undefined (usa ahora).
 */
export function normalizarFecha(fecha?: Date | string | number): Date {
  const d = fecha instanceof Date ? fecha : new Date(fecha ?? Date.now());
  if (Number.isNaN(d.getTime())) {
    throw new Error("Fecha inválida");
  }
  const utc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return new Date(utc);
}

/**
 * Devuelve la fecha normalizada (00:00 UTC) de "hoy" en UTC.
 */
export function fechaHoy(): Date {
  const now = new Date();
  return normalizarFecha(now);
}

/**
 * Devuelve `DIAS_VISTA_DISPONIBILIDAD` fechas normalizadas a partir de hoy (hoy incluido).
 */
export function fechasProximosDias(dias: number = 7): Date[] {
  const inicio = fechaHoy();
  const resultado: Date[] = [];
  for (let i = 0; i < dias; i++) {
    const d = new Date(inicio);
    d.setUTCDate(d.getUTCDate() + i);
    resultado.push(d);
  }
  return resultado;
}

/**
 * Convierte una fecha ISO `YYYY-MM-DD` o Date a `YYYY-MM-DD` en UTC.
 */
export function formatFechaISO(fecha: Date | string): string {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Fecha inválida");
  }
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Obtiene la hora local de un Date (0-23) para comparar contra HORA_CORTE_DISPONIBILIDAD.
 */
export function horaLocal(fecha: Date): number {
  return fecha.getHours();
}

/**
 * Indica si `fecha` es el mismo día que hoy (comparación en UTC).
 */
export function esHoy(fecha: Date): boolean {
  const hoy = fechaHoy();
  return fecha.getUTCFullYear() === hoy.getUTCFullYear() &&
    fecha.getUTCMonth() === hoy.getUTCMonth() &&
    fecha.getUTCDate() === hoy.getUTCDate();
}
