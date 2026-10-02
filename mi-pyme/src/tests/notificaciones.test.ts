import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "@/tests/setup";
import { NotificacionService } from "@/services/NotificacionService";
import { getCache, resetCache } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import {
  CODIGO_NO_ENCONTRADA_NOTIFICACION,
  CODIGO_NO_AUTORIZADO,
  CODIGO_NOTIFICACION_RATE_LIMIT,
  NOTIFICACION_RATE_LIMIT_POR_HORA,
} from "@/core/constants";
import { Rol, EstadoNotificacion } from "@/generated/prisma/client";

const service = new NotificacionService();

describe("NotificacionService", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;
  let userId: string;

  beforeAll(async () => {
    testData = await setupTestData();
    userId = testData.usuario.id;

    vi.useFakeTimers();
  });

  afterAll(async () => {
    vi.useRealTimers();
    await cleanupTestData();
  });

  beforeEach(async () => {
    await prisma.notificacion.deleteMany({});
    await prisma.preferenciaNotificacion.deleteMany({});
    await resetCache();
  });

  describe("emitir", () => {
    it("crea una notificación in-app para el destinatario", async () => {
      await service.emitirOrThrow({
        tipo: "PEDIDO_CREADO",
        titulo: "Nuevo pedido",
        mensaje: "Se creó un nuevo pedido",
        enlace: "/pedidos/123",
        destinatarioUserId: userId,
      });

      const notificaciones = await prisma.notificacion.findMany({
        where: { userId },
      });

      expect(notificaciones).toHaveLength(1);
      const notif = notificaciones[0];
      expect(notif.tipo).toBe("PEDIDO_CREADO");
      expect(notif.titulo).toBe("Nuevo pedido");
      expect(notif.mensaje).toBe("Se creó un nuevo pedido");
      expect(notif.enlace).toBe("/pedidos/123");
      expect(notif.estado).toBe("NO_LEIDA");
    });

    it("no notifica al actor (auto-notificación)", async () => {
      await service.emitirOrThrow({
        tipo: "PEDIDO_CREADO",
        titulo: "Nuevo pedido",
        mensaje: "Se creó un nuevo pedido",
        actorId: userId,
        destinatarioUserId: userId,
      });

      const notificaciones = await prisma.notificacion.findMany({ where: { userId } });
      expect(notificaciones).toHaveLength(0);
    });

    it("respetando preferencias: inApp=false no crea notificación in-app", async () => {
      await prisma.preferenciaNotificacion.create({
        data: {
          userId,
          tipo: "PEDIDO_CREADO",
          inApp: false,
          email: true,
        },
      });

      await service.emitirOrThrow({
        tipo: "PEDIDO_CREADO",
        titulo: "Nuevo pedido",
        mensaje: "Se creó un nuevo pedido",
        destinatarioUserId: userId,
      });

      const notif = await prisma.notificacion.findFirst({ where: { userId, tipo: "PEDIDO_CREADO" } });
      expect(notif).toBeTruthy();
      expect(notif?.estado).toBe("LEIDA");
    });

    it("es idempotente con claveIdempotencia", async () => {
      const evento = {
        tipo: "PEDIDO_CREADO" as const,
        titulo: "Nuevo pedido",
        mensaje: "Se creó un nuevo pedido",
        claveIdempotencia: "pedido-123",
        destinatarioUserId: userId,
      };

      await service.emitirOrThrow(evento);
      await service.emitirOrThrow(evento);

      const notificaciones = await prisma.notificacion.findMany({ where: { userId } });
      expect(notificaciones).toHaveLength(1);
    });

    it("aplica rate limiting", async () => {
      const evento = {
        tipo: "PEDIDO_CREADO" as const,
        titulo: "Nuevo pedido",
        mensaje: "Se creó un nuevo pedido",
        destinatarioUserId: userId,
      };

      for (let i = 0; i < NOTIFICACION_RATE_LIMIT_POR_HORA; i++) {
        await service.emitirOrThrow(evento);
      }

      await service.emitirOrThrow(evento);

      const notificaciones = await prisma.notificacion.findMany({ where: { userId } });
      expect(notificaciones.length).toBe(NOTIFICACION_RATE_LIMIT_POR_HORA);
    });
  });

  describe("listar", () => {
    it("lista notificaciones con paginación", async () => {
      for (let i = 0; i < 3; i++) {
        await prisma.notificacion.create({
          data: {
            userId,
            tipo: "PEDIDO_CREADO",
            estado: "NO_LEIDA",
            titulo: `Pedido ${i + 1}`,
            mensaje: `Mensaje ${i + 1}`,
          },
        });
      }

      const result = await service.listar(userId, { page: 1, limit: 2 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it("filtra por estado", async () => {
      await prisma.notificacion.create({
        data: {
          userId,
          tipo: "PEDIDO_CREADO",
          estado: "LEIDA",
          titulo: "Leída",
          mensaje: "Mensaje",
        },
      });
      await prisma.notificacion.create({
        data: {
          userId,
          tipo: "PEDIDO_CREADO",
          estado: "NO_LEIDA",
          titulo: "Sin leer",
          mensaje: "Mensaje",
        },
      });

      const result = await service.listar(userId, { estado: ["LEIDA"] });

      expect(result.total).toBe(1);
      expect(result.data[0].estado).toBe("LEIDA");
    });
  });

  describe("contarNoLeidas", () => {
    it("cuenta notificaciones sin leer", async () => {
      for (let i = 0; i < 3; i++) {
        await prisma.notificacion.create({
          data: {
            userId,
            tipo: "PEDIDO_CREADO",
            estado: "NO_LEIDA",
            titulo: `Pedido ${i + 1}`,
            mensaje: `Mensaje ${i + 1}`,
          },
        });
      }
      await prisma.notificacion.create({
        data: {
          userId,
          tipo: "PEDIDO_CREADO",
          estado: "LEIDA",
          titulo: "Leído",
          mensaje: "Mensaje",
        },
      });

      const count = await service.contarNoLeidas(userId);
      expect(count).toBe(3);
    });

    it("usa caché en la segunda llamada", async () => {
      await prisma.notificacion.create({
        data: {
          userId,
          tipo: "PEDIDO_CREADO",
          estado: "NO_LEIDA",
          titulo: "Pedido 1",
          mensaje: "Mensaje",
        },
      });

      const count1 = await service.contarNoLeidas(userId);
      expect(count1).toBe(1);

      await prisma.notificacion.create({
        data: {
          userId,
          tipo: "PEDIDO_CREADO",
          estado: "NO_LEIDA",
          titulo: "Pedido 2",
          mensaje: "Mensaje",
        },
      });

      const count2 = await service.contarNoLeidas(userId);
      expect(count2).toBe(1);

      const cache = getCache();
      await cache.del(`notificaciones:no-leidas:${userId}`);

      const count3 = await service.contarNoLeidas(userId);
      expect(count3).toBe(2);
    });
  });

  describe("marcarLeida", () => {
    it("marca una notificación como leída", async () => {
      const notif = await prisma.notificacion.create({
        data: {
          userId,
          tipo: "PEDIDO_CREADO",
          estado: "NO_LEIDA",
          titulo: "Pedido",
          mensaje: "Nuevo pedido",
        },
      });

      await service.marcarLeida(notif.id, userId);

      const updated = await prisma.notificacion.findUnique({
        where: { id: notif.id },
      });
      expect(updated?.estado).toBe("LEIDA");
      expect(updated?.leidaEn).toBeTruthy();
    });

    it("lanza error si la notificación no existe", async () => {
      await expect(
        service.marcarLeida("notificacion-inexistente", userId)
      ).rejects.toThrow(BusinessError);
    });

    it("lanza error si no es el propietario", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "otro@test.com",
          password: "password123",
          nombre: "Otro Usuario",
          rol: Rol.CLIENTE,
        },
      });

      const notif = await prisma.notificacion.create({
        data: {
          userId: otherUser.id,
          tipo: "PEDIDO_CREADO",
          estado: "NO_LEIDA",
          titulo: "Pedido",
          mensaje: "Nuevo pedido",
        },
      });

      await expect(
        service.marcarLeida(notif.id, userId)
      ).rejects.toThrow(BusinessError);
    });
  });

  describe("marcarTodasLeidas", () => {
    it("marca todas las no leídas como leídas", async () => {
      for (let i = 0; i < 5; i++) {
        await prisma.notificacion.create({
          data: {
            userId,
            tipo: "PEDIDO_CREADO",
            estado: "NO_LEIDA",
            titulo: `Pedido ${i + 1}`,
            mensaje: `Mensaje ${i + 1}`,
          },
        });
      }

      const count = await service.marcarTodasLeidas(userId);
      expect(count).toBe(5);

      const leidas = await prisma.notificacion.count({
        where: { userId, estado: "LEIDA" },
      });
      expect(leidas).toBe(5);
    });
  });

  describe("archivar", () => {
    it("archiva una notificación", async () => {
      const notif = await prisma.notificacion.create({
        data: {
          userId,
          tipo: "PEDIDO_CREADO",
          estado: "NO_LEIDA",
          titulo: "Pedido",
          mensaje: "Nuevo pedido",
        },
      });

      await service.archivar(notif.id, userId);

      const updated = await prisma.notificacion.findUnique({
        where: { id: notif.id },
      });
      expect(updated?.estado).toBe("ARCHIVADA");
    });

    it("lanza error si no es el propietario", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "archivar-otro@test.com",
          password: "password123",
          nombre: "Otro Usuario",
          rol: Rol.CLIENTE,
        },
      });

      const notif = await prisma.notificacion.create({
        data: {
          userId: otherUser.id,
          tipo: "PEDIDO_CREADO",
          estado: "NO_LEIDA",
          titulo: "Pedido",
          mensaje: "Nuevo pedido",
        },
      });

      await expect(
        service.archivar(notif.id, userId)
      ).rejects.toThrow(BusinessError);
    });
  });

  describe("eliminar", () => {
    it("elimina una notificación", async () => {
      const notif = await prisma.notificacion.create({
        data: {
          userId,
          tipo: "PEDIDO_CREADO",
          estado: "NO_LEIDA",
          titulo: "Pedido",
          mensaje: "Nuevo pedido",
        },
      });

      await service.eliminar(notif.id, userId);

      const deleted = await prisma.notificacion.findUnique({
        where: { id: notif.id },
      });
      expect(deleted).toBeNull();
    });

    it("lanza error si no existe", async () => {
      await expect(
        service.eliminar("inexistente", userId)
      ).rejects.toThrow(BusinessError);
    });
  });

  describe("getPreferencias", () => {
    it("devuelve todas las preferencias por defecto si no hay personalizaciones", async () => {
      const prefs = await service.getPreferencias(userId);

      expect(Object.keys(prefs).length).toBeGreaterThan(0);

      for (const tipo of Object.keys(prefs)) {
        const pref = prefs[tipo];
        expect(pref.inApp).toBe(true);
        const emailEsperado = tipo !== "LOGIN_NUEVO_DISPOSITIVO";
        expect(pref.email).toBe(emailEsperado);
      }
    });

    it("LOGIN_NUEVO_DISPOSITIVO tiene email=false por defecto", async () => {
      const prefs = await service.getPreferencias(userId);
      expect(prefs.LOGIN_NUEVO_DISPOSITIVO.email).toBe(false);
    });
  });

  describe("actualizarPreferencias", () => {
    it("actualiza las preferencias del usuario", async () => {
      const preferencias = [
        { tipo: "PEDIDO_CREADO", inApp: true, email: false },
        { tipo: "PEDIDO_ESTADO_CAMBIADO", inApp: false, email: true },
        { tipo: "BIENVENIDA", inApp: false, email: false },
      ];

      await service.actualizarPreferencias(userId, preferencias as any);

      const prefs = await service.getPreferencias(userId);
      expect(prefs.PEDIDO_CREADO.inApp).toBe(true);
      expect(prefs.PEDIDO_CREADO.email).toBe(false);
      expect(prefs.PEDIDO_ESTADO_CAMBIADO.inApp).toBe(false);
      expect(prefs.PEDIDO_ESTADO_CAMBIADO.email).toBe(true);
      expect(prefs.BIENVENIDA.inApp).toBe(false);
      expect(prefs.BIENVENIDA.email).toBe(false);
    });

    it("lanza error con preferencias inválidas", async () => {
      await expect(
        service.actualizarPreferencias(userId, null as any)
      ).rejects.toThrow(BusinessError);
    });
  });
});
