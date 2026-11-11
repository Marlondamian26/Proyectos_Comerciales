import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import { CartService } from "@/services/CartService";
import { CheckoutService } from "@/services/CheckoutService";
import { CatalogService } from "@/services/CatalogService";
import { getCache, cacheKeys, resetCache } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import {
  CODIGO_METADATA_REQUERIDA,
  CODIGO_FECHA_INVALIDA,
  CODIGO_PESO_EXCEDIDO,
} from "@/core/constants";
import { HORA_CORTE_DISPONIBILIDAD } from "@/core/constants";
import { fechaHoy } from "@/shared/utils/fecha";
import { Rol, TipoServicio } from "@/generated/prisma/client";

const cartService = new CartService();
const checkoutService = new CheckoutService();
const catalogService = new CatalogService();

describe("Transporte como Servicio Comercializable", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;
  let usuarioId: string;
  let negocioId: string;
  let subareaId: string;
  let servicioTransporteNacional: { id: string; nombre: string };
  let servicioTransporteLocal: { id: string; nombre: string };
  let servicioTransportePesoLim: { id: string; nombre: string };

  beforeAll(async () => {
    const mockNow = new Date();
    mockNow.setHours(HORA_CORTE_DISPONIBILIDAD - 3, 0, 0, 0);
    vi.useFakeTimers({ now: mockNow });

    testData = await setupTestData();
    usuarioId = testData.usuario.id;
    negocioId = testData.negocio.id;
    subareaId = testData.subarea.id;

    const fechaFutura = new Date(fechaHoy());
    fechaFutura.setUTCDate(fechaFutura.getUTCDate() + 1);

    servicioTransporteNacional = await (async () => {
      const s = await prisma.servicio.create({
        data: {
          negocioId,
          subareaId,
          nombre: "Envío Paquetes Nacional",
          descripcion: "Envío de paquetes a todo el país",
          duracionMinutos: 120,
          horariosDisponibles: JSON.stringify([]),
          capacidad: 1,
          activo: true,
          tipo: TipoServicio.TRANSPORTE,
          tipoTransporte: "ENVIO_PAQUETE",
          alcanceNacional: true,
          precio: 25.0,
          imagenUrl: "https://example.com/envio-nacional.jpg",
        },
      });
      return { id: s.id, nombre: s.nombre };
    })();

    servicioTransporteLocal = await (async () => {
      const s = await prisma.servicio.create({
        data: {
          negocioId,
          subareaId,
          nombre: "Transporte Local",
          descripcion: "Transporte local de documentos",
          duracionMinutos: 30,
          horariosDisponibles: JSON.stringify([]),
          capacidad: 1,
          activo: true,
          tipo: TipoServicio.TRANSPORTE,
          tipoTransporte: "ENVIO_PAQUETE",
          alcanceNacional: false,
          origenBase: "La Habana",
          destinoBase: "Pinar del Río",
          precio: 15.0,
          imagenUrl: "https://example.com/transporte-local.jpg",
        },
      });
      return { id: s.id, nombre: s.nombre };
    })();

    servicioTransportePesoLim = await (async () => {
      const s = await prisma.servicio.create({
        data: {
          negocioId,
          subareaId,
          nombre: "Transporte Peso Limitado",
          descripcion: "Transporte con límite de peso",
          duracionMinutos: 60,
          horariosDisponibles: JSON.stringify([]),
          capacidad: 1,
          activo: true,
          tipo: TipoServicio.TRANSPORTE,
          tipoTransporte: "MUDANZA",
          pesoMaximo: 50,
          precio: 50.0,
          imagenUrl: "https://example.com/transporte-peso.jpg",
        },
      });
      return { id: s.id, nombre: s.nombre };
    })();
  });

  afterAll(async () => {
    vi.useRealTimers();
    await cleanupTestData();
  });

  beforeEach(async () => {
    await resetCache();
    await cartService.vaciarCarrito(usuarioId);
    await getCache().del(cacheKeys.carrito.usuario(usuarioId));
  });

  it("CartService: agregar servicio de transporte con metadata válida", async () => {
    const fechaFutura = new Date(fechaHoy());
    fechaFutura.setUTCDate(fechaFutura.getUTCDate() + 1);

    await cartService.anadirItem(usuarioId, {
      servicioId: servicioTransporteNacional.id,
      metadata: {
        origen: "La Habana",
        destino: "Santiago",
        fecha: fechaFutura.toISOString(),
        peso: 10,
      },
    });

    const carrito = await cartService.obtenerCarrito(usuarioId);
    expect(carrito).not.toBeNull();
    expect(carrito!.items).toHaveLength(1);
    expect(carrito!.items[0].servicio?.tipo).toBe("TRANSPORTE");
    expect(carrito!.items[0].precioUnitario).toBe(25.0);
  });

  it("CartService: transporte sin metadata lanza METADATA_REQUERIDA", async () => {
    await expect(
      cartService.anadirItem(usuarioId, {
        servicioId: servicioTransporteNacional.id,
      })
    ).rejects.toThrow(BusinessError);

    try {
      await cartService.anadirItem(usuarioId, {
        servicioId: servicioTransporteNacional.id,
      });
    } catch (err) {
      expect(err).toBeInstanceOf(BusinessError);
      expect((err as BusinessError).code).toBe(CODIGO_METADATA_REQUERIDA);
    }
  });

  it("CartService: transporte con metadata incompleta lanza METADATA_REQUERIDA", async () => {
    await expect(
      cartService.anadirItem(usuarioId, {
        servicioId: servicioTransporteNacional.id,
        metadata: { origen: "La Habana" },
      })
    ).rejects.toThrow(BusinessError);
  });

  it("CartService: transporte con fecha pasada lanza FECHA_INVALIDA", async () => {
    const fechaPasada = new Date(fechaHoy());
    fechaPasada.setUTCDate(fechaPasada.getUTCDate() - 1);

    await expect(
      cartService.anadirItem(usuarioId, {
        servicioId: servicioTransporteNacional.id,
        metadata: {
          origen: "La Habana",
          destino: "Santiago",
          fecha: fechaPasada.toISOString(),
        },
      })
    ).rejects.toThrow(BusinessError);

    try {
      await cartService.anadirItem(usuarioId, {
        servicioId: servicioTransporteNacional.id,
        metadata: {
          origen: "La Habana",
          destino: "Santiago",
          fecha: fechaPasada.toISOString(),
        },
      });
    } catch (err) {
      expect(err).toBeInstanceOf(BusinessError);
      expect((err as BusinessError).code).toBe(CODIGO_FECHA_INVALIDA);
    }
  });

  it("CartService: transporte local con origen distinto de base lanza RUTA_NO_CUBIERTA", async () => {
    const fechaFutura = new Date(fechaHoy());
    fechaFutura.setUTCDate(fechaFutura.getUTCDate() + 1);

    await expect(
      cartService.anadirItem(usuarioId, {
        servicioId: servicioTransporteLocal.id,
        metadata: {
          origen: "Camagüey",
          destino: "Santiago",
          fecha: fechaFutura.toISOString(),
        },
      })
    ).rejects.toThrow(BusinessError);

    try {
      await cartService.anadirItem(usuarioId, {
        servicioId: servicioTransporteLocal.id,
        metadata: {
          origen: "Camagüey",
          destino: "Santiago",
          fecha: fechaFutura.toISOString(),
        },
      });
    } catch (err) {
      expect(err).toBeInstanceOf(BusinessError);
      expect((err as BusinessError).code).toBe("RUTA_NO_CUBIERTA");
    }
  });

  it("CartService: transporte local con origen/destino base correctos", async () => {
    const fechaFutura = new Date(fechaHoy());
    fechaFutura.setUTCDate(fechaFutura.getUTCDate() + 1);

    await cartService.anadirItem(usuarioId, {
      servicioId: servicioTransporteLocal.id,
      metadata: {
        origen: "La Habana",
        destino: "Pinar del Río",
        fecha: fechaFutura.toISOString(),
      },
    });

    const carrito = await cartService.obtenerCarrito(usuarioId);
    expect(carrito!.items).toHaveLength(1);
    expect(carrito!.items[0].precioUnitario).toBe(15.0);
  });

  it("CartService: transporte con peso > pesoMaximo lanza PESO_EXCEDIDO", async () => {
    const fechaFutura = new Date(fechaHoy());
    fechaFutura.setUTCDate(fechaFutura.getUTCDate() + 1);

    await expect(
      cartService.anadirItem(usuarioId, {
        servicioId: servicioTransportePesoLim.id,
        metadata: {
          origen: "La Habana",
          destino: "Santiago",
          fecha: fechaFutura.toISOString(),
          peso: 60,
        },
      })
    ).rejects.toThrow(BusinessError);

    try {
      await cartService.anadirItem(usuarioId, {
        servicioId: servicioTransportePesoLim.id,
        metadata: {
          origen: "La Habana",
          destino: "Santiago",
          fecha: fechaFutura.toISOString(),
          peso: 60,
        },
      });
    } catch (err) {
      expect(err).toBeInstanceOf(BusinessError);
      expect((err as BusinessError).code).toBe(CODIGO_PESO_EXCEDIDO);
    }
  });

  it("CartService: transporte con peso <= pesoMaximo funciona", async () => {
    const fechaFutura = new Date(fechaHoy());
    fechaFutura.setUTCDate(fechaFutura.getUTCDate() + 1);

    await cartService.anadirItem(usuarioId, {
      servicioId: servicioTransportePesoLim.id,
      metadata: {
        origen: "La Habana",
        destino: "Santiago",
        fecha: fechaFutura.toISOString(),
        peso: 45,
      },
    });

    const carrito = await cartService.obtenerCarrito(usuarioId);
    expect(carrito!.items).toHaveLength(1);
    expect(carrito!.items[0].precioUnitario).toBe(50.0);
  });

  it("CheckoutService: checkout solo transporte tiene envio = 0", async () => {
    const fechaFutura = new Date(fechaHoy());
    fechaFutura.setUTCDate(fechaFutura.getUTCDate() + 1);

    await cartService.anadirItem(usuarioId, {
      servicioId: servicioTransporteNacional.id,
      metadata: {
        origen: "La Habana",
        destino: "Santiago",
        fecha: fechaFutura.toISOString(),
        peso: 10,
      },
    });

    const preparado = await checkoutService.prepararCheckout(usuarioId);

    expect(preparado.grupos).toHaveLength(1);
    expect(preparado.grupos[0].tieneTransporte).toBe(true);
    expect(preparado.totales.envio).toBe(0);
    expect(preparado.totales.total).toBeGreaterThan(0);
  });

  it("CheckoutService: confirmar checkout solo transporte no requiere logistica", async () => {
    const fechaFutura = new Date(fechaHoy());
    fechaFutura.setUTCDate(fechaFutura.getUTCDate() + 1);

    await cartService.anadirItem(usuarioId, {
      servicioId: servicioTransporteNacional.id,
      metadata: {
        origen: "La Habana",
        destino: "Santiago",
        fecha: fechaFutura.toISOString(),
      },
    });

    const preparado = await checkoutService.prepararCheckout(usuarioId);

    const result = await checkoutService.confirmarCheckout(usuarioId, {
      checkoutToken: preparado.checkoutToken,
      grupos: [
        {
          negocioId: preparado.grupos[0].negocioId,
          tipoEntrega: "RECOGIDA_TIENDA",
        },
      ],
      metodoPago: "EFECTIVO_CONTRA_ENTREGA",
    });

    expect(result.pedidosCreados).toHaveLength(1);
    expect(result.pedidosCreados[0].estado).toBe("pendiente");
    expect(result.totalGeneral).toBe(preparado.grupos[0].totalConIVA);
  });

  it("CatalogService: crear servicio de transporte con tipo y tipoTransporte", async () => {
    const result = await catalogService.crearServicio(
      negocioId,
      {
        nombre: "Transporte Express",
        descripcion: "Servicio de transporte exprés",
        duracionMinutos: 45,
        capacidad: 1,
        precio: 30,
        horariosDisponibles: {},
        subareaId,
        activo: true,
        tipo: "TRANSPORTE",
        tipoTransporte: "ENVIO_PAQUETE",
        alcanceNacional: true,
        imagenUrl: "https://example.com/transporte-express.jpg",
      },
      usuarioId,
      Rol.ADMIN
    );

    expect(result.tipo).toBe("TRANSPORTE");
    expect(result.tipoTransporte).toBe("ENVIO_PAQUETE");
    expect(result.capacidad).toBe(1);
    expect(Number(result.precio)).toBe(30);
  });

  it("CatalogService: servicio TRANSPORTE sin tipoTransporte lanza error", async () => {
    await expect(
      catalogService.crearServicio(
        negocioId,
        {
          nombre: "Transporte Sin Tipo",
          descripcion: "Servicio sin tipo de transporte",
          duracionMinutos: 45,
          capacidad: 1,
          precio: 10,
          horariosDisponibles: {},
          subareaId,
          activo: true,
          tipo: "TRANSPORTE",
          imagenUrl: "https://example.com/no-tipo.jpg",
        },
        usuarioId,
        Rol.ADMIN
      )
    ).rejects.toThrow(BusinessError);
  });

  it("CatalogService: actualizar servicio a transporte", async () => {
    const servicioExistente = testData.servicio;

    const result = await catalogService.actualizarServicio(
      servicioExistente.id,
      {
        tipo: "TRANSPORTE",
        tipoTransporte: "TRASLADO_MUEBLE",
        precio: 40,
        capacidad: 1,
      },
      usuarioId,
      Rol.ADMIN
    );

    expect(result.tipo).toBe("TRANSPORTE");
    expect(result.tipoTransporte).toBe("TRASLADO_MUEBLE");
    expect(Number(result.precio)).toBe(40);
    expect(result.capacidad).toBe(1);
  });
});
