import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "@/tests/setup";
import { EmailQueue, getEmailQueue, resetEmailQueue, type EmailJob } from "@/infrastructure/email/EmailQueue";
import { setEmailProvider, ConsoleEmailProvider } from "@/infrastructure/email/EmailService";
import type { IEmailProvider, ResultadoEnvio } from "@/infrastructure/email/IEmailProvider";
import { resetCache } from "@/infrastructure";

const crearMockProvider = (resultado: ResultadoEnvio): IEmailProvider => ({
  enviar: vi.fn().mockResolvedValue(resultado),
});

describe("EmailQueue", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;
  let notificacionId: string;
  let mockProvider: IEmailProvider;

  beforeAll(async () => {
    testData = await setupTestData();
    notificacionId = testData.producto.id;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    await resetCache();
    resetEmailQueue();

    const notif = await prisma.notificacion.create({
      data: {
        userId: testData.usuario.id,
        tipo: "PEDIDO_CREADO",
        estado: "LEIDA",
        titulo: "Test email",
        mensaje: "Mensaje de prueba",
      },
    });
    notificacionId = notif.id;

    mockProvider = crearMockProvider({ ok: true, mensajeId: "test-msg-id" });
    setEmailProvider(mockProvider);
  });

  async function esperarProcesamiento(ms = 500): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  describe("encolar y procesar", () => {
    it("procesa un job exitosamente", async () => {
      const queue = new EmailQueue();
      const job: EmailJob = {
        notificacionId,
        to: "test@test.com",
        asunto: "Prueba",
        html: "<p>Hola</p>",
        text: "Hola",
      };

      queue.encolar(job);
      await esperarProcesamiento();

      expect(mockProvider.enviar).toHaveBeenCalledTimes(1);
      expect(mockProvider.enviar).toHaveBeenCalledWith({
        to: "test@test.com",
        subject: "Prueba",
        html: "<p>Hola</p>",
        text: "Hola",
      });

      const notif = await prisma.notificacion.findUnique({
        where: { id: notificacionId },
      });
      expect(notif?.emailEnviado).toBe(true);
      expect(notif?.emailError).toBeNull();
    });

    it("encola múltiples jobs y los procesa todos", async () => {
      const queue = new EmailQueue();

      for (let i = 0; i < 3; i++) {
        queue.encolar({
          notificacionId,
          to: `test${i}@test.com`,
          asunto: `Prueba ${i}`,
          html: "<p>Hola</p>",
        });
      }

      await esperarProcesamiento();
      expect(mockProvider.enviar).toHaveBeenCalledTimes(3);
    });

    it("registra error en BD cuando falla el proveedor", async () => {
      mockProvider.enviar = vi.fn().mockResolvedValue({
        ok: false,
        error: "SMTP connection refused",
      });

      const queue = new EmailQueue();
      queue.encolar({
        notificacionId,
        to: "test@test.com",
        asunto: "Prueba",
        html: "<p>Hola</p>",
      });

      await esperarProcesamiento(4500);

      const notif = await prisma.notificacion.findUnique({
        where: { id: notificacionId },
      });
      expect(notif?.emailError).not.toBeNull();
      expect(notif?.emailError).toContain("SMTP connection refused");
    });

    it("reintenta 3 veces con backoff exponencial", async () => {
      const failResult = { ok: false, error: "Server error" };
      mockProvider.enviar = vi.fn().mockResolvedValue(failResult);

      const queue = new EmailQueue();
      queue.encolar({
        notificacionId,
        to: "test@test.com",
        asunto: "Prueba",
        html: "<p>Hola</p>",
      });

      await esperarProcesamiento(4500);

      expect(mockProvider.enviar).toHaveBeenCalledTimes(3);

      const notif = await prisma.notificacion.findUnique({
        where: { id: notificacionId },
      });
      expect(notif?.emailError).toBe("Server error");
    }, 15000);
  });

  describe("getEmailQueue singleton", () => {
    it("devuelve la misma instancia", () => {
      const q1 = getEmailQueue();
      const q2 = getEmailQueue();
      expect(q1).toBe(q2);
    });

    it("resetEmailQueue reinicia la instancia", () => {
      const q1 = getEmailQueue();
      resetEmailQueue();
      const q2 = getEmailQueue();
      expect(q1).not.toBe(q2);
    });
  });

  describe("tamanio y limpiar", () => {
    it("limpiar vacía la cola", () => {
      const queue = new EmailQueue();
      queue.encolar({
        notificacionId,
        to: "test@test.com",
        asunto: "Prueba",
        html: "<p>Hola</p>",
      });
      queue.encolar({
        notificacionId,
        to: "test2@test.com",
        asunto: "Prueba 2",
        html: "<p>Hola 2</p>",
      });

      queue.limpiar();
      expect(queue.tamanio).toBe(0);
    });
  });
});

describe("ConsoleEmailProvider", () => {
  it("envía exitosamente y retorna mensajeId", async () => {
    const provider = new ConsoleEmailProvider();
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await provider.enviar({
      to: "test@test.com",
      subject: "Prueba",
      html: "<p>Hola</p>",
      text: "Hola",
    });

    expect(result.ok).toBe(true);
    expect(result.mensajeId).toMatch(/^console-/);
    consoleSpy.mockRestore();
  });

  it("funciona sin campo text", async () => {
    const provider = new ConsoleEmailProvider();
    vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await provider.enviar({
      to: "test@test.com",
      subject: "Prueba",
      html: "<p>Hola</p>",
    });

    expect(result.ok).toBe(true);
  });
});
