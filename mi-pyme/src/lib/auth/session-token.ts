import { decode as decodeJwt, encode as encodeJwt } from "next-auth/jwt";
import type { JWT, JWTDecodeParams, JWTEncodeParams } from "next-auth/jwt";

export const DEFAULT_SESSION_TTL_SECONDS = 24 * 60 * 60;
export const REMEMBERED_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export function getSessionExpiresAt(
  rememberMe: boolean,
  issuedAt = Math.floor(Date.now() / 1000)
): number {
  return issuedAt + (
    rememberMe
      ? REMEMBERED_SESSION_TTL_SECONDS
      : DEFAULT_SESSION_TTL_SECONDS
  );
}

export async function encodeSessionToken(
  params: JWTEncodeParams
): Promise<string> {
  const expiresAt = params.token?.sessionExpiresAt;
  if (typeof expiresAt !== "number" || !Number.isSafeInteger(expiresAt)) {
    throw new Error("Session token is missing its absolute expiration.");
  }

  const remainingLifetime = expiresAt - Math.floor(Date.now() / 1000);
  if (remainingLifetime <= 0) {
    throw new Error("Cannot encode an expired session token.");
  }

  return encodeJwt({
    ...params,
    maxAge: remainingLifetime,
  });
}

export async function decodeSessionToken(
  params: JWTDecodeParams
): Promise<JWT | null> {
  const decoded = await decodeJwt(params);
  if (!decoded || typeof decoded !== "object") return null;
  const token = decoded as JWT;

  const expiresAt = typeof token.sessionExpiresAt === "number"
    ? token.sessionExpiresAt
    : typeof token.iat === "number"
      ? getSessionExpiresAt(token.rememberMe === true, token.iat)
      : null;

  if (expiresAt === null || expiresAt <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return token;
}
