import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import { PagoService } from "@/services/PagoService";
import { CartService } from "@/services/CartService";
import { CheckoutService } from "@/services/CheckoutService";
import { resetCache } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import {
  CODIGO_INTENTOS_MAXIMOS,
  CODIGO_REGENERACIONES_MAXIMAS,
  CODIGO_ERROR_INCORRECTO,
  CODIGO_ERROR_EXPIRADO,
  CODIGO_ERROR_BLOQUEADO,
  CODIGO_ERROR_LIMITE_REGENERACIONES,
  CODIGO_ERROR_METODO_INCORRECTO,
  CODIGO_ERROR_MOTIVO_REQUERIDO,
  CODIGO_LONGITUD,
  HORA_CORTE_DISPONIBILIDAD,
} from "@/core/constants";
import { Rol } from "@/generated/prisma/client";
import type { MetodoPago } from "@/generated/prisma/client";

const pagosService = new PagoService();
const cartService = new CartService();
const checkoutService = new CheckoutService();

describe("PagoService - Códigos de entrega EFECTIVO_CONTRA_ENTREGA", () => {
  let testData: Awaited<ReturnType<typeof setupTestData>>;
  let negocioId: string;
  let usuarioId: string;
  let negocioOwnerId: string;
  let productoId: string;
  let opcionLogisticaId: string;
  let pedidoId: string;

  beforeAll(async () => {
    const mockNow = new Date();
    mockNow.setHours(HORA_CORTE_DISPONIBILIDAD - 3, 0, 0, 0);
    vi.useFakeTimers({ now: mockNow });

    testData = await setupTestData();
    negocioId = testData.negocio.id;
    usuarioId = testData.usuario.id;
    productoId = testData.producto.id;

    // Crear ADMIN de prueba
    await prisma.user.create({
      data: {
        email: "admin@codigotest.com",
        password: "password123",
        nombre: "Admin Codigo",
        rol: Rol.ADMIN,
      },
    });

    // Crear usuario negocio (dueño del negocio)
    const negocioUser = await prisma.user.create({
      data: {
        email: "negocio@codigotest.com",
        password: "password123",
        nombre: "Negocio Test",
        rol: Rol.NEGOCIO,
      },
    });
    await prisma.negocio.update({
      where: { id: negocioId },
      data: { userId: negocioUser.id },
    });
    negocioOwnerId = negocioUser.id;

    // Crear opción logística
    const proveedorLog = await prisma.user.create({
      data: {
        email: "logistica@codigotest.com",
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
        contacto: "contacto@codigotest.com",
        activo: true,
      },
    });
    const op = await prisma.opcionLogistica.create({
      data: {
        negocioId,
        proveedorId: proveedor.id,
        nombre: "Envío Express",
        tipo: "EXPRESS",
        tarifaBase: 5.99,
        tarifaPorDistancia: 0.5,
        tiempoEstimado: "24-48h",
      },
    });
    opcionLogisticaId = op.id;
  });

  afterAll(async () => {
    vi.useRealTimers();
    await cleanupTestData();
  });

  beforeEach(async () => {
    await resetCache();
    await cartService.vaciarCarrito(usuarioId);
    await prisma.pago.deleteMany({});
    await prisma.pedido.deleteMany({});
  });

  async function crearPedidoConPagoEfectivo(): Promise<{ pedidoId: string; pagoId: string }> {
    await cartService.anadirItem(usuarioId, { productoId, cantidad: 1 });
    const preparado = await checkoutService.prepararCheckout(usuarioId, {});
    const result = await checkoutService.confirmarCheckout(usuarioId, {
      checkoutToken: preparado.checkoutToken,
      metodoPago: "EFECTIVO_CONTRA_ENTREGA",
      grupos: [{ negocioId, tipoEntrega: "RECOGIDA_TIENDA" }],
    });
    const pedidoIdResult = result.pedidosCreados[0].id;
    const pago = await prisma.pago.findUniqueOrThrow({ where: { pedidoId: pedidoIdResult } });
    return { pedidoId: pedidoIdResult, pagoId: pago.id };
  }

  async function resetearCodigoBloqueo(pagoId: string) {
    await prisma.pago.update({
      where: { id: pagoId },
      data: {
        codigoEntregaBloqueado: false,
        codigoEntregaIntentos: 0,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // 1. Checkout con EFECTIVO_CONTRA_ENTREGA genera código automáticamente
  // ---------------------------------------------------------------------------
  it("confirmarCheckout con EFECTIVO_CONTRA_ENTREGA genera código de entrega", async () => {
    await cartService.anadirItem(usuarioId, { productoId, cantidad: 1 });
    const preparado = await checkoutService.prepararCheckout(usuarioId, {});
    const result = await checkoutService.confirmarCheckout(usuarioId, {
      checkoutToken: preparado.checkoutToken,
      metodoPago: "EFECTIVO_CONTRA_ENTREGA",
      grupos: [{ negocioId, tipoEntrega: "RECOGIDA_TIENDA" }],
    });

    expect(result.pedidosCreados).toHaveLength(1);
    expect(result.pedidosCreados[0].codigoEntrega).toBeDefined();
    expect(result.pedidosCreados[0].codigoEntrega.length).toBe(CODIGO_LONGITUD);
    expect(result.pedidosCreados[0].codigoEntrega).toMatch(/^\d{6}$/);

    const pago = await prisma.pago.findUniqueOrThrow({
      where: { pedidoId: result.pedidosCreados[0].id },
      select: {
        codigoEntregaHash: true,
        codigoEntregaExpira: true,
        codigoEntregaIntentos: true,
        codigoEntregaRegeneraciones: true,
        codigoEntregaBloqueado: true,
      },
    });
    expect(pago.codigoEntregaHash).toBeDefined();
    expect(pago.codigoEntregaHash).not.toBeNull();
    expect(pago.codigoEntregaExpira).toBeInstanceOf(Date);
    expect(pago.codigoEntregaBloqueado).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // 2. El code no se devuelve para ADMIN
  // ---------------------------------------------------------------------------
  it("El código de entrega se filtra para ADMIN (solo CLIENTE lo ve)", async () => {
    // El CheckoutService devuelve el code, pero el server action filtra para ADMIN
    // Aquí testeamos que el servicio devuelve el code
    const { pagoId } = await crearPedidoConPagoEfectivo();
    const codigo = await pagosService.getCodigoEntregaCache(pagoId, usuarioId, Rol.CLIENTE);
    expect(codigo).not.toBeNull();
    expect(codigo!.length).toBe(CODIGO_LONGITUD);

    // Un negocio NO puede obtener el código plano
    await expect(
      pagosService.getCodigoEntregaCache(pagoId, negocioOwnerId)
    ).rejects.toThrow(BusinessError);

    try {
      await pagosService.getCodigoEntregaCache(pagoId, negocioOwnerId);
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe("NO_AUTORIZADO");
      } else {
        throw err;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 3. getCodigoEntregaCache retorna null si no hay código
  // ---------------------------------------------------------------------------
  it("getCodigoEntregaCache retorna null si no hay código de entrega", async () => {
    const { pagoId } = await crearPedidoConPagoEfectivo();

    // Limpiar el código del pago
    await prisma.pago.update({
      where: { id: pagoId },
      data: { codigoEntregaHash: null },
    });

    const codigo = await pagosService.getCodigoEntregaCache(pagoId, usuarioId, Rol.CLIENTE);
    expect(codigo).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // 4. generarCodigoEntrega regenera el código manualmente
  // ---------------------------------------------------------------------------
  it("generarCodigoEntrega genera un nuevo código válido", async () => {
    const { pagoId } = await crearPedidoConPagoEfectivo();

    const codigo = await pagosService.generarCodigoEntrega(pagoId, usuarioId, Rol.CLIENTE);
    expect(codigo).toHaveLength(CODIGO_LONGITUD);
    expect(codigo).toMatch(/^\d{6}$/);

    // El código debe estar en cache
    const cached = await pagosService.getCodigoEntregaCache(pagoId, usuarioId, Rol.CLIENTE);
    expect(cached).toBe(codigo);

    // El hash debe estar actualizado en DB
    const pago = await prisma.pago.findUniqueOrThrow({
      where: { id: pagoId },
      select: { codigoEntregaHash: true, codigoEntregaRegeneraciones: true, codigoEntregaIntentos: true },
    });
    expect(pago.codigoEntregaHash).not.toBeNull();
    expect(pago.codigoEntregaRegeneraciones).toBe(0);
    expect(pago.codigoEntregaIntentos).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 5. validarCodigoEntrega acepta código correcto
  // ---------------------------------------------------------------------------
  it("validarCodigoEntrega acepta código correcto", async () => {
    const { pagoId } = await crearPedidoConPagoEfectivo();
    const codigo = await pagosService.getCodigoEntregaCache(pagoId, usuarioId, Rol.CLIENTE);

    const valido = await pagosService.validarCodigoEntrega(pagoId, codigo!, negocioOwnerId, Rol.NEGOCIO);
    expect(valido).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // 6. validarCodigoEntrega rechaza código incorrecto
  // ---------------------------------------------------------------------------
  it("validarCodigoEntrega rechaza código incorrecto", async () => {
    const { pagoId } = await crearPedidoConPagoEfectivo();
    const codigo = await pagosService.getCodigoEntregaCache(pagoId, usuarioId, Rol.CLIENTE);

    // Código incorrecto
    const codigoFalso = codigo!.split("").reverse().join("");
    if (codigoFalso === codigo) {
      // Asegurar que es diferente
      await expect(
        pagosService.validarCodigoEntrega(pagoId, "000000", negocioOwnerId, Rol.NEGOCIO)
      ).rejects.toThrow(BusinessError);
    } else {
      await expect(
        pagosService.validarCodigoEntrega(pagoId, codigoFalso!, negocioOwnerId, Rol.NEGOCIO)
      ).rejects.toThrow(BusinessError);
    }

    try {
      await pagosService.validarCodigoEntrega(pagoId, "000000", negocioOwnerId, Rol.NEGOCIO);
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_ERROR_INCORRECTO);
        expect(err.status).toBe(400);
      } else {
        throw err;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 7. validarCodigoEntrega bloquea después de intentos fallidos
  // ---------------------------------------------------------------------------
  it("validarCodigoEntrega bloquea después de intentos fallidos", async () => {
    const { pagoId } = await crearPedidoConPagoEfectivo();

    // Fallar hasta el máximo
    for (let i = 0; i < CODIGO_INTENTOS_MAXIMOS; i++) {
      try {
        await pagosService.validarCodigoEntrega(pagoId, "000000", negocioOwnerId, Rol.NEGOCIO);
        throw new Error("debería haber fallado");
      } catch (err) {
        if (err instanceof BusinessError) {
          expect(err.code).toBe(CODIGO_ERROR_INCORRECTO);
        }
      }
    }

    // Verificar que está bloqueado
    const pago = await prisma.pago.findUniqueOrThrow({
      where: { id: pagoId },
      select: { codigoEntregaBloqueado: true, codigoEntregaIntentos: true },
    });
    expect(pago.codigoEntregaBloqueado).toBe(true);
    expect(pago.codigoEntregaIntentos).toBe(CODIGO_INTENTOS_MAXIMOS);

    // Intentar validar de nuevo → debe estar bloqueado
    try {
      await pagosService.validarCodigoEntrega(pagoId, "000000", negocioOwnerId, Rol.NEGOCIO);
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_ERROR_BLOQUEADO);
        expect(err.status).toBe(423);
      } else {
        throw err;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 8. validarCodigoEntrega rechaza código expirado
  // ---------------------------------------------------------------------------
  it("validarCodigoEntrega rechaza código expirado", async () => {
    const { pagoId } = await crearPedidoConPagoEfectivo();
    const codigo = await pagosService.getCodigoEntregaCache(pagoId, usuarioId, Rol.CLIENTE);

    // Expirar el código
    await prisma.pago.update({
      where: { id: pagoId },
      data: { codigoEntregaExpira: new Date(Date.now() - 1000) },
    });

    try {
      await pagosService.validarCodigoEntrega(pagoId, codigo!, negocioOwnerId, Rol.NEGOCIO);
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_ERROR_EXPIRADO);
        expect(err.status).toBe(410);
      } else {
        throw err;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 9. confirmarConCodigoEntrega confirma el pago con código válido
  // ---------------------------------------------------------------------------
  it("confirmarConCodigoEntrega confirma pago con código válido", async () => {
    const { pagoId } = await crearPedidoConPagoEfectivo();
    const codigo = await pagosService.getCodigoEntregaCache(pagoId, usuarioId, Rol.CLIENTE);

    const confirmado = await pagosService.confirmarConCodigoEntrega(
      pagoId,
      codigo!,
      negocioOwnerId,
      Rol.NEGOCIO
    );

    expect(confirmado.estado).toBe("COMPLETADO");
    expect(confirmado.confirmadoPorId).toBe(negocioOwnerId);
    expect(confirmado.confirmadoEn).not.toBeNull();
    expect(confirmado.codigoEntregaUsadoEn).not.toBeNull();

    const pedido = await prisma.pedido.findUniqueOrThrow({
      where: { id: confirmado.pedidoId },
      select: { estadoPago: true },
    });
    expect(pedido.estadoPago).toBe("COMPLETADO");
  });

  // ---------------------------------------------------------------------------
  // 10. confirmarConCodigoEntrega falla con código incorrecto
  // ---------------------------------------------------------------------------
  it("confirmarConCodigoEntrega falla con código incorrecto", async () => {
    const { pagoId } = await crearPedidoConPagoEfectivo();

    await expect(
      pagosService.confirmarConCodigoEntrega(pagoId, "000000", negocioOwnerId, Rol.NEGOCIO)
    ).rejects.toThrow(BusinessError);

    try {
      await pagosService.confirmarConCodigoEntrega(pagoId, "000000", negocioOwnerId, Rol.NEGOCIO);
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_ERROR_INCORRECTO);
      } else {
        throw err;
      }
    }

    // El pago no debe estar COMPLETADO
    const pago = await prisma.pago.findUniqueOrThrow({ where: { id: pagoId } });
    expect(pago.estado).toBe("PENDIENTE");
  });

  // ---------------------------------------------------------------------------
  // 11. regenerarCodigoEntrega respeta límite de regeneraciones
  // ---------------------------------------------------------------------------
  it(`regenerarCodigoEntrega limita a ${CODIGO_REGENERACIONES_MAXIMAS} regeneraciones`, async () => {
    const { pagoId } = await crearPedidoConPagoEfectivo();
    const motivo = "El cliente no recibió el código por WhatsApp";

    // Regenerar hasta el límite
    for (let i = 0; i < CODIGO_REGENERACIONES_MAXIMAS; i++) {
      const codigo = await pagosService.regenerarCodigoEntrega(pagoId, usuarioId, motivo, Rol.CLIENTE);
      expect(codigo).toHaveLength(CODIGO_LONGITUD);
    }

    // Verificar contador
    const pago = await prisma.pago.findUniqueOrThrow({
      where: { id: pagoId },
      select: { codigoEntregaRegeneraciones: true },
    });
    expect(pago.codigoEntregaRegeneraciones).toBe(CODIGO_REGENERACIONES_MAXIMAS);

    // Intentar regenerar más → debe fallar
    try {
      await pagosService.regenerarCodigoEntrega(pagoId, usuarioId, motivo, Rol.CLIENTE);
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_ERROR_LIMITE_REGENERACIONES);
        expect(err.status).toBe(429);
      } else {
        throw err;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 12. regenerarCodigoEntrega requiere motivo mínimo
  // ---------------------------------------------------------------------------
  it("regenerarCodigoEntrega requiere motivo con caracteres mínimos", async () => {
    const { pagoId } = await crearPedidoConPagoEfectivo();

    try {
      await pagosService.regenerarCodigoEntrega(pagoId, usuarioId, "corto", Rol.CLIENTE);
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_ERROR_MOTIVO_REQUERIDO);
      } else {
        throw err;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 13. generarCodigoEntrega falla para método distinto a EFECTIVO_CONTRA_ENTREGA
  // ---------------------------------------------------------------------------
  it("generarCodigoEntrega falla para método no EFECTIVO_CONTRA_ENTREGA", async () => {
    await cartService.vaciarCarrito(usuarioId);
    await cartService.anadirItem(usuarioId, { productoId, cantidad: 1 });
    const preparado = await checkoutService.prepararCheckout(usuarioId, {});
    const result = await checkoutService.confirmarCheckout(usuarioId, {
      checkoutToken: preparado.checkoutToken,
      metodoPago: "TRANSFERENCIA_BANCARIA",
      datosPago: { referencia: "REF-TEST" },
      grupos: [{ negocioId, tipoEntrega: "RECOGIDA_TIENDA" }],
    });

    const pago = await prisma.pago.findUniqueOrThrow({
      where: { pedidoId: result.pedidosCreados[0].id },
    });

    try {
      await pagosService.generarCodigoEntrega(pago.id, usuarioId, Rol.CLIENTE);
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_ERROR_METODO_INCORRECTO);
      } else {
        throw err;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 14. regenerarCodigoEntrega desbloquea intentos anteriores
  // ---------------------------------------------------------------------------
  it("regenerarCodigoEntrega desbloquea código previamente bloqueado", async () => {
    const { pagoId } = await crearPedidoConPagoEfectivo();

    // Bloquear el código
    await prisma.pago.update({
      where: { id: pagoId },
      data: { codigoEntregaBloqueado: true, codigoEntregaIntentos: CODIGO_INTENTOS_MAXIMOS },
    });

    // Regenerar debe desbloquear
    const codigo = await pagosService.regenerarCodigoEntrega(
      pagoId,
      usuarioId,
      "Cliente solicitó regeneración por código bloqueado",
      Rol.CLIENTE
    );

    const pago = await prisma.pago.findUniqueOrThrow({
      where: { id: pagoId },
      select: { codigoEntregaBloqueado: true, codigoEntregaIntentos: true },
    });
    expect(pago.codigoEntregaBloqueado).toBe(false);
    expect(pago.codigoEntregaIntentos).toBe(0);

    // El nuevo código debe ser válido
    await pagosService.confirmarConCodigoEntrega(
      pagoId,
      codigo,
      negocioOwnerId,
      Rol.NEGOCIO
    );
  });

  // ---------------------------------------------------------------------------
  // 15. confirmarPago (sin código) sigue funcionando para métodos no efectivo
  // ---------------------------------------------------------------------------
  it("confirmarPago funciona para TRANSFERENCIA_BANCARIA (sin código)", async () => {
    await cartService.anadirItem(usuarioId, { productoId, cantidad: 1 });
    const preparado = await checkoutService.prepararCheckout(usuarioId, {});
    const result = await checkoutService.confirmarCheckout(usuarioId, {
      checkoutToken: preparado.checkoutToken,
      metodoPago: "TRANSFERENCIA_BANCARIA",
      datosPago: { referencia: "REF-9999" },
      grupos: [{ negocioId, tipoEntrega: "RECOGIDA_TIENDA" }],
    });

    const pago = await prisma.pago.findUniqueOrThrow({
      where: { pedidoId: result.pedidosCreados[0].id },
    });

    const admin = await prisma.user.findFirst({ where: { rol: "ADMIN" } });
    const confirmado = await pagosService.confirmarPago(pago.id, admin!.id, undefined, Rol.ADMIN);

    expect(confirmado.estado).toBe("COMPLETADO");
    expect(confirmado.codigoEntregaHash).toBeNull();
  });
});
