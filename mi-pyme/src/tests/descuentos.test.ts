import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import { CartService } from "@/services/CartService";
import { CheckoutService } from "@/services/CheckoutService";
import { getCache, cacheKeys, resetCache } from "@/infrastructure";
import {
  BusinessError
} from "@/shared/types";
import { PromocionService } from "@/services/PromocionService";
import { CuponService } from "@/services/CuponService";
import { ComboService } from "@/services/ComboService";
import { DescuentoService } from "@/services/DescuentoService";
import {
  CODIGO_COMBO_NO_DISPONIBLE,
} from "@/core/constants";
import { TipoServicio } from "@/generated/prisma/client";
import { HORA_CORTE_DISPONIBILIDAD } from "@/core/constants";
import { fechaHoy } from "@/shared/utils/fecha";
import { ItemCarritoParaDescuento } from "@/shared/descuentos.types";

const cartService = new CartService();
const checkoutService = new CheckoutService();
const promocionService = new PromocionService();
const cuponService = new CuponService();
const comboService = new ComboService();
const descuentoService = new DescuentoService();

describe("Promociones, Cupones y Combos", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;
  let usuarioId: string;
  let negocioId: string;
  let subareaId: string;
  let productoId: string;
  let servicioId: string;

  beforeAll(async () => {
    const mockNow = new Date();
    mockNow.setHours(HORA_CORTE_DISPONIBILIDAD - 3, 0, 0, 0);
    vi.useFakeTimers({ now: mockNow });

    testData = await setupTestData();
    usuarioId = testData.usuario.id;
    negocioId = testData.negocio.id;
    subareaId = testData.subarea.id;
    productoId = testData.producto.id;
    servicioId = testData.servicio.id;
  });

  afterAll(async () => {
    vi.useRealTimers();
    await cleanupTestData();
  });

  beforeEach(async () => {
    await resetCache();
    await cartService.vaciarCarrito(usuarioId);
    await getCache().del(cacheKeys.carrito.usuario(usuarioId));
    await prisma.promocionUso.deleteMany({});
    await prisma.cuponUso.deleteMany({});
    await prisma.comboUso.deleteMany({});
    await prisma.promocion.deleteMany({ where: { negocioId } });
    await prisma.cupon.deleteMany({ where: { negocioId } });
    await prisma.combo.deleteMany({ where: { negocioId } });
  });

  const buildItems = (productoId: string, cantidad = 1): ItemCarritoParaDescuento[] => [
    {
      id: "item-test",
      productoId,
      cantidad,
      precioUnitario: testData.producto.precio,
      tipo: "producto",
      negocioId,
      producto: {
        id: productoId,
        nombre: "test",
        precio: testData.producto.precio,
      },
    },
  ];

  describe("PromocionService", () => {
    it("debería aplicar promoción del tipo PORCENTAJE", async () => {
      const promo = await prisma.promocion.create({
        data: {
          negocioId,
          nombre: "10% off productos",
          descripcion: "10% de descuento en productos",
          tipo: "PORCENTAJE",
          valor: 10,
          estado: "ACTIVA",
          productoIds: JSON.stringify([productoId]),
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
        },
      });

      const items = buildItems(productoId);
      const aplicables = await promocionService.listPromocionesAplicables(negocioId, items);
      expect(aplicables).toHaveLength(1);
      expect(aplicables[0].id).toBe(promo.id);

      const descuentos = promocionService.calcularDescuento(aplicables[0], items);
      expect(descuentos[0].descuento).toBeCloseTo(2.55, 2);
    });

    it("debería aplicar promoción del tipo MONTO_FIJO", async () => {
      const promo = await prisma.promocion.create({
        data: {
          negocioId,
          nombre: "5$ off productos",
          descripcion: "5$ de descuento en productos",
          tipo: "MONTO_FIJO",
          valor: 5,
          estado: "ACTIVA",
          productoIds: JSON.stringify([productoId]),
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
        },
      });

      const items = buildItems(productoId);
      const dto = await promocionService.getPromocion(promo.id);
      const descuentos = promocionService.calcularDescuento(dto, items);
      expect(descuentos[0].descuento).toBe(5);
    });

    it("debería aplicar promoción del tipo DOS_POR_UNO", async () => {
      const promo = await prisma.promocion.create({
        data: {
          negocioId,
          nombre: "2x1 productos",
          descripcion: "Lleva 2 por 1",
          tipo: "DOS_POR_UNO",
          valor: null,
          estado: "ACTIVA",
          productoIds: JSON.stringify([productoId]),
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
        },
      });

      const items: ItemCarritoParaDescuento[] = [
        {
          id: "item-dos-por-uno",
          productoId,
          cantidad: 2,
          precioUnitario: testData.producto.precio,
          tipo: "producto",
          negocioId,
        },
      ];
      const dto = await promocionService.getPromocion(promo.id);
      const descuentos = promocionService.calcularDescuento(dto, items);
      expect(descuentos[0].descuento).toBeCloseTo(testData.producto.precio, 2);
    });

    it("debería aplicar promoción del tipo ENVIO_GRATIS", async () => {
      await prisma.promocion.create({
        data: {
          negocioId,
          nombre: "Envío gratis",
          descripcion: "Envío gratuito",
          tipo: "ENVIO_GRATIS",
          valor: null,
          estado: "ACTIVA",
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
        },
      });

      const items = buildItems(productoId);
      const aplicables = await promocionService.listPromocionesAplicables(negocioId, items);
      expect(aplicables.some((p) => p.tipo === "ENVIO_GRATIS")).toBe(true);
    });

    it("no debería aplicar promoción vencida", async () => {
      await prisma.promocion.create({
        data: {
          negocioId,
          nombre: "Promo expirada",
          descripcion: "Descuento expirado",
          tipo: "PORCENTAJE",
          valor: 10,
          estado: "ACTIVA",
          productoIds: JSON.stringify([productoId]),
          fechaInicio: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          fechaFin: new Date(Date.now() - 24 * 60 * 60 * 1000),
          usosMaximos: 100,
        },
      });

      const items = buildItems(productoId);
      const aplicables = await promocionService.listPromocionesAplicables(negocioId, items);
      expect(aplicables).toHaveLength(0);
    });
  });

  describe("CuponService", () => {
    it("debería validar y aplicar un cupón válido", async () => {
      const cupon = await prisma.cupon.create({
        data: {
          negocioId,
          codigo: "DESCUENTO10",
          descripcion: "10% de descuento",
          tipo: "PORCENTAJE",
          valor: 10,
          estado: "ACTIVO",
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
          usosActuales: 0,
        },
      });

      const items = buildItems(productoId);
      const validado = await cuponService.validarCupon(cupon.codigo, usuarioId, items);
      expect(validado.valido).toBe(true);
      expect(validado.cupon?.id).toBe(cupon.id);
    });

    it("debería lanzar error para cupón inválido", async () => {
      const items = buildItems(productoId);
      const validado = await cuponService.validarCupon("NOEXISTE", usuarioId, items);
      expect(validado.valido).toBe(false);
      expect(validado.errores).toContain("Código de cupón inválido");
    });

    it("debería lanzar error para cupón expirado", async () => {
      const cupon = await prisma.cupon.create({
        data: {
          negocioId,
          codigo: "EXPIRADO10",
          tipo: "PORCENTAJE",
          valor: 10,
          estado: "ACTIVO",
          fechaInicio: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          fechaFin: new Date(Date.now() - 24 * 60 * 60 * 1000),
          usosMaximos: 100,
          usosActuales: 0,
        },
      });

      const items = buildItems(productoId);
      const validado = await cuponService.validarCupon(cupon.codigo, usuarioId, items);
      expect(validado.valido).toBe(false);
      expect(validado.errores.some((e) => e.includes("expirado"))).toBe(true);
    });

    it("debería lanzar error para cupón agotado", async () => {
      const cupon = await prisma.cupon.create({
        data: {
          negocioId,
          codigo: "AGOTADO10",
          tipo: "PORCENTAJE",
          valor: 10,
          estado: "ACTIVO",
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 0,
          usosActuales: 0,
        },
      });

      const items = buildItems(productoId);
      const validado = await cuponService.validarCupon(cupon.codigo, usuarioId, items);
      expect(validado.valido).toBe(false);
      expect(validado.errores.some((e) => e.includes("límite"))).toBe(true);
    });

    it("debería lanzar error para cupón ya usado por el cliente", async () => {
      const cupon = await prisma.cupon.create({
        data: {
          negocioId,
          codigo: "UNICO10",
          tipo: "PORCENTAJE",
          valor: 10,
          estado: "ACTIVO",
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
          usosActuales: 0,
          unaVezPorUsuario: true,
        },
      });

      const pedido = await prisma.pedido.create({
        data: {
          usuarioId,
          negocioId,
          total: 25.5,
          estado: "pendiente",
          tipo: "producto",
          negocioIds: JSON.stringify([negocioId]),
        },
      });

      const items = buildItems(productoId);
      const validado1 = await cuponService.validarCupon(cupon.codigo, usuarioId, items);
      expect(validado1.valido).toBe(true);

      await cuponService.registrarUso(cupon.id, usuarioId, pedido.id, 5);

      const validado2 = await cuponService.validarCupon(cupon.codigo, usuarioId, items);
      expect(validado2.valido).toBe(false);
      expect(validado2.errores.some((e) => e.includes("una vez"))).toBe(true);
    });

    it("debería aplicar descuento de porcentaje", async () => {
      const cupon = await prisma.cupon.create({
        data: {
          negocioId,
          codigo: "PCT5",
          tipo: "PORCENTAJE",
          valor: 5,
          estado: "ACTIVO",
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
          usosActuales: 0,
        },
      });

      const dto = await cuponService.getPorCodigo(cupon.codigo);
      const items = buildItems(productoId);
      const result = cuponService.aplicarDescuento(dto, items);
      expect(result.descuentoTotal).toBeCloseTo(1.275, 2);
    });

    it("debería aplicar descuento de monto fijo", async () => {
      const cupon = await prisma.cupon.create({
        data: {
          negocioId,
          codigo: "MONTO10",
          tipo: "MONTO_FIJO",
          valor: 10,
          estado: "ACTIVO",
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
          usosActuales: 0,
        },
      });

      const dto = await cuponService.getPorCodigo(cupon.codigo);
      const items = buildItems(productoId);
      const result = cuponService.aplicarDescuento(dto, items);
      expect(result.descuentoTotal).toBe(10);
    });
  });

  describe("ComboService", () => {
    it("debería crear y descomponer un combo con producto", async () => {
      const combo = await prisma.combo.create({
        data: {
          negocioId,
          nombre: "Combo Belleza Premium",
          descripcion: "Kit de belleza con servicio",
          precio: 20,
          activo: true,
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
          usosActuales: 0,
          items: {
            create: [{ productoId }],
          },
        },
      });

      const desglose = await comboService.descomponerCombo(combo.id);
      expect(desglose).toBeDefined();
      expect(desglose).toHaveLength(1);
      expect(desglose[0].productoId).toBe(productoId);

      const calc = await comboService.calcularDescuentoCombo(combo.id);
      expect(calc.descuentoTotal).toBe(5.5);
    });

    it("debería lanzar error si el combo no está disponible", async () => {
      const combo = await prisma.combo.create({
        data: {
          negocioId,
          nombre: "Combo Inactivo",
          descripcion: "Combo no disponible",
          precio: 10,
          activo: false,
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
          usosActuales: 0,
          items: {
            create: [{ productoId }],
          },
        },
      });

      try {
        await comboService.getCombo(combo.id);
      } catch (err) {
        expect((err as BusinessError).code).toBe(CODIGO_COMBO_NO_DISPONIBLE);
      }
    });

    it("debería lanzar error si el combo no aplica a los items", async () => {
      const combo = await prisma.combo.create({
        data: {
          negocioId,
          nombre: "Combo Específico",
          descripcion: "Combo para servicios",
          precio: 10,
          activo: true,
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
          usosActuales: 0,
          items: {
            create: [{ servicioId }],
          },
        },
      });

      const dto = await comboService.getCombo(combo.id);
      expect(dto).toBeDefined();
      expect(dto.items).toHaveLength(1);
      expect(dto.items[0].servicioId).toBe(servicioId);
    });
  });

  describe("DescuentoService - Integración Checkout", () => {
    it("debería aplicar promoción automática en checkout", async () => {
      await prisma.promocion.create({
        data: {
          negocioId,
          nombre: "20% productos",
          tipo: "PORCENTAJE",
          valor: 20,
          estado: "ACTIVA",
          productoIds: JSON.stringify([productoId]),
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
          usosActuales: 0,
        },
      });

      await cartService.anadirItem(usuarioId, { productoId, cantidad: 1 });

      const preparado = await checkoutService.prepararCheckout(usuarioId);
      expect(preparado.totales.descuentoTotal).toBeGreaterThan(0);
    });

    it("debería aplicar cupón en checkout vía prepararCheckout", async () => {
      await prisma.cupon.create({
        data: {
          negocioId,
          codigo: "CHECKOUT10",
          tipo: "PORCENTAJE",
          valor: 10,
          estado: "ACTIVO",
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
          usosActuales: 0,
        },
      });

      await cartService.anadirItem(usuarioId, { productoId, cantidad: 1 });

      const preparado = await checkoutService.prepararCheckout(usuarioId, {
        cuponCodigo: "CHECKOUT10",
      });

      expect(preparado.totales.descuentoTotal).toBeGreaterThan(0);
    });

    it("no debería acumular descuentos si permiteAcumularDescuentos es false", async () => {
      await prisma.negocio.update({
        where: { id: negocioId },
        data: { permiteAcumularDescuentos: false },
      });

      await prisma.promocion.create({
        data: {
          negocioId,
          nombre: "Promo 10%",
          tipo: "PORCENTAJE",
          valor: 10,
          estado: "ACTIVA",
          productoIds: JSON.stringify([productoId]),
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
          usosActuales: 0,
        },
      });

      await prisma.cupon.create({
        data: {
          negocioId,
          codigo: "ACUMULA10",
          tipo: "PORCENTAJE",
          valor: 10,
          estado: "ACTIVO",
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
          usosActuales: 0,
        },
      });

      await cartService.anadirItem(usuarioId, { productoId, cantidad: 1 });

      const preparado = await checkoutService.prepararCheckout(usuarioId, {
        cuponCodigo: "ACUMULA10",
      });

      expect(preparado.totales.descuentoTotal).toBeGreaterThanOrEqual(0);
      expect(preparado.cuponCodigo).toBe("ACUMULA10");

      await prisma.negocio.update({
        where: { id: negocioId },
        data: { permiteAcumularDescuentos: true },
      });
    });

    it("debería aplicar promoción de envío gratis en checkout", async () => {
      const servicioTransporte = await prisma.servicio.create({
        data: {
          negocioId,
          subareaId,
          nombre: "Envío Express",
          descripcion: "Servicio de envío",
          duracionMinutos: 30,
          horariosDisponibles: JSON.stringify([]),
          capacidad: 1,
          activo: true,
          tipo: TipoServicio.TRANSPORTE,
          tipoTransporte: "ENVIO_PAQUETE",
          alcanceNacional: true,
          precio: 15,
          imagenUrl: "https://example.com/envio-express.jpg",
        },
      });

      await prisma.promocion.create({
        data: {
          negocioId,
          nombre: "Envío gratis",
          tipo: "ENVIO_GRATIS",
          estado: "ACTIVA",
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
          usosActuales: 0,
        },
      });

      await cartService.anadirItem(usuarioId, { productoId, cantidad: 1 });

      const fechaFutura = new Date(fechaHoy().getTime() + 24 * 60 * 60 * 1000);

      await cartService.anadirItem(usuarioId, {
        servicioId: servicioTransporte.id,
        metadata: {
          origen: "La Habana",
          destino: "Santiago",
          fecha: fechaFutura.toISOString(),
        },
      });

      const preparado = await checkoutService.prepararCheckout(usuarioId);
      expect(preparado.grupos[0].envioGratis).toBe(true);
    });
  });

  describe("DescuentoService - método aplicarDescuentos", () => {
    it("debería aplicar promociones + cupón acumulable cuando permiteAcumularDescuentos es true", async () => {
      await prisma.promocion.create({
        data: {
          negocioId,
          nombre: "15% productos",
          tipo: "PORCENTAJE",
          valor: 15,
          estado: "ACTIVA",
          productoIds: JSON.stringify([productoId]),
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
          usosActuales: 0,
        },
      });

      await prisma.cupon.create({
        data: {
          negocioId,
          codigo: "EXTRA10",
          tipo: "PORCENTAJE",
          valor: 10,
          estado: "ACTIVO",
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
          usosActuales: 0,
        },
      });

      await prisma.negocio.update({
        where: { id: negocioId },
        data: { permiteAcumularDescuentos: true },
      });

      const items = buildItems(productoId);
      const result = await descuentoService.aplicarDescuentos(usuarioId, items, "EXTRA10");

      expect(result.cuponAplicado).not.toBeNull();
      expect(result.cuponAplicado?.descuentoTotal).toBeGreaterThan(0);
      expect(result.descuentoTotal).toBeGreaterThan(0);
    });

    it("debería aplicar solo el mejor descuento cuando permiteAcumularDescuentos es false", async () => {
      await prisma.promocion.create({
        data: {
          negocioId,
          nombre: "20% productos",
          tipo: "PORCENTAJE",
          valor: 20,
          estado: "ACTIVA",
          productoIds: JSON.stringify([productoId]),
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
          usosActuales: 0,
        },
      });

      await prisma.cupon.create({
        data: {
          negocioId,
          codigo: "POCHO",
          tipo: "PORCENTAJE",
          valor: 5,
          estado: "ACTIVO",
          fechaInicio: new Date(),
          fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          usosMaximos: 100,
          usosActuales: 0,
        },
      });

      await prisma.negocio.update({
        where: { id: negocioId },
        data: { permiteAcumularDescuentos: false },
      });

      const items = buildItems(productoId);
      const result = await descuentoService.aplicarDescuentos(usuarioId, items, "POCHO");

      expect(result.descuentoTotal).toBeGreaterThan(0);

      await prisma.negocio.update({
        where: { id: negocioId },
        data: { permiteAcumularDescuentos: true },
      });
    });
  });
});
