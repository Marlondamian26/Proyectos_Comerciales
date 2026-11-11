/**
 * Auth environment validation.
 *
 * Validates NEXTAUTH_SECRET at build/startup time to prevent forgable JWTs
 * in production. In production, a weak or default secret causes a hard failure.
 * In development, a warning is emitted instead.
 */

const DEFAULT_SECRET = "dev-secret-key-change-in-production";
const MIN_SECRET_LENGTH = 32;

export class AuthEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthEnvError";
  }
}

export function validateAuthEnv(): void {
  const secret = process.env.NEXTAUTH_SECRET;
  const nodeEnv = process.env.NODE_ENV ?? "development";

  const isDefault = secret === DEFAULT_SECRET;
  const isMissing = !secret || secret.trim() === "";
  const isTooShort = secret !== undefined && secret !== "" && secret.length < MIN_SECRET_LENGTH;

  if (nodeEnv === "production") {
    if (isMissing || isDefault) {
      throw new AuthEnvError(
        "NEXTAUTH_SECRET no está configurado. Genera una clave segura con: openssl rand -base64 32"
      );
    }
    if (isTooShort) {
      throw new AuthEnvError(
        `NEXTAUTH_SECRET debe tener al menos ${MIN_SECRET_LENGTH} caracteres (actual: ${secret.length}). Genera una clave con: openssl rand -base64 32`
      );
    }
  } else {
    if (isMissing || isDefault) {
      console.warn(
        `[auth/validate-env] NEXTAUTH_SECRET está usando el valor por defecto. ` +
          `Genera una clave segura con: openssl rand -base64 32`
      );
    } else if (isTooShort) {
      console.warn(
        `[auth/validate-env] NEXTAUTH_SECRET tiene menos de ${MIN_SECRET_LENGTH} caracteres. ` +
          `Genera una clave con: openssl rand -base64 32`
      );
    }
  }
}
