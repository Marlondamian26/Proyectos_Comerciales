import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import {
  listarProductos,
  agregarAlCarrito,
  listarCarrito,
  crearReserva,
  listarReservas,
  crearPedido,
  listarPedidos,
  emitirFactura,
  listarFacturas,
  reporteVentasPorDia,
  reporteProductosMasVendidos,
  reporteInventario,
} from "@/lib/actions";
import { delCache, clearCache } from "@/lib/cache";

vi.mock("@/lib/auth/requireRole", () => ({
  requireRole: vi.fn(async () => ({
    id: "test-user-id",
    email: "test@test.com",
    rol: "ADMIN",
  })),
}));

describe("Backend API Integration Tests", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    clearCache();
    delCache(`carrito:${testData.usuario.id}`);
    delCache(`reservas:${testData.usuario.id}`);
    delCache(`pedidos:${testData.usuario.id}`);
    delCache(`facturas:usuario:${testData.usuario.id}`);
    delCache(`facturas:negocio:${testData.negocio.id}`);
    delCache(`reporte:ventas:${testData.negocio.id}`);
    delCache(`reporte:productos:${testData.negocio.id}`);
    delCache(`reporte:inventario:${testData.negocio.id}`);

    await prisma.facturaItem.deleteMany({});
    await prisma.factura.deleteMany({});
    await prisma.pedidoItem.deleteMany({});
    await prisma.pedido.deleteMany({});
    await prisma.carritoItem.deleteMany({});
    await prisma.carrito.deleteMany({});
    await prisma.reserva.deleteMany({});
  });

  describe("listarProductos", () => {
    it("should return active products", async () => {
      const productos = await listarProductos();
      expect(productos.length).toBeGreaterThan(0);
      expect(productos[0].activo).toBe(true);
    });

    it("should filter by negocioId", async () => {
      const productos = await listarProductos({ negocioId: testData.negocio.id });
      expect(productos.length).toBeGreaterThan(0);
      expect(productos.every((p) => p.negocioId === testData.negocio.id)).toBe(
        true
      );
    });
  });

  describe("Carrito flow (agregarAlCarrito → listarCarrito)", () => {
    it("should add item to cart and retrieve it", async () => {
      await agregarAlCarrito(testData.usuario.id, {
        productoId: testData.producto.id,
        cantidad: 2,
      });

      const carrito = await listarCarrito(testData.usuario.id);
      expect(carrito).not.toBeNull();
      expect(carrito!.items.length).toBe(1);
      expect(carrito!.items[0].cantidad).toBe(2);
      expect(carrito!.items[0].precioUnitario).toBe(
        testData.producto.precio
      );
    });

    it("should increment quantity when adding same item twice", async () => {
      await agregarAlCarrito(testData.usuario.id, {
        productoId: testData.producto.id,
        cantidad: 1,
      });
      await agregarAlCarrito(testData.usuario.id, {
        productoId: testData.producto.id,
        cantidad: 3,
      });

      const carrito = await listarCarrito(testData.usuario.id);
      expect(carrito!.items.length).toBe(1);
      expect(carrito!.items[0].cantidad).toBe(4);
    });
  });

  describe("Reserva flow (crearReserva → listarReservas)", () => {
    it("should create a reservation and list it", async () => {
      const fechaInicio = new Date();
      fechaInicio.setHours(fechaInicio.getHours() + 3);

      const reserva = await crearReserva(testData.usuario.id, {
        servicioId: testData.servicio.id,
        fechaHoraInicio: fechaInicio.toISOString(),
      });

      expect(reserva.id).toBeDefined();
      expect(reserva.estado).toBe("pendiente");

      const reservas = await listarReservas(testData.usuario.id);
      expect(reservas.length).toBeGreaterThan(0);
      expect(reservas.some((r) => r.id === reserva.id)).toBe(true);
    });
  });

  describe("Pedido flow (crearPedido → listarPedidos)", () => {
    it("should create a pedido from carrito", async () => {
      await agregarAlCarrito(testData.usuario.id, {
        productoId: testData.producto.id,
        cantidad: 1,
      });

      const pedido = await crearPedido(testData.usuario.id, {
        direccionEntrega: "Calle Test 123",
      });

      expect(pedido.id).toBeDefined();
      expect(pedido.estado).toBe("pendiente");
      expect(pedido.items.length).toBe(1);
      expect(pedido.total).toBe(testData.producto.precio);

      const pedidos = await listarPedidos(testData.usuario.id);
      expect(pedidos.length).toBeGreaterThan(0);
      expect(pedidos.some((p) => p.id === pedido.id)).toBe(true);
    });
  });

  describe("Factura flow (emitirFactura → listarFacturas)", () => {
    it("should emit a factura from a pedido", async () => {
      await agregarAlCarrito(testData.usuario.id, {
        productoId: testData.producto.id,
        cantidad: 2,
      });

      const pedido = await crearPedido(testData.usuario.id, {
        direccionEntrega: "Calle Test 456",
      });

      const factura = await emitirFactura(pedido.id);

      expect(factura.id).toBeDefined();
      expect(factura.estado).toBe("emitida");
      expect(factura.numero).toMatch(/^FAC-\d{8}-[A-Z0-9]{4}$/);
      expect(factura.total).toBeCloseTo(
        pedido.total * 1.21,
        2
      );
      expect(factura.items.length).toBe(1);

      const facturas = await listarFacturas(testData.usuario.id);
      expect(facturas.length).toBeGreaterThan(0);
      expect(facturas.some((f) => f.id === factura.id)).toBe(true);
    });

    it("should throw if factura already exists for same pedido", async () => {
      await agregarAlCarrito(testData.usuario.id, {
        productoId: testData.producto.id,
        cantidad: 1,
      });

      const pedido = await crearPedido(testData.usuario.id, {
        direccionEntrega: "Calle Test 789",
      });

      await emitirFactura(pedido.id);

      await expect(emitirFactura(pedido.id)).rejects.toThrow(
        "existe una factura"
      );
    });
  });

  describe("Reportes", () => {
    it("should generate reporteVentasPorDia", async () => {
      await agregarAlCarrito(testData.usuario.id, {
        productoId: testData.producto.id,
        cantidad: 1,
      });

      const pedido = await crearPedido(testData.usuario.id, {
        direccionEntrega: "Calle Test",
      });

      await emitirFactura(pedido.id);

      const reporte = await reporteVentasPorDia(testData.negocio.id);
      expect(Array.isArray(reporte)).toBe(true);
      expect(reporte.length).toBeGreaterThan(0);
      expect(reporte[0]).toHaveProperty("fecha");
      expect(reporte[0]).toHaveProperty("totalVentas");
      expect(reporte[0]).toHaveProperty("cantidad");
    });

    it("should generate reporteProductosMasVendidos", async () => {
      const reporte = await reporteProductosMasVendidos(testData.negocio.id);
      expect(Array.isArray(reporte)).toBe(true);
    });

    it("should generate reporteInventario", async () => {
      const reporte = await reporteInventario(testData.negocio.id);
      expect(Array.isArray(reporte)).toBe(true);
      expect(reporte.length).toBeGreaterThan(0);
      expect(reporte[0]).toHaveProperty("producto");
      expect(reporte[0]).toHaveProperty("cantidadActual");
    });
  });

  describe("Reserva → Pedido → Factura full flow", () => {
    it("completes the full workflow", async () => {
      const fechaInicio = new Date();
      fechaInicio.setHours(fechaInicio.getHours() + 2);

      const reserva = await crearReserva(testData.usuario.id, {
        servicioId: testData.servicio.id,
        fechaHoraInicio: fechaInicio.toISOString(),
      });
      expect(reserva.estado).toBe("pendiente");

      const reservas = await listarReservas(testData.usuario.id);
      expect(reservas.some((r) => r.id === reserva.id)).toBe(true);

      await agregarAlCarrito(testData.usuario.id, {
        servicioId: testData.servicio.id,
        cantidad: 1,
      });

      const pedido = await crearPedido(testData.usuario.id, {
        direccionEntrega: "Calle Test Flow",
      });
      expect(pedido.tipo).toBe("servicio");

      const factura = await emitirFactura(pedido.id);
      expect(factura.numero).toMatch(/^FAC-\d{8}-[A-Z0-9]{4}$/);

      const facturas = await listarFacturas(testData.usuario.id);
      expect(facturas.some((f) => f.id === factura.id)).toBe(true);
    });
  });
});
