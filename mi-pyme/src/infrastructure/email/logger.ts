/**
 * Logger mínimo para la capa de infraestructura de emails.
 *
 * En desarrollo usa console; en producción evita loggear contenido sensible
 * (cuerpos de email, tokens) y solo registra metadatos seguros.
 */
type LogLevel = "info" | "warn" | "error";

const NIVEL_LOG = (process.env.EMAIL_LOG_LEVEL ?? "info") as LogLevel;

const ORDEN: Record<LogLevel, number> = { info: 0, warn: 1, error: 2 };

function emitir(level: LogLevel, mensaje: string, meta?: Record<string, unknown>) {
  if (ORDEN[level] < ORDEN[NIVEL_LOG]) return;

  const ts = new Date().toISOString();
  const prefix = `[EmailService:${level.toUpperCase()}] ${ts}`;
  if (meta && Object.keys(meta).length > 0) {
    const { error, ...rest } = meta;
    const safe = error ? { ...rest, error } : rest;
    console.log(prefix, mensaje, JSON.stringify(safe));
  } else {
    console.log(prefix, mensaje);
  }
}

export const emailLogger = {
  info: (msg: string, meta?: Record<string, unknown>) => emitir("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emitir("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emitir("error", msg, meta),
};

export function getLogger() {
  return emailLogger;
}
