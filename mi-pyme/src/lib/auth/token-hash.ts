import { createHash, timingSafeEqual } from "crypto";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyToken(token: string, hash: string): boolean {
  const tokenHash = hashToken(token);
  return timingSafeEqual(
    Buffer.from(tokenHash, "hex"),
    Buffer.from(hash, "hex"),
  );
}
