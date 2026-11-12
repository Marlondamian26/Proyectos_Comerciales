import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SESSION_TTL_SECONDS,
  REMEMBERED_SESSION_TTL_SECONDS,
  decodeSessionToken,
  encodeSessionToken,
  getSessionExpiresAt,
} from "@/lib/auth/session-token";

const secret = "test-session-secret-with-at-least-32-characters";
const salt = "authjs.session-token";

describe("JWT session lifetime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("expires an unremembered session after 24 hours", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const expiresAt = getSessionExpiresAt(false);
    expect(expiresAt - Math.floor(Date.now() / 1000)).toBe(
      DEFAULT_SESSION_TTL_SECONDS
    );

    const encoded = await encodeSessionToken({
      token: { sub: "user-1", sessionExpiresAt: expiresAt },
      secret,
      salt,
    });
    const decoded = await decodeSessionToken({ token: encoded, secret, salt });

    expect(decoded?.exp).toBe(expiresAt);

    vi.setSystemTime(new Date((expiresAt + 1) * 1000));
    await expect(decodeSessionToken({ token: encoded, secret, salt })).resolves.toBeNull();
  });

  it("expires a remembered session after 30 days", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const expiresAt = getSessionExpiresAt(true);
    expect(expiresAt - Math.floor(Date.now() / 1000)).toBe(
      REMEMBERED_SESSION_TTL_SECONDS
    );

    const encoded = await encodeSessionToken({
      token: { sub: "user-1", sessionExpiresAt: expiresAt },
      secret,
      salt,
    });
    const decoded = await decodeSessionToken({ token: encoded, secret, salt });

    expect(decoded?.exp).toBe(expiresAt);
  });

  it("does not encode a session after its absolute expiration", async () => {
    const expiredAt = Math.floor(Date.now() / 1000) - 1;

    await expect(
      encodeSessionToken({
        token: { sub: "user-1", sessionExpiresAt: expiredAt },
        secret,
        salt,
      })
    ).rejects.toThrow("Cannot encode an expired session token.");
  });
});
