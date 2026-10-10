import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import { HORA_CORTE_DISPONIBILIDAD } from "@/core/constants";
import {
  listarProductos,
  listarServicios,
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
import { getCache, cacheKeys, cachePrefixes, resetCache } from "@/infrastructure";

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
    await getCache().del(cacheKeys.carrito.usuario(testData.usuario.id));
    await getCache().invalidatePrefix(cachePrefixes.pedidosUsuario + testData.usuario.id + ":");
    await getCache().invalidatePrefix(cachePrefixes.facturas + testData.usuario.id + ":");
    await getCache().invalidatePrefix(cachePrefixes.facturas + testData.negocio.id + ":");
    await getCache().del(cacheKeys.reporte.ventas(testData.negocio.id));
    await getCache().del(cacheKeys.reporte.productos(testData.negocio.id));
    await getCache().del(cacheKeys.reporte.inventario(testData.negocio.id));

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

    it("should filter by areaId through the product subarea", async () => {
      const area2 = await prisma.area.create({
        data: { nombre: "Alimentos", slug: `alimentos-area-filter-${Date.now()}`, activo: true },
      });
      const subarea2 = await prisma.subarea.create({
        data: {
          nombre: "Granos",
          slug: `granos-area-filter-${Date.now()}`,
          areaId: area2.id,
          activo: true,
        },
      });
      const negocio2 = await prisma.negocio.create({
        data: {
          nombre: "Negocio de alimentos",
          slug: `negocio-alimentos-${Date.now()}`,
          activo: true,
          areaId: testData.area.id,
          regimenFiscal: "GENERAL",
          tasaIVA: 10,
          modoPrecio: "IVA_INCLUIDO",
          nit: "987654321",
        },
      });
      await prisma.negocioSubarea.create({
        data: { negocioId: negocio2.id, subareaId: subarea2.id },
      });
      await prisma.producto.create({
        data: {
          negocioId: negocio2.id,
          subareaId: subarea2.id,
          nombre: "Arroz",
          descripcion: "Arroz de prueba",
          precio: 10,
          unidadMedida: "kg",
          imagenUrl: "https://example.com/arroz.jpg",
          activo: true,
          disponibleHoy: true,
        },
      });

      const productos = await listarProductos({ areaId: testData.area.id });
      expect(productos.length).toBeGreaterThan(0);
      expect(productos.every((p) => p.subarea?.areaId === testData.area.id)).toBe(
        true
      );
      expect(productos.some((p) => p.nombre === "Arroz")).toBe(false);

      const productosArea2 = await listarProductos({ areaId: area2.id });
      expect(productosArea2.map((p) => p.nombre)).toContain("Arroz");
      const productosPorSlug = await listarProductos({ area: area2.slug });
      expect(productosPorSlug.map((p) => p.nombre)).toContain("Arroz");
      await expect(
        listarProductos({ area: "area-inexistente-para-prueba" })
      ).resolves.toHaveLength(0);
    });

    it("should filter services by areaId through the subarea", async () => {
      const alimentosArea = await prisma.area.create({
        data: { nombre: "Alimentos", slug: `alimentos-servicios-${Date.now()}`, activo: true },
      });
      const granos = await prisma.subarea.create({
        data: {
          nombre: "Granos y secos",
          slug: `granos-servicios-${Date.now()}`,
          areaId: alimentosArea.id,
          activo: true,
        },
      });
      const negocioAlimentos = await prisma.negocio.create({
        data: {
          nombre: "Negocio alimentos",
          slug: `negocio-alimentos-servicios-${Date.now()}`,
          activo: true,
          areaId: testData.area.id,
          regimenFiscal: "GENERAL",
          tasaIVA: 10,
          modoPrecio: "IVA_INCLUIDO",
          nit: "111222333",
        },
      });
      await prisma.negocioSubarea.create({
        data: { negocioId: negocioAlimentos.id, subareaId: granos.id },
      });
      await prisma.servicio.create({
        data: {
          negocioId: negocioAlimentos.id,
          subareaId: granos.id,
          nombre: "Entrega express",
          descripcion: "Servicio de entrega",
          duracionMinutos: 30,
          horariosDisponibles: JSON.stringify([]),
          capacidad: 2,
          imagenUrl: "https://example.com/express.jpg",
          activo: true,
        },
      });

      const servicios = await listarServicios({ areaId: testData.area.id });
      expect(servicios.every((s) => s.subarea?.areaId === testData.area.id)).toBe(true);
      expect(servicios.some((s) => s.nombre === "Entrega express")).toBe(false);

      const serviciosArea2 = await listarServicios({ areaId: alimentosArea.id });
      expect(serviciosArea2.map((s) => s.nombre)).toContain("Entrega express");
      const serviciosPorSlug = await listarServicios({ area: alimentosArea.slug });
      expect(serviciosPorSlug.map((s) => s.nombre)).toContain("Entrega express");
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
      expect(Number(pedido.total)).toBeCloseTo(Number(testData.producto.precio), 2);

      const pedidosResult = await listarPedidos(testData.usuario.id);
      const pedidos = pedidosResult.data;
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
      expect(factura.numero).toMatch(/^PR-\d{4}-[A-Z0-9]{6}$/);
      expect(Number(factura.total)).toBeCloseTo(Number(pedido.total), 2);
      expect(factura.items.length).toBe(1);

      const facturasResult = await listarFacturas(testData.usuario.id);
      const facturas = facturasResult.data;
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
      expect(factura.numero).toMatch(/^PR-\d{4}-[A-Z0-9]{6}$/);

      const facturasResult = await listarFacturas(testData.usuario.id);
      const facturas = facturasResult.data;
      expect(facturas.some((f) => f.id === factura.id)).toBe(true);
    });
  });
});
