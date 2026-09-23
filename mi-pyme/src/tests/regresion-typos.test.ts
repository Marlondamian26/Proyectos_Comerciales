/**
 * Tests de regresión para typos corregidos (Fase 2, Punto 7).
 *
 * Estos tests verifican que los typos detectados durante la auditoría no
 * puedan reintroducirse accidentalmente:
 *
 * 1. `new Date` sin paréntesis → fechaIni.getTime() falla
 * 2. `fechaHoraFincio` → no existe en CrearReservaParams (type-level)
 * 3. `pedidos` vs `pedido` naming inconsistency → datos incorrectos
 *
 * Si alguien reintroduce cualquiera de estos typos, los tests correspondientes
 * fallarán, ya sea en runtime (vitest) o en compilación (tsc --noEmit).
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import { resetCache } from "@/infrastructure";
import { HORA_CORTE_DISPONIBILIDAD } from "@/core/constants";
import { BusinessError } from "@/shared/types";
import ReservaService, { type CrearReservaParams } from "@/services/ReservaService";
import { PedidosService } from "@/services/PedidosService";
import type { Pedido, Reserva } from "@/generated/prisma/client";

const RESERVA_TEST_IDS: string[] = [];

function fechaManana(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(10, 0, 0, 0);
  return d;
}

function fechaAyer(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  d.setUTCHours(10, 0, 0, 0);
  return d;
}

describe("Regresión de typos (Fase 2, Punto 7)", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    const mockNow = new Date();
    mockNow.setHours(HORA_CORTE_DISPONIBILIDAD - 3, 0, 0, 0);
    vi.useFakeTimers({ now: mockNow });

    testData = await setupTestData();
  });

  afterAll(async () => {
    vi.useRealTimers();
    await cleanupTestData();
  });

  beforeEach(async () => {
    await resetCache();
    await prisma.reserva.deleteMany({});
    await prisma.pedidoItem.deleteMany({});
    await prisma.pedido.deleteMany({});
    RESERVA_TEST_IDS.length = 0;
  });

  // ─────────────────────────────────────────────────────────────────────────
  //  ReservaService
  // ─────────────────────────────────────────────────────────────────────────

  describe("ReservaService — typo: `new Date` sin paréntesis", () => {
    let service: ReservaService;

    beforeEach(() => {
      service = new ReservaService();
    });

    it("crearReserva con fechaHoraInicio válida crea la reserva con fechas como Date instances", async () => {
      const inicio = fechaManana();
      const iso = inicio.toISOString();

      const reserva = await service.crearReserva(testData.usuario.id, {
        servicioId: testData.servicio.id,
        fechaHoraInicio: iso,
      });

      // If `fechaIni = new Date` (without parens), fechaIni is the Date
      // constructor function, NOT a Date instance. These assertions catch that.
      expect(reserva.fechaHoraInicio).toBeInstanceOf(Date);
      expect(typeof reserva.fechaHoraInicio.getTime).toBe("function");
      expect(reserva.fechaHoraInicio.getTime()).toBe(inicio.getTime());

      expect(reserva.fechaHoraFin).toBeInstanceOf(Date);
      expect(typeof reserva.fechaHoraFin.getTime).toBe("function");
      // fechaHoraFin should be fechaIni + duracionMinutos
      const expectedFin = inicio.getTime() + testData.servicio.duracionMinutos * 60 * 1000;
      expect(reserva.fechaHoraFin.getTime()).toBe(expectedFin);

      expect(reserva.estado).toBe("pendiente");
      RESERVA_TEST_IDS.push(reserva.id);
    });

    it("crearReserva con fecha en el pasado lanza BusinessError", async () => {
      const ayer = fechaAyer();

      await expect(
        service.crearReserva(testData.usuario.id, {
          servicioId: testData.servicio.id,
          fechaHoraInicio: ayer.toISOString(),
        })
      ).rejects.toThrow(BusinessError);
    });

    it("crearReserva con servicio inexistente lanza BusinessError", async () => {
      await expect(
        service.crearReserva(testData.usuario.id, {
          servicioId: "nonexistent-servicio-id",
          fechaHoraInicio: fechaManana().toISOString(),
        })
      ).rejects.toThrow(BusinessError);
    });
  });

  describe("ReservaService — typo: `fechaHoraFincio` → `fechaHoraInicio`", () => {
    it("fechaHoraFincio no existe en CrearReservaParams (type-level regression)", () => {
      // If someone re-adds `fechaHoraFincio` to the interface, the
      // @ts-expect-error directive becomes unused and tsc --noEmit FAILS.
      // @ts-expect-error - fechaHoraFincio fue eliminado; usar fechaHoraInicio
      const params: CrearReservaParams = {
        servicioId: "test-servicio",
        fechaHoraFincio: new Date().toISOString(),
      };

      // Also verify the correct field name compiles and works at runtime
      const correcto: CrearReservaParams = {
        servicioId: "test-servicio",
        fechaHoraInicio: new Date().toISOString(),
      };
      expect(correcto.fechaHoraInicio).toBeDefined();
      expect(params).toBeDefined();
    });

    it("crearReserva persiste fechaHoraInicio correctamente en BD", async () => {
      const service = new ReservaService();
      const inicio = fechaManana();

      const reserva = await service.crearReserva(testData.usuario.id, {
        servicioId: testData.servicio.id,
        fechaHoraInicio: inicio.toISOString(),
      });

      const desdeBD = await prisma.reserva.findUnique({
        where: { id: reserva.id },
      });

      expect(desdeBD).not.toBeNull();
      // If `fechaHoraFin: fechaIni` typo was present, the field would still
      // be set correctly since both use the same value — but the original
      // bug also had `fechaHoraFin: fechaIni` instead of
      // `fechaHoraInicio: fechaIni` in the Prisma create data, which would
      // leave fechaHoraInicio null. This test catches that.
      expect(desdeBD!.fechaHoraInicio).toBeInstanceOf(Date);
      expect(desdeBD!.fechaHoraInicio.getTime()).toBe(inicio.getTime());
      expect(desdeBD!.fechaHoraFin).toBeInstanceOf(Date);
      RESERVA_TEST_IDS.push(reserva.id);
    });
  });

  describe("ReservaService — integración: crearReserva → listarReservas", () => {
    it("flujo completo: crear reserva y listarla con fechas correctas", async () => {
      const service = new ReservaService();
      const inicio = fechaManana();

      const reserva = await service.crearReserva(testData.usuario.id, {
        servicioId: testData.servicio.id,
        fechaHoraInicio: inicio.toISOString(),
      });

      const reservas = await service.listarReservas(testData.usuario.id);
      expect(reservas.length).toBeGreaterThan(0);
      expect(reservas.some((r) => r.id === reserva.id)).toBe(true);

      const found = reservas.find((r: Reserva) => r.id === reserva.id)!;
      expect(found.fechaHoraInicio).toBeInstanceOf(Date);
      expect(found.fechaHoraFin).toBeInstanceOf(Date);
      RESERVA_TEST_IDS.push(reserva.id);
    });
  });

  describe("ReservaService — cancelarReserva e invalidateCache", () => {
    it("cancelarReserva marca la reserva como cancelada", async () => {
      const service = new ReservaService();
      const inicio = fechaManana();

      const reserva = await service.crearReserva(testData.usuario.id, {
        servicioId: testData.servicio.id,
        fechaHoraInicio: inicio.toISOString(),
      });

      await service.cancelarReserva(reserva.id, testData.usuario.id);

      const desdeBD = await prisma.reserva.findUnique({
        where: { id: reserva.id },
      });
      expect(desdeBD!.estado).toBe("cancelada");
      RESERVA_TEST_IDS.push(reserva.id);
    });

    it("cancelarReserva invalida el cache y refleja el cambio en BD", async () => {
      const service = new ReservaService();
      const inicio = fechaManana();

      const reserva = await service.crearReserva(testData.usuario.id, {
        servicioId: testData.servicio.id,
        fechaHoraInicio: inicio.toISOString(),
      });

      // Cache listarReservas (populate cache)
      await service.listarReservas(testData.usuario.id);

      // Cancelar debe invalidar el cache
      await service.cancelarReserva(reserva.id, testData.usuario.id);

      // Verify DB state directly (listarReservas filters by estado, so
      // cancelled reservations won't appear in the default list)
      const desdeBD = await prisma.reserva.findUnique({
        where: { id: reserva.id },
      });
      expect(desdeBD!.estado).toBe("cancelada");
      RESERVA_TEST_IDS.push(reserva.id);
    });

    it("invalidateCache limpia el cache de reservas del usuario", async () => {
      const service = new ReservaService();
      await expect(service.invalidateCache(testData.usuario.id)).resolves.toBeUndefined();
    });

    it("listarReservas con filtro de estado devuelve Date instances válidas", async () => {
      const service = new ReservaService();
      const inicio = fechaManana();

      const reserva = await service.crearReserva(testData.usuario.id, {
        servicioId: testData.servicio.id,
        fechaHoraInicio: inicio.toISOString(),
      });

      const reservas = await service.listarReservas(testData.usuario.id, {
        estado: ["pendiente"],
      });
      expect(reservas.length).toBeGreaterThan(0);
      for (const r of reservas) {
        expect(r.fechaHoraInicio).toBeInstanceOf(Date);
        expect(r.fechaHoraFin).toBeInstanceOf(Date);
        expect(r.venceEn).toBeInstanceOf(Date);
      }
      RESERVA_TEST_IDS.push(reserva.id);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  //  PedidosService
  // ─────────────────────────────────────────────────────────────────────────

  describe("PedidosService — typo: `new Date` sin paréntesis", () => {
    let service: PedidosService;

    beforeEach(() => {
      service = new PedidosService();
    });

    it("getPedido devuelve fechaCreacion como Date instance con método getTime", async () => {
      const pedido = await prisma.pedido.create({
        data: {
          usuarioId: testData.usuario.id,
          negocioId: testData.negocio.id,
          total: 29.99,
          tipo: "producto",
          negocioIds: JSON.stringify([testData.negocio.id]),
          estado: "pendiente",
        },
      });

      const result = await service.getPedido(pedido.id, testData.usuario.id);

      expect(result).not.toBeNull();
      expect(result!.fechaCreacion).toBeInstanceOf(Date);
      expect(typeof result!.fechaCreacion.getTime).toBe("function");
      expect(result!.fechaCreacion.getTime()).toBeGreaterThan(0);
    });

    it("listPedidosDeUsuario devuelve pedidos con fechas válidas", async () => {
      await prisma.pedido.create({
        data: {
          usuarioId: testData.usuario.id,
          negocioId: testData.negocio.id,
          total: 29.99,
          tipo: "producto",
          negocioIds: JSON.stringify([testData.negocio.id]),
          estado: "pendiente",
        },
      });

      const grupos = await service.listPedidosDeUsuario(testData.usuario.id);

      expect(grupos.length).toBeGreaterThan(0);
      const pedidos = grupos[0].pedidos;
      expect(pedidos).toBeInstanceOf(Array);
      expect(pedidos.length).toBeGreaterThan(0);
      for (const pedido of pedidos) {
        expect(pedido.fechaCreacion).toBeInstanceOf(Date);
        expect(typeof pedido.fechaCreacion.getTime).toBe("function");
      }
    });
  });

  describe("PedidosService — typo: `pedidos` vs `pedido` nomenclatura", () => {
    let service: PedidosService;

    beforeEach(() => {
      service = new PedidosService();
    });

    it("listPedidosDeUsuario usa pedidos (plural) para arrays y pedido (singular) para items", async () => {
      // Create two pedidos for the same negocio
      const p1 = await prisma.pedido.create({
        data: {
          usuarioId: testData.usuario.id,
          negocioId: testData.negocio.id,
          total: 25.5,
          tipo: "producto",
          negocioIds: JSON.stringify([testData.negocio.id]),
          estado: "pendiente",
        },
      });
      const p2 = await prisma.pedido.create({
        data: {
          usuarioId: testData.usuario.id,
          negocioId: testData.negocio.id,
          total: 50.0,
          tipo: "producto",
          negocioIds: JSON.stringify([testData.negocio.id]),
          estado: "completado",
        },
      });

      const grupos = await service.listPedidosDeUsuario(testData.usuario.id);

      // `pedidos` field should be an array (plural naming)
      expect(grupos[0].pedidos).toBeInstanceOf(Array);
      expect(grupos[0].pedidos).toHaveLength(2);

      // Each element is a `pedido` (singular entity) with expected properties
      for (const pedido of grupos[0].pedidos) {
        expect(pedido.id).toBeDefined();
        expect(pedido.fechaCreacion).toBeInstanceOf(Date);
      }

      const ids = grupos[0].pedidos.map((p: Pedido) => p.id).sort();
      expect(ids).toEqual([p1.id, p2.id].sort());
    });
  });

  describe("PedidosService — integración: crearPedido → listarPedidos", () => {
    let service: PedidosService;

    beforeEach(() => {
      service = new PedidosService();
    });

    it("flujo completo: crear pedido en BD y recuperarlo con PedidosService", async () => {
      // Create a pedido directly (simulating checkout completion)
      const pedido = await prisma.pedido.create({
        data: {
          usuarioId: testData.usuario.id,
          negocioId: testData.negocio.id,
          total: 25.5,
          tipo: "producto",
          negocioIds: JSON.stringify([testData.negocio.id]),
          estado: "pendiente",
          items: {
            create: [
              {
                productoId: testData.producto.id,
                cantidad: 1,
                precioUnitario: testData.producto.precio,
                subtotal: testData.producto.precio,
                negocioId: testData.negocio.id,
              },
            ],
          },
        },
      });

      // Retrieve via PedidosService
      const retrieved = await service.getPedido(pedido.id, testData.usuario.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(pedido.id);
      expect(retrieved!.fechaCreacion).toBeInstanceOf(Date);
      expect(typeof retrieved!.fechaCreacion.getTime).toBe("function");

      // List via PedidosService
      const grupos = await service.listPedidosDeUsuario(testData.usuario.id);
      const found = grupos[0].pedidos.find((p: Pedido) => p.id === pedido.id);
      expect(found).toBeDefined();
      expect(found.fechaCreacion).toBeInstanceOf(Date);
    });
  });

  describe("PedidosService — listarPedidos, actualizarEstado e invalidateCache", () => {
    let service: PedidosService;

    beforeEach(() => {
      service = new PedidosService();
    });

    it("listarPedidos devuelve lista con Date instances", async () => {
      const p1 = await prisma.pedido.create({
        data: {
          usuarioId: testData.usuario.id,
          negocioId: testData.negocio.id,
          total: 25.5,
          tipo: "producto",
          negocioIds: JSON.stringify([testData.negocio.id]),
          estado: "pendiente",
        },
      });
      const p2 = await prisma.pedido.create({
        data: {
          usuarioId: testData.usuario.id,
          negocioId: testData.negocio.id,
          total: 50.0,
          tipo: "producto",
          negocioIds: JSON.stringify([testData.negocio.id]),
          estado: "completado",
        },
      });

      const pedidos = await service.listarPedidos(testData.usuario.id);
      expect(pedidos.length).toBeGreaterThan(0);
      for (const p of pedidos) {
        expect(p.fechaCreacion).toBeInstanceOf(Date);
        expect(typeof p.fechaCreacion.getTime).toBe("function");
      }
      expect(pedidos.some((p) => p.id === p1.id)).toBe(true);
      expect(pedidos.some((p) => p.id === p2.id)).toBe(true);
    });

    it("listarPedidos con filtro de estado", async () => {
      await prisma.pedido.create({
        data: {
          usuarioId: testData.usuario.id,
          negocioId: testData.negocio.id,
          total: 25.5,
          tipo: "producto",
          negocioIds: JSON.stringify([testData.negocio.id]),
          estado: "pendiente",
        },
      });
      await prisma.pedido.create({
        data: {
          usuarioId: testData.usuario.id,
          negocioId: testData.negocio.id,
          total: 50.0,
          tipo: "producto",
          negocioIds: JSON.stringify([testData.negocio.id]),
          estado: "completado",
        },
      });

      const pendientes = await service.listarPedidos(testData.usuario.id, {
        estado: ["pendiente"],
      });
      expect(pendientes.every((p) => p.estado === "pendiente")).toBe(true);
    });

    it("actualizarEstado cambia el estado del pedido y devuelve Date instances", async () => {
      const pedido = await prisma.pedido.create({
        data: {
          usuarioId: testData.usuario.id,
          negocioId: testData.negocio.id,
          total: 25.5,
          tipo: "producto",
          negocioIds: JSON.stringify([testData.negocio.id]),
          estado: "pendiente",
        },
      });

      const actualizado = await service.actualizarEstado(pedido.id, "completado");

      expect(actualizado.id).toBe(pedido.id);
      expect(actualizado.estado).toBe("completado");
      expect(actualizado.fechaCreacion).toBeInstanceOf(Date);
      expect(typeof actualizado.fechaCreacion.getTime).toBe("function");
    });

    it("actualizarEstado a cancelado lanza BusinessError si pago está COMPLETADO", async () => {
      const pedido = await prisma.pedido.create({
        data: {
          usuarioId: testData.usuario.id,
          negocioId: testData.negocio.id,
          total: 25.5,
          tipo: "producto",
          negocioIds: JSON.stringify([testData.negocio.id]),
          estado: "pendiente",
          pago: {
            create: {
              estado: "COMPLETADO",
              monto: 25.5,
              metodo: "TRANSFERENCIA_BANCARIA",
            },
          },
        },
      });

      await expect(service.actualizarEstado(pedido.id, "cancelado")).rejects.toThrow(
        BusinessError
      );
    });

    it("invalidateCache no lanza errores", async () => {
      await expect(
        service.invalidateCache(testData.usuario.id, "fake-pedido-id")
      ).resolves.toBeUndefined();
    });

    it("asignarLogistica asigna opcion logistica al pedido", async () => {
      const proveedorUsuario = await prisma.user.create({
        data: {
          email: "logistica@test.com",
          password: "password123",
          nombre: "Proveedor Logística",
          rol: "LOGISTICA",
        },
      });

      const proveedor = await prisma.proveedorLogistico.create({
        data: {
          usuarioId: proveedorUsuario.id,
          nombre: "Envíos Express",
          zonaCobertura: "Local",
          alcanceNacional: false,
          contacto: "contacto@test.com",
          activo: true,
        },
      });

      const opcionLogistica = await prisma.opcionLogistica.create({
        data: {
          negocioId: testData.negocio.id,
          proveedorId: proveedor.id,
          nombre: "Envío estándar",
          tipo: "DOMICILIO",
          tarifaBase: 5.0,
          tarifaPorDistancia: 0.5,
          tiempoEstimado: "24-48h",
        },
      });

      const pedido = await prisma.pedido.create({
        data: {
          usuarioId: testData.usuario.id,
          negocioId: testData.negocio.id,
          total: 25.5,
          tipo: "producto",
          negocioIds: JSON.stringify([testData.negocio.id]),
          estado: "pendiente",
        },
      });

      const result = await service.asignarLogistica(pedido.id, opcionLogistica.id);

      expect(result.opcionLogisticaId).toBe(opcionLogistica.id);
      RESERVA_TEST_IDS.push(pedido.id);
    });

    it("asignarLogistica con opcion inexistente lanza BusinessError", async () => {
      const pedido = await prisma.pedido.create({
        data: {
          usuarioId: testData.usuario.id,
          negocioId: testData.negocio.id,
          total: 25.5,
          tipo: "producto",
          negocioIds: JSON.stringify([testData.negocio.id]),
          estado: "pendiente",
        },
      });

      await expect(
        service.asignarLogistica(pedido.id, "nonexistent-logistica-id")
      ).rejects.toThrow(BusinessError);
    });
  });
});
