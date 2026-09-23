import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import { POST } from "@/app/api/auth/recuperar/route";
import bcrypt from "bcryptjs";

describe("S4: No token leaked in logs", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    await prisma.verificationToken.deleteMany({});
  });

  it("should not log reset URL containing the token", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const request = new Request("http://localhost:3000/api/auth/recuperar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testData.usuario.email }),
    });

    await POST(request);

    const tokenLeaked = consoleLogSpy.mock.calls.some((call) => {
      const arg = call[0];
      if (typeof arg !== "string") return false;
      return (
        arg.includes("Reset URL") ||
        arg.includes("resetUrl") ||
        arg.includes("/auth/resetear/")
      );
    });

    expect(tokenLeaked).toBe(false);

    consoleLogSpy.mockRestore();
  });

  it("should not log console.error with token or password data on success", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const request = new Request("http://localhost:3000/api/auth/recuperar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testData.usuario.email }),
    });

    await POST(request);

    const tokenInError = consoleErrorSpy.mock.calls.some((call) => {
      return call.some(
        (arg) =>
          typeof arg === "string" &&
          (arg.includes("token") || arg.includes("/auth/resetear/"))
      );
    });

    expect(tokenInError).toBe(false);

    consoleErrorSpy.mockRestore();
  });
});
