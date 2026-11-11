import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import { CheckoutService } from "@/services/CheckoutService";
import { CartService } from "@/services/CartService";
import { DisponibilidadService } from "@/services/DisponibilidadService";
import { getCache, cacheKeys, resetCache } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import {
  CODIGO_CARRITO_VACIO,
  CODIGO_SIN_DISPONIBILIDAD,
  CODIGO_OPCION_INVALIDA,
  CODIGO_DIRECCION_REQUERIDA,
} from "@/core/constants";
import { HORA_CORTE_DISPONIBILIDAD } from "@/core/constants";
import { fechaHoy } from "@/shared/utils/fecha";
import { Rol } from "@/generated/prisma/client";

const checkoutService = new CheckoutService();
const cartService = new CartService();
const dispService = new DisponibilidadService();

describe("CheckoutService", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;
  let negocioConEnvio: { id: string; nombre: string };
  let negocioSinEnvio: { id: string; nombre: string };
  let productoConEnvio: { id: string; nombre: string; precio: number };
  let productoRecogida: { id: string; nombre: string; precio: number };
  let opcionLogistica: { id: string; tarifaBase: number };
  let usuarioId: string;

  beforeAll(async () => {
    const mockNow = new Date();
    mockNow.setHours(HORA_CORTE_DISPONIBILIDAD - 3, 0, 0, 0);
    vi.useFakeTimers({ now: mockNow });

    testData = await setupTestData();
    usuarioId = testData.usuario.id;

    // Negocio 1: permite envío
    await prisma.negocio.update({
      where: { id: testData.negocio.id },
      data: { permiteEnvio: true },
    });

    negocioConEnvio = { id: testData.negocio.id, nombre: testData.negocio.nombre };

    // Producto para negocio con envío
    productoConEnvio = {
      id: testData.producto.id,
      nombre: testData.producto.nombre,
      precio: testData.producto.precio,
    };

    // Proveedor de logística
    const proveedorLog = await prisma.user.create({
      data: {
        email: "logistica@test.com",
        password: "password123",
        nombre: "Proveedor Test",
        rol: Rol.LOGISTICA,
      },
    });

    const proveedor = await prisma.proveedorLogistico.create({
      data: {
        usuarioId: proveedorLog.id,
        nombre: "Envíos Express",
        zonaCobertura: "Local",
        alcanceNacional: false,
        contacto: "contacto@test.com",
        activo: true,
      },
    });

    opcionLogistica = {
      id: "" as string,
      tarifaBase: 0,
    };
    const op = await prisma.opcionLogistica.create({
      data: {
        negocioId: negocioConEnvio.id,
        proveedorId: proveedor.id,
        nombre: "Envío Express",
        tipo: "EXPRESS",
        tarifaBase: 5.99,
        tarifaPorDistancia: 0.5,
        tiempoEstimado: "24-48h",
      },
    });
    opcionLogistica.id = op.id;
    opcionLogistica.tarifaBase = op.tarifaBase;

    // Negocio 2: sin permiteEnvio
    const area = await prisma.area.create({
      data: { nombre: "Servicios B", slug: "servicios-b", activo: true },
    });
    const subarea = await prisma.subarea.create({
      data: {
        nombre: "Estética",
        slug: "estetica",
        activo: true,
      },
    });

    negocioSinEnvio = {
      id: "",
      nombre: "",
    } as { id: string; nombre: string };
    const neg = await prisma.negocio.create({
      data: {
        nombre: "Spa Recogida",
        slug: "spa-recogida",
        activo: true,
        areaId: area.id,
        permiteEnvio: false,
      },
      select: { id: true, nombre: true },
    });
    negocioSinEnvio.id = neg.id;
    negocioSinEnvio.nombre = neg.nombre;

    // Producto para negocio sin envío
    const prodRecogida = await prisma.producto.create({
      data: {
        negocioId: negocioSinEnvio.id,
        subareaId: subarea.id,
        nombre: "Kit Manicura",
        descripcion: "Kit de manicura",
        precio: 15.0,
        unidadMedida: "unidad",
        activo: true,
        disponibleHoy: true,
        imagenUrl: "https://example.com/kit-manicura.jpg",
      },
    });
    productoRecogida = {
      id: prodRecogida.id,
      nombre: prodRecogida.nombre,
      precio: prodRecogida.precio,
    };

    // Inventario para producto recogida
    await prisma.inventario.create({
      data: {
        productoId: prodRecogida.id,
        cantidadActual: 100,
        puntoReorden: 10,
        ubicacion: "Almacén B",
      },
    });

    // Disponibilidad diaria para producto recogida
    const hoy = fechaHoy();
    for (let i = 0; i <= 7; i++) {
      const fecha = new Date(hoy);
      fecha.setUTCDate(fecha.getUTCDate() + i);
      await prisma.disponibilidadProducto.create({
        data: {
          productoId: prodRecogida.id,
          fecha,
          cantidad: 100,
        },
      });
    }
  });

  afterAll(async () => {
    vi.useRealTimers();
    await cleanupTestData();
  });

  beforeEach(async () => {
    await resetCache();
    await cartService.vaciarCarrito(usuarioId);
    await getCache().del(cacheKeys.carrito.usuario(usuarioId));

    // Restaurar disponibilidad de productos de test
    await prisma.disponibilidadProducto.updateMany({
      where: { productoId: productoConEnvio.id },
      data: { cantidad: 100 },
    });
    await prisma.inventario.updateMany({
      where: { productoId: productoConEnvio.id },
      data: { cantidadActual: 100 },
    });
    await prisma.disponibilidadProducto.updateMany({
      where: { productoId: productoRecogida.id },
      data: { cantidad: 100 },
    });
    await prisma.inventario.updateMany({
      where: { productoId: productoRecogida.id },
      data: { cantidadActual: 100 },
    });
  });

  // ---------------------------------------------------------------------------
  // 1. prepararCheckout agrupa correctamente por negocio
  // ---------------------------------------------------------------------------
  it("prepararCheckout agrupa items de 2 negocios en 2 grupos", async () => {
    await cartService.anadirItem(usuarioId, {
      productoId: productoConEnvio.id,
      cantidad: 1,
    });
    await cartService.anadirItem(usuarioId, {
      productoId: productoRecogida.id,
      cantidad: 2,
    });

    const result = await checkoutService.prepararCheckout(usuarioId, {});

    expect(result.grupos).toHaveLength(2);
    expect(result.grupos.some((g) => g.negocioId === negocioConEnvio.id)).toBe(true);
    expect(result.grupos.some((g) => g.negocioId === negocioSinEnvio.id)).toBe(true);

    const grupoEnvio = result.grupos.find((g) => g.negocioId === negocioConEnvio.id)!;
    const grupoRecogida = result.grupos.find((g) => g.negocioId === negocioSinEnvio.id)!;

    expect(grupoEnvio.items.length).toBe(1);
    expect(grupoRecogida.items.length).toBe(1);

    expect(grupoEnvio.subtotal).toBeCloseTo(25.5, 2);
    expect(grupoRecogida.subtotal).toBeCloseTo(30.0, 2);

    expect(grupoEnvio.iva).toBeCloseTo(25.5 - 25.5 / 1.1, 2);
    expect(grupoRecogida.iva).toBeCloseTo(30.0 - 30.0 / 1.1, 2);
  });

  // ---------------------------------------------------------------------------
  // 2. prepararCheckout marca disponibilidadOk: false si un item no tiene disponibilidad
  // ---------------------------------------------------------------------------
  it("prepararCheckout marca disponibilidadOk false cuando no hay stock", async () => {
    await cartService.anadirItem(usuarioId, {
      productoId: productoConEnvio.id,
      cantidad: 1,
    });

    // Agotar el producto y limpiar caché de disponibilidad
    await prisma.disponibilidadProducto.updateMany({
      where: { productoId: productoConEnvio.id },
      data: { cantidad: 0 },
    });
    await prisma.inventario.updateMany({
      where: { productoId: productoConEnvio.id },
      data: { cantidadActual: 0 },
    });
    dispService.invalidateProductoCache(productoConEnvio.id);

    const result = await checkoutService.prepararCheckout(usuarioId, {});

    const grupo = result.grupos[0];
    expect(grupo.disponibilidadOk).toBe(false);
    expect(grupo.erroresDisponibilidad.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // 3. prepararCheckout no incluye opcionesLogistica si negocio.permiteEnvio === false
  // ---------------------------------------------------------------------------
  it("prepararCheckout no incluye opcionesLogistica si permiteEnvio es false", async () => {
    await cartService.anadirItem(usuarioId, {
      productoId: productoRecogida.id,
      cantidad: 1,
    });

    const result = await checkoutService.prepararCheckout(usuarioId, {});

    const grupo = result.grupos.find((g) => g.negocioId === negocioSinEnvio.id)!;
    expect(grupo.opcionesLogistica).toHaveLength(0);
    expect(grupo.negocio.permiteEnvio).toBe(false);
  });

  it("prepararCheckout incluye opcionesLogistica si permiteEnvio es true", async () => {
    await cartService.anadirItem(usuarioId, {
      productoId: productoConEnvio.id,
      cantidad: 1,
    });

    const result = await checkoutService.prepararCheckout(usuarioId, {});

    const grupo = result.grupos.find((g) => g.negocioId === negocioConEnvio.id)!;
    expect(grupo.opcionesLogistica.length).toBeGreaterThan(0);
    expect(grupo.opcionesLogistica[0].id).toBe(opcionLogistica.id);
  });

  // ---------------------------------------------------------------------------
  // 4. confirmarCheckout crea un pedido por negocio en transacción
  // ---------------------------------------------------------------------------
  it("confirmarCheckout crea un pedido por negocio", async () => {
    await cartService.anadirItem(usuarioId, {
      productoId: productoConEnvio.id,
      cantidad: 1,
    });
    await cartService.anadirItem(usuarioId, {
      productoId: productoRecogida.id,
      cantidad: 1,
    });

    const preparado = await checkoutService.prepararCheckout(usuarioId, {});

    const payload = {
      checkoutToken: preparado.checkoutToken,
      grupos: [
        {
          negocioId: negocioConEnvio.id,
          tipoEntrega: "DOMICILIO" as const,
          opcionLogisticaId: opcionLogistica.id,
          direccionEntrega: "Calle Test 123",
        },
        {
          negocioId: negocioSinEnvio.id,
          tipoEntrega: "RECOGIDA_TIENDA" as const,
        },
      ],
    };

    const result = await checkoutService.confirmarCheckout(usuarioId, payload);

    expect(result.pedidosCreados).toHaveLength(2);
    expect(result.pedidosCreados.some((p) => p.negocioId === negocioConEnvio.id)).toBe(true);
    expect(result.pedidosCreados.some((p) => p.negocioId === negocioSinEnvio.id)).toBe(true);

    // Verificar que los pedidos están en la BD
    const pedidosDb = await prisma.pedido.findMany({
      where: { usuarioId },
    });
    expect(pedidosDb.length).toBe(2);

    const pedidoEnvio = pedidosDb.find((p) => p.negocioId === negocioConEnvio.id);
    expect(pedidoEnvio!.tipoEntrega).toBe("DOMICILIO");
    expect(pedidoEnvio!.opcionLogisticaId).toBe(opcionLogistica.id);
    expect(Number(pedidoEnvio!.costoEnvio)).toBe(Number(opcionLogistica.tarifaBase));

    const pedidoRecogida = pedidosDb.find((p) => p.negocioId === negocioSinEnvio.id);
    expect(pedidoRecogida!.tipoEntrega).toBe("RECOGIDA_TIENDA");
    expect(pedidoRecogida!.opcionLogisticaId).toBeNull();
    expect(Number(pedidoRecogida!.costoEnvio)).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 5. confirmarCheckout lanza DIRECCION_REQUERIDA si DOMICILIO sin dirección
  // ---------------------------------------------------------------------------
  it("confirmarCheckout lanza DIRECCION_REQUERIDA si domicilio sin dirección", async () => {
    await cartService.anadirItem(usuarioId, {
      productoId: productoConEnvio.id,
      cantidad: 1,
    });

    const preparado = await checkoutService.prepararCheckout(usuarioId, {});

    const payload = {
      checkoutToken: preparado.checkoutToken,
      grupos: [
        {
          negocioId: negocioConEnvio.id,
          tipoEntrega: "DOMICILIO" as const,
          opcionLogisticaId: opcionLogistica.id,
          // direccionEntrega ausente
        },
      ],
    };

    await expect(checkoutService.confirmarCheckout(usuarioId, payload)).rejects.toThrow(
      BusinessError
    );

    await expect(checkoutService.confirmarCheckout(usuarioId, payload)).rejects.toThrow();
    try {
      await checkoutService.confirmarCheckout(usuarioId, payload);
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_DIRECCION_REQUERIDA);
      } else {
        throw err;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 6. confirmarCheckout lanza OPCION_INVALIDA si la opción no pertenece al negocio
  // ---------------------------------------------------------------------------
  it("confirmarCheckout lanza OPCION_INVALIDA si la opción no pertenece al negocio", async () => {
    await cartService.anadirItem(usuarioId, {
      productoId: productoConEnvio.id,
      cantidad: 1,
    });
    await cartService.anadirItem(usuarioId, {
      productoId: productoRecogida.id,
      cantidad: 1,
    });

    const preparado = await checkoutService.prepararCheckout(usuarioId, {});

    // Negocio 2 (sin envío) con opción del negocio 1 — no es válido
    const payload = {
      checkoutToken: preparado.checkoutToken,
      grupos: [
        {
          negocioId: negocioConEnvio.id,
          tipoEntrega: "RECOGIDA_TIENDA" as const,
        },
        {
          negocioId: negocioSinEnvio.id,
          tipoEntrega: "DOMICILIO" as const,
          opcionLogisticaId: opcionLogistica.id, // pertenece al negocio 1, no al 2
          direccionEntrega: "Calle Test",
        },
      ],
    };

    await expect(checkoutService.confirmarCheckout(usuarioId, payload)).rejects.toThrow(
      BusinessError
    );
    try {
      await checkoutService.confirmarCheckout(usuarioId, payload);
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_OPCION_INVALIDA);
      } else {
        throw err;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 7. confirmarCheckout lanza SIN_DISPONIBILIDAD si un item se agotó entre preparar y confirmar
  // ---------------------------------------------------------------------------
  it("confirmarCheckout lanza SIN_DISPONIBILIDAD si un item se agotó entre preparar y confirmar", async () => {
    await cartService.anadirItem(usuarioId, {
      productoId: productoConEnvio.id,
      cantidad: 1,
    });

    const preparado = await checkoutService.prepararCheckout(usuarioId, {});

    // Agotar el producto entre preparar y confirmar
    await prisma.disponibilidadProducto.updateMany({
      where: { productoId: productoConEnvio.id },
      data: { cantidad: 0 },
    });
    await prisma.inventario.updateMany({
      where: { productoId: productoConEnvio.id },
      data: { cantidadActual: 0 },
    });
    dispService.invalidateProductoCache(productoConEnvio.id);

    const payload = {
      checkoutToken: preparado.checkoutToken,
      grupos: [
        {
          negocioId: negocioConEnvio.id,
          tipoEntrega: "DOMICILIO" as const,
          opcionLogisticaId: opcionLogistica.id,
          direccionEntrega: "Calle Test",
        },
      ],
    };

    await expect(checkoutService.confirmarCheckout(usuarioId, payload)).rejects.toThrow(
      BusinessError
    );
    try {
      await checkoutService.confirmarCheckout(usuarioId, payload);
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_SIN_DISPONIBILIDAD);
      } else {
        throw err;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 8. confirmarCheckout vacía el carrito tras éxito
  // ---------------------------------------------------------------------------
  it("confirmarCheckout vacía el carrito tras éxito", async () => {
    await cartService.anadirItem(usuarioId, {
      productoId: productoConEnvio.id,
      cantidad: 1,
    });

    const preparado = await checkoutService.prepararCheckout(usuarioId, {});

    const payload = {
      checkoutToken: preparado.checkoutToken,
      grupos: [
        {
          negocioId: negocioConEnvio.id,
          tipoEntrega: "DOMICILIO" as const,
          opcionLogisticaId: opcionLogistica.id,
          direccionEntrega: "Calle Test",
        },
      ],
    };

    await checkoutService.confirmarCheckout(usuarioId, payload);

    const carritoDespues = await cartService.obtenerCarrito(usuarioId);
    expect(carritoDespues).not.toBeNull();
    expect(carritoDespues!.items).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // 9. confirmarCheckout NO vacía el carrito si falla la transacción
  // ---------------------------------------------------------------------------
  it("confirmarCheckout NO vacía el carrito si falla la transacción", async () => {
    await cartService.anadirItem(usuarioId, {
      productoId: productoConEnvio.id,
      cantidad: 1,
    });

    const preparado = await checkoutService.prepararCheckout(usuarioId, {});

    // Payload inválido: dirección faltante
    const payload = {
      checkoutToken: preparado.checkoutToken,
      grupos: [
        {
          negocioId: negocioConEnvio.id,
          tipoEntrega: "DOMICILIO" as const,
          opcionLogisticaId: opcionLogistica.id,
          // direccionEntrega ausente → fallará
        },
      ],
    };

    await expect(
      checkoutService.confirmarCheckout(usuarioId, payload)
    ).rejects.toThrow();

    const carritoDespues = await cartService.obtenerCarrito(usuarioId);
    expect(carritoDespues).not.toBeNull();
    expect(carritoDespues!.items.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // 10. recalcularTotales aplica IVA 10% y suma costoEnvio correctamente
  // ---------------------------------------------------------------------------
  it("recalcularTotales aplica IVA 10% y suma costoEnvio", async () => {
    await cartService.anadirItem(usuarioId, {
      productoId: productoConEnvio.id,
      cantidad: 1,
    });
    await cartService.anadirItem(usuarioId, {
      productoId: productoRecogida.id,
      cantidad: 2,
    });

    const seleccion = {
      grupos: [
        {
          negocioId: negocioConEnvio.id,
          tipoEntrega: "DOMICILIO" as const,
          opcionLogisticaId: opcionLogistica.id,
          direccionEntrega: "Calle Test",
        },
        {
          negocioId: negocioSinEnvio.id,
          tipoEntrega: "RECOGIDA_TIENDA" as const,
        },
      ],
    };

    const totales = await checkoutService.recalcularTotales(usuarioId, seleccion);

    const subtotalEsperado = 25.5 + 30.0;
    const ivaEsperado = (25.5 - 25.5 / 1.1) + (30.0 - 30.0 / 1.1);
    const envioEsperado = opcionLogistica.tarifaBase; // 5.99
    const totalEsperado = subtotalEsperado + envioEsperado;

    expect(totales.subtotal).toBeCloseTo(subtotalEsperado, 2);
    expect(totales.iva).toBeCloseTo(ivaEsperado, 2);
    expect(totales.envio).toBeCloseTo(envioEsperado, 2);
    expect(totales.total).toBeCloseTo(totalEsperado, 2);
  });

  // ---------------------------------------------------------------------------
  // 11. Recogida en tienda → costoEnvio === 0
  // ---------------------------------------------------------------------------
  it("recalcularTotales con recogida en tienda → costoEnvio === 0", async () => {
    await cartService.anadirItem(usuarioId, {
      productoId: productoConEnvio.id,
      cantidad: 1,
    });

    const seleccion = {
      grupos: [
        {
          negocioId: negocioConEnvio.id,
          tipoEntrega: "RECOGIDA_TIENDA" as const,
        },
      ],
    };

    const totales = await checkoutService.recalcularTotales(usuarioId, seleccion);

    expect(totales.envio).toBe(0);
    expect(totales.subtotal).toBeCloseTo(25.5, 2);
    expect(totales.iva).toBeCloseTo(25.5 - 25.5 / 1.1, 2);
    expect(totales.total).toBeCloseTo(25.5, 2);
  });
});
