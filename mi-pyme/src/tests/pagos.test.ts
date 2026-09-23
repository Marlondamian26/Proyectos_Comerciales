import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma, setupTestData, cleanupTestData } from "./setup";
import { PagoService } from "@/services/PagoService";
import { CartService } from "@/services/CartService";
import { CheckoutService } from "@/services/CheckoutService";
import { resetCache } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import {
  CODIGO_PAGO_YA_EXISTE,
  CODIGO_ESTADO_INVALIDO,
  CODIGO_METODO_NO_DISPONIBLE,
  CODIGO_NO_AUTORIZADO,
  CODIGO_NO_ENCONTRADO,
  HORA_CORTE_DISPONIBILIDAD,
} from "@/core/constants";
import { Rol } from "@/generated/prisma/client";
import type { MetodoPago, EstadoPago } from "@/generated/prisma/client";

const pagosService = new PagoService();
const cartService = new CartService();
const checkoutService = new CheckoutService();

describe("PagoService", () => {
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
        email: "admin@pagotest.com",
        password: "password123",
        nombre: "Admin Pago",
        rol: Rol.ADMIN,
      },
    });

    // Asignar userId de negocio al admin del seed o crear un negocioOwnerId
    negocioOwnerId = testData.usuario.id;
    // El negocio creado en setup no tiene userId asignado. Asignémoselo al usuario.
    await prisma.negocio.update({
      where: { id: negocioId },
      data: { userId: negocioOwnerId },
    });

    // Crear una opcion logística para el negocio
    const proveedorLog = await prisma.user.create({
      data: {
        email: "logistica@pagotest.com",
        password: "password123",
        nombre: "Proveedor Test Pago",
        rol: Rol.LOGISTICA,
      },
    });

    const proveedor = await prisma.proveedorLogistico.create({
      data: {
        usuarioId: proveedorLog.id,
        nombre: "Envíos Express Pago",
        zonaCobertura: "Local",
        alcanceNacional: false,
        contacto: "contacto@pagotest.com",
        activo: true,
      },
    });

    const op = await prisma.opcionLogistica.create({
      data: {
        negocioId,
        proveedorId: proveedor.id,
        nombre: "Envío Express Pago",
        tipo: "EXPRESS",
        tarifaBase: 5.99,
        tarifaPorDistancia: 0.5,
        tiempoEstimado: "24-48h",
      },
    });
    opcionLogisticaId = op.id;

    // Crear un usuario negocio (dueño del negocio)
    const negocioUser = await prisma.user.create({
      data: {
        email: "negocio@pagotest.com",
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
  });

  afterAll(async () => {
    vi.useRealTimers();
    await cleanupTestData();
  });

  beforeEach(async () => {
    await resetCache();
    await cartService.vaciarCarrito(usuarioId);

    // Limpiar pagos creados durante tests
    await prisma.pago.deleteMany({});
    await prisma.pedido.deleteMany({});

    // Restaurar disponibilidad
    await prisma.disponibilidadProducto.updateMany({
      where: { productoId: productoId },
      data: { cantidad: 100 },
    });
    await prisma.inventario.updateMany({
      where: { productoId: productoId },
      data: { cantidadActual: 100 },
    });
  });

  async function crearPedidoDePrueba(metodoPago?: MetodoPago): Promise<string> {
    await cartService.anadirItem(usuarioId, {
      productoId,
      cantidad: 1,
    });

    const preparado = await checkoutService.prepararCheckout(usuarioId, {});

    const payload: {
      checkoutToken: string;
      fechaEntrega?: string;
      metodoPago?: MetodoPago;
      grupos: Array<{
        negocioId: string;
        tipoEntrega: "DOMICILIO" | "RECOGIDA_TIENDA";
        opcionLogisticaId?: string;
        direccionEntrega?: string;
        notas?: string;
      }>;
    } = {
      checkoutToken: preparado.checkoutToken,
      grupos: [
        {
          negocioId,
          tipoEntrega: "DOMICILIO",
          opcionLogisticaId,
          direccionEntrega: "Calle Test 123",
        },
      ],
    };

    if (metodoPago) {
      payload.metodoPago = metodoPago;
    }

    const result = await checkoutService.confirmarCheckout(usuarioId, payload);
    expect(result.pedidosCreados).toHaveLength(1);
    return result.pedidosCreados[0].id;
  }

  // ---------------------------------------------------------------------------
  // 1. crearPagoParaPedido crea pago PENDIENTE para efectivo
  // ---------------------------------------------------------------------------
  it("crearPagoParaPedido crea pago PENDIENTE para EFECTIVO_CONTRA_ENTREGA", async () => {
    pedidoId = await crearPedidoDePrueba();

    const pago = await pagosService.crearPagoParaPedido(
      pedidoId,
      "EFECTIVO_CONTRA_ENTREGA",
      undefined,
      usuarioId,
      Rol.CLIENTE
    );

    expect(pago.estado).toBe("PENDIENTE");
    expect(pago.metodo).toBe("EFECTIVO_CONTRA_ENTREGA");
    expect(Number(pago.monto)).toBeCloseTo(25.5 + 5.99, 2);

    // Verificar estadoPago denormalizado en Pedido
    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: { estadoPago: true },
    });
    expect(pedido!.estadoPago).toBe("PENDIENTE");
  });

  // ---------------------------------------------------------------------------
  // 2. crearPagoParaPedido rechaza si ya existe pago para el pedido
  // ---------------------------------------------------------------------------
  it("crearPagoParaPedido rechaza si ya existe pago para el pedido", async () => {
    pedidoId = await crearPedidoDePrueba();

    await pagosService.crearPagoParaPedido(
      pedidoId,
      "EFECTIVO_CONTRA_ENTREGA",
      undefined,
      usuarioId,
      Rol.CLIENTE
    );

    await expect(
      pagosService.crearPagoParaPedido(
        pedidoId,
        "EFECTIVO_CONTRA_ENTREGA",
        undefined,
        usuarioId,
        Rol.CLIENTE
      )
    ).rejects.toThrow(BusinessError);

    try {
      await pagosService.crearPagoParaPedido(
        pedidoId,
        "EFECTIVO_CONTRA_ENTREGA",
        undefined,
        usuarioId,
        Rol.CLIENTE
      );
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_PAGO_YA_EXISTE);
      } else {
        throw err;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 3. crearPagoParaPedido rechaza METODO_NO_DISPONIBLE para TARJETA
  // ---------------------------------------------------------------------------
  it("crearPagoParaPedido rechaza METODO_NO_DISPONIBLE para TARJETA", async () => {
    pedidoId = await crearPedidoDePrueba();

    await expect(
      pagosService.crearPagoParaPedido(
        pedidoId,
        "TARJETA",
        undefined,
        usuarioId,
        Rol.CLIENTE
      )
    ).rejects.toThrow(BusinessError);

    try {
      await pagosService.crearPagoParaPedido(
        pedidoId,
        "TARJETA",
        undefined,
        usuarioId,
        Rol.CLIENTE
      );
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_METODO_NO_DISPONIBLE);
      } else {
        throw err;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 4. subirComprobante pasa a EN_PROCESO y solo el dueño puede
  // ---------------------------------------------------------------------------
  it("subirComprobante pasa a EN_PROCESO y solo el dueño puede", async () => {
    pedidoId = await crearPedidoDePrueba();

    const pago = await pagosService.crearPagoParaPedido(
      pedidoId,
      "TRANSFERENCIA_BANCARIA",
      undefined,
      usuarioId,
      Rol.CLIENTE
    );

    const actualizado = await pagosService.subirComprobante(
      pago.id,
      { referencia: "TXN-12345", comprobanteUrl: "/uploads/pago/test.png" },
      usuarioId
    );

    expect(actualizado.estado).toBe("EN_PROCESO");
    expect(actualizado.referencia).toBe("TXN-12345");

    // Otra persona no dueña no puede subir
    const otroUsuario = await prisma.user.create({
      data: {
        email: "otro@pagotest.com",
        password: "password123",
        nombre: "Otro Test",
        rol: Rol.CLIENTE,
      },
    });

    await expect(
      pagosService.subirComprobante(pago.id, { referencia: "x" }, otroUsuario.id)
    ).rejects.toThrow(BusinessError);

    try {
      await pagosService.subirComprobante(pago.id, { referencia: "x" }, otroUsuario.id);
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_NO_AUTORIZADO);
      } else {
        throw err;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 5. confirmarPago pasa a COMPLETADO, registra confirmadoPorId y confirmadoEn
  // ---------------------------------------------------------------------------
  it("confirmarPago pasa a COMPLETADO, registra confirmadoPorId y confirmadoEn", async () => {
    pedidoId = await crearPedidoDePrueba();

    const pago = await pagosService.crearPagoParaPedido(
      pedidoId,
      "EFECTIVO_CONTRA_ENTREGA",
      undefined,
      usuarioId,
      Rol.CLIENTE
    );

    const confirmado = await pagosService.confirmarPago(
      pago.id,
      negocioOwnerId,
      { notasNegocio: "Confirmado al entregar" },
      Rol.NEGOCIO
    );

    expect(confirmado.estado).toBe("COMPLETADO");
    expect(confirmado.confirmadoPorId).toBe(negocioOwnerId);
    expect(confirmado.confirmadoEn).not.toBeNull();

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: { estadoPago: true },
    });
    expect(pedido!.estadoPago).toBe("COMPLETADO");
  });

  // ---------------------------------------------------------------------------
  // 6. confirmarPago solo NEGOCIO dueño o ADMIN
  // ---------------------------------------------------------------------------
  it("confirmarPago requiere NEGOCIO dueño o ADMIN", async () => {
    pedidoId = await crearPedidoDePrueba();

    const pago = await pagosService.crearPagoParaPedido(
      pedidoId,
      "EFECTIVO_CONTRA_ENTREGA",
      undefined,
      usuarioId,
      Rol.CLIENTE
    );

    // CLIENTE no puede confirmar
    await expect(
      pagosService.confirmarPago(pago.id, usuarioId, undefined, Rol.CLIENTE)
    ).rejects.toThrow(BusinessError);

    try {
      await pagosService.confirmarPago(pago.id, usuarioId, undefined, Rol.CLIENTE);
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_NO_AUTORIZADO);
      } else {
        throw err;
      }
    }

    // Negocio dueño SÍ puede confirmar
    await expect(
      pagosService.confirmarPago(pago.id, negocioOwnerId, undefined, Rol.NEGOCIO)
    ).resolves.toBeDefined();

    // Verificar que un negocio que NO es dueño no puede confirmar
    const otroNegocio = await prisma.negocio.create({
      data: {
        nombre: "Otro Negocio",
        slug: "otro-negocio",
        activo: true,
      },
    });
    const otroNegocioOwner = await prisma.user.create({
      data: {
        email: "otrong@pagotest.com",
        password: "password123",
        nombre: "Otro Negocio Owner",
        rol: Rol.NEGOCIO,
      },
    });
    await prisma.negocio.update({
      where: { id: otroNegocio.id },
      data: { userId: otroNegocioOwner.id },
    });

    // Recrear pago para probar negocio ajeno
    await prisma.pago.deleteMany({});
    await prisma.pedido.update({
      where: { id: pedidoId },
      data: { estadoPago: "PENDIENTE" },
    });

    // Need to create another pedido
    await cartService.vaciarCarrito(usuarioId);
    const id2 = await crearPedidoDePrueba();
    const pago2 = await pagosService.crearPagoParaPedido(
      id2,
      "EFECTIVO_CONTRA_ENTREGA",
      undefined,
      usuarioId,
      Rol.CLIENTE
    );

    await expect(
      pagosService.confirmarPago(pago2.id, otroNegocioOwner.id, undefined, Rol.NEGOCIO)
    ).rejects.toThrow(BusinessError);

    try {
      await pagosService.confirmarPago(pago2.id, otroNegocioOwner.id, undefined, Rol.NEGOCIO);
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_NO_AUTORIZADO);
      } else {
        throw err;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 7. rechazarPago pasa a FALLIDO con motivo
  // ---------------------------------------------------------------------------
  it("rechazarPago pasa a FALLIDO con motivo", async () => {
    pedidoId = await crearPedidoDePrueba();

    const pago = await pagosService.crearPagoParaPedido(
      pedidoId,
      "EFECTIVO_CONTRA_ENTREGA",
      undefined,
      usuarioId,
      Rol.CLIENTE
    );

    const rechazado = await pagosService.rechazarPago(
      pago.id,
      negocioOwnerId,
      "Producto agotado",
      Rol.NEGOCIO
    );

    expect(rechazado.estado).toBe("FALLIDO");
    expect(rechazado.notasNegocio).toContain("Producto agotado");
  });

  // ---------------------------------------------------------------------------
  // 8. reembolsarPago solo ADMIN y solo desde COMPLETADO
  // ---------------------------------------------------------------------------
  it("reembolsarPago solo ADMIN y solo desde COMPLETADO", async () => {
    pedidoId = await crearPedidoDePrueba();

    const pago = await pagosService.crearPagoParaPedido(
      pedidoId,
      "EFECTIVO_CONTRA_ENTREGA",
      undefined,
      usuarioId,
      Rol.CLIENTE
    );

    // Negocio no puede reembolsar
    await expect(
      pagosService.reembolsarPago(pago.id, negocioOwnerId, "Error")
    ).rejects.toThrow(BusinessError);

    // Solo ADMIN puede reembolsar
    const admin = await prisma.user.findFirst({ where: { rol: "ADMIN" } });
    await pagosService.confirmarPago(pago.id, admin!.id, undefined, Rol.ADMIN);

    const reembolsado = await pagosService.reembolsarPago(
      pago.id,
      admin!.id,
      "Cliente insatisfecho"
    );

    expect(reembolsado.estado).toBe("REEMBOLSADO");
  });

  // ---------------------------------------------------------------------------
  // 9. cancelarPago solo desde PENDIENTE y por dueño o ADMIN
  // ---------------------------------------------------------------------------
  it("cancelarPago solo desde PENDIENTE y por dueño o ADMIN", async () => {
    pedidoId = await crearPedidoDePrueba();

    const pago = await pagosService.crearPagoParaPedido(
      pedidoId,
      "EFECTIVO_CONTRA_ENTREGA",
      undefined,
      usuarioId,
      Rol.CLIENTE
    );

    // Cliente (dueño) puede cancelar
    const cancelado = await pagosService.cancelarPago(
      pago.id,
      usuarioId,
      Rol.CLIENTE
    );
    expect(cancelado.estado).toBe("CANCELADO");

    // No se puede cancelar desde COMPLETADO
    await prisma.pago.update({
      where: { id: pago.id },
      data: { estado: "COMPLETADO" },
    });

    await expect(
      pagosService.cancelarPago(pago.id, usuarioId, Rol.CLIENTE)
    ).rejects.toThrow(BusinessError);

    try {
      await pagosService.cancelarPago(pago.id, usuarioId, Rol.CLIENTE);
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_ESTADO_INVALIDO);
      } else {
        throw err;
      }
    }

    // Usuario ajeno no puede cancelar
    const otroUsuario = await prisma.user.create({
      data: {
        email: "ajeno-cancel@pagotest.com",
        password: "password123",
        nombre: "Ajeno Cancel",
        rol: Rol.CLIENTE,
      },
    });

    // Crear otro pedido y pago para testar permiso
    const id2 = await crearPedidoDePrueba();
    const pago2 = await pagosService.crearPagoParaPedido(
      id2,
      "EFECTIVO_CONTRA_ENTREGA",
      undefined,
      usuarioId,
      Rol.CLIENTE
    );

    await expect(
      pagosService.cancelarPago(pago2.id, otroUsuario.id, Rol.CLIENTE)
    ).rejects.toThrow(BusinessError);

    try {
      await pagosService.cancelarPago(pago2.id, otroUsuario.id, Rol.CLIENTE);
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_NO_AUTORIZADO);
      } else {
        throw err;
      }
    }

    // ADMIN puede cancelar
    const admin = await prisma.user.findFirst({ where: { rol: "ADMIN" } });
    const canceladoAdmin = await pagosService.cancelarPago(
      pago2.id,
      admin!.id,
      Rol.ADMIN
    );
    expect(canceladoAdmin.estado).toBe("CANCELADO");
  });

  // ---------------------------------------------------------------------------
  // 10. Al cancelar pedido con pago COMPLETADO, se exige reembolso
  // (tested via PedidosService.actualizarEstado)
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // 11. Al completar pedido con pago PENDIENTE (efectivo), no se auto-completa
  // ---------------------------------------------------------------------------
  it("Al completar pedido con pago PENDIENTE, el pago no se marca COMPLETADO automáticamente", async () => {
    pedidoId = await crearPedidoDePrueba();

    await pagosService.crearPagoParaPedido(
      pedidoId,
      "EFECTIVO_CONTRA_ENTREGA",
      undefined,
      usuarioId,
      Rol.CLIENTE
    );

    // Completar el pedido
    await prisma.pedido.update({
      where: { id: pedidoId },
      data: { estado: "completado" },
    });

    const pago = await prisma.pago.findUnique({
      where: { pedidoId },
      select: { estado: true },
    });

    // El pago debe seguir PENDIENTE (no auto-completado)
    expect(pago!.estado).toBe("PENDIENTE");
  });

  // ---------------------------------------------------------------------------
  // 12. confirmarCheckout crea pedido + pago en la misma transacción
  // ---------------------------------------------------------------------------
  it("confirmarCheckout crea pedido + pago en la misma transacción", async () => {
    await cartService.anadirItem(usuarioId, {
      productoId,
      cantidad: 1,
    });

    const preparado = await checkoutService.prepararCheckout(usuarioId, {});

    const payload = {
      checkoutToken: preparado.checkoutToken,
      metodoPago: "EFECTIVO_CONTRA_ENTREGA",
      grupos: [
        {
          negocioId,
          tipoEntrega: "DOMICILIO" as const,
          opcionLogisticaId,
          direccionEntrega: "Calle Test 123",
        },
      ],
    };

    const result = await checkoutService.confirmarCheckout(usuarioId, payload);

    expect(result.pedidosCreados).toHaveLength(1);

    const pedidoIdCreado = result.pedidosCreados[0].id;

    // Verificar que el pago fue creado en la misma transacción
    const pago = await prisma.pago.findUnique({
      where: { pedidoId: pedidoIdCreado },
    });

    expect(pago).not.toBeNull();
    expect(pago!.metodo).toBe("EFECTIVO_CONTRA_ENTREGA");
    expect(pago!.estado).toBe("PENDIENTE");
  });

  // ---------------------------------------------------------------------------
  // 13. confirmarCheckout con TARJETA rechaza METODO_NO_DISPONIBLE
  // ---------------------------------------------------------------------------
  it("confirmarCheckout con TARJETA rechaza METODO_NO_DISPONIBLE", async () => {
    await cartService.anadirItem(usuarioId, {
      productoId,
      cantidad: 1,
    });

    const preparado = await checkoutService.prepararCheckout(usuarioId, {});

    const payload = {
      checkoutToken: preparado.checkoutToken,
      metodoPago: "TARJETA" as MetodoPago,
      grupos: [
        {
          negocioId,
          tipoEntrega: "RECOGIDA_TIENDA" as const,
        },
      ],
    };

    await expect(
      checkoutService.confirmarCheckout(usuarioId, payload)
    ).rejects.toThrow(BusinessError);

    try {
      await checkoutService.confirmarCheckout(usuarioId, payload);
      throw new Error("debería haber fallado");
    } catch (err) {
      if (err instanceof BusinessError) {
        expect(err.code).toBe(CODIGO_METODO_NO_DISPONIBLE);
      } else {
        throw err;
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 14. Recargar confirmación no crea pagos duplicados (idempotencia)
  // ---------------------------------------------------------------------------
  it("Recargar confirmación con mismo checkoutToken no crea pagos duplicados", async () => {
    await cartService.anadirItem(usuarioId, {
      productoId,
      cantidad: 1,
    });

    const preparado = await checkoutService.prepararCheckout(usuarioId, {});

    const payload = {
      checkoutToken: preparado.checkoutToken,
      metodoPago: "EFECTIVO_CONTRA_ENTREGA" as MetodoPago,
      grupos: [
        {
          negocioId,
          tipoEntrega: "DOMICILIO" as const,
          opcionLogisticaId,
          direccionEntrega: "Calle Test",
        },
      ],
    };

    // Primera confirmación
    await checkoutService.confirmarCheckout(usuarioId, payload);

    // Intentar reconfirmar con el mismo token → debe fallar (token expirado/invalidado)
    await expect(
      checkoutService.confirmarCheckout(usuarioId, payload)
    ).rejects.toThrow(BusinessError);

    // Verificar que solo hay un pago
    const pagos = await prisma.pago.findMany({});
    const pagosParaEstePedido = pagos.filter(
      (p) => p.metodo === "EFECTIVO_CONTRA_ENTREGA"
    );
    expect(pagosParaEstePedido.length).toBeLessThanOrEqual(1);
  });

  // ---------------------------------------------------------------------------
  // 15. TRANSFERENCIA_BANCARIA con datos inicia en EN_PROCESO
  // ---------------------------------------------------------------------------
  it("TRANSFERENCIA_BANCARIA con referencia inicia en EN_PROCESO", async () => {
    pedidoId = await crearPedidoDePrueba();

    const pago = await pagosService.crearPagoParaPedido(
      pedidoId,
      "TRANSFERENCIA_BANCARIA",
      { referencia: "REF-9999" },
      usuarioId,
      Rol.CLIENTE
    );

    expect(pago.estado).toBe("EN_PROCESO");
    expect(pago.referencia).toBe("REF-9999");
  });

  // ---------------------------------------------------------------------------
  // 16. getPagoDePedido valida propiedad
  // ---------------------------------------------------------------------------
  it("getPagoDePedido retorna null si no hay pago y valida propiedad", async () => {
    pedidoId = await crearPedidoDePrueba();

    await pagosService.crearPagoParaPedido(
      pedidoId,
      "EFECTIVO_CONTRA_ENTREGA",
      undefined,
      usuarioId,
      Rol.CLIENTE
    );

    const pago = await pagosService.getPagoDePedido(
      pedidoId,
      usuarioId,
      Rol.CLIENTE
    );

    expect(pago).not.toBeNull();
    expect(pago!.metodo).toBe("EFECTIVO_CONTRA_ENTREGA");

    // Usuario ajeno no puede verlo
    const otroUsuario = await prisma.user.create({
      data: {
        email: "ajeno@pagotest.com",
        password: "password123",
        nombre: "Ajeno Test",
        rol: Rol.CLIENTE,
      },
    });

    await expect(
      pagosService.getPagoDePedido(pedidoId, otroUsuario.id, Rol.CLIENTE)
    ).rejects.toThrow(BusinessError);
  });

  // ---------------------------------------------------------------------------
  // 17. listPagosDeUsuario filtra por estado y método
  // ---------------------------------------------------------------------------
  it("listPagosDeUsuario filtra por estado", async () => {
    // Crear 2 pedidos con pagos
    await cartService.anadirItem(usuarioId, { productoId, cantidad: 1 });
    let preparado = await checkoutService.prepararCheckout(usuarioId, {});
    await checkoutService.confirmarCheckout(usuarioId, {
      checkoutToken: preparado.checkoutToken,
      metodoPago: "EFECTIVO_CONTRA_ENTREGA",
      grupos: [{ negocioId, tipoEntrega: "RECOGIDA_TIENDA" }],
    });
    await cartService.anadirItem(usuarioId, { productoId, cantidad: 1 });
    preparado = await checkoutService.prepararCheckout(usuarioId, {});
    await checkoutService.confirmarCheckout(usuarioId, {
      checkoutToken: preparado.checkoutToken,
      metodoPago: "EFECTIVO_CONTRA_ENTREGA",
      grupos: [{ negocioId, tipoEntrega: "RECOGIDA_TIENDA" }],
    });

    const pagos = await prisma.pago.findMany({
      where: { estado: "PENDIENTE" },
    });

    const result = await pagosService.listPagosDeUsuario(usuarioId, {
      estado: ["PENDIENTE"],
    });

     expect(result.total).toBe(pagos.length);
  });

  // ---------------------------------------------------------------------------
  // 18. getResumenPagos retorna KPIs (ADMIN)
  // ---------------------------------------------------------------------------
   it("getResumenPagos retorna KPIs correctos", async () => {
    // Crear un pedido y pago COMPLETADO
    await cartService.anadirItem(usuarioId, { productoId, cantidad: 1 });
    let preparado = await checkoutService.prepararCheckout(usuarioId, {});
    const res = await checkoutService.confirmarCheckout(usuarioId, {
      checkoutToken: preparado.checkoutToken,
      grupos: [{ negocioId, tipoEntrega: "RECOGIDA_TIENDA" }],
    });

    const pago = await pagosService.crearPagoParaPedido(
      res.pedidosCreados[0].id,
      "EFECTIVO_CONTRA_ENTREGA",
      undefined,
      usuarioId,
      Rol.CLIENTE
    );

    const admin = await prisma.user.findFirst({ where: { rol: "ADMIN" } });
    await pagosService.confirmarPago(pago.id, admin!.id, undefined, Rol.ADMIN);

    const resumen = await pagosService.getResumenPagos();

    expect(resumen.totalCobrado).toBeGreaterThan(0);
    expect(resumen.porEstado["COMPLETADO"]).toBeGreaterThanOrEqual(1);
  });

  // ---------------------------------------------------------------------------
  // 19. rechazarPago requiere NEGOCIO dueño o ADMIN
  // ---------------------------------------------------------------------------
  it("rechazarPago requiere NEGOCIO dueño o ADMIN", async () => {
    pedidoId = await crearPedidoDePrueba();

    const pago = await pagosService.crearPagoParaPedido(
      pedidoId,
      "EFECTIVO_CONTRA_ENTREGA",
      undefined,
      usuarioId,
      Rol.CLIENTE
    );

    // CLIENTE no puede rechazar
    await expect(
      pagosService.rechazarPago(pago.id, usuarioId, "test", Rol.CLIENTE)
    ).rejects.toThrow(BusinessError);

    // Negocio ajeno no puede rechazar
    const negocioAjeno = await prisma.negocio.create({
      data: {
        nombre: "Negocio Ajeno",
        slug: "negocio-ajeno",
        activo: true,
      },
    });
    const negocioAjenoOwner = await prisma.user.create({
      data: {
        email: "ajeno-neg@pagotest.com",
        password: "password123",
        nombre: "Negocio Ajeno Owner",
        rol: Rol.NEGOCIO,
      },
    });
    await prisma.negocio.update({
      where: { id: negocioAjeno.id },
      data: { userId: negocioAjenoOwner.id },
    });

    await expect(
      pagosService.rechazarPago(pago.id, negocioAjenoOwner.id, "test", Rol.NEGOCIO)
    ).rejects.toThrow(BusinessError);
  });

  // ---------------------------------------------------------------------------
  // 20. crearPagoParaPedido valida idTransferencia + entidadPago
  // ---------------------------------------------------------------------------
  it("crearPagoParaPedido rechaza idTransferencia sin entidadPago", async () => {
    pedidoId = await crearPedidoDePrueba();

    await expect(
      pagosService.crearPagoParaPedido(
        pedidoId,
        "TRANSFERENCIA_BANCARIA",
        { idTransferencia: "TM-2026-000123", entidadPago: null },
        usuarioId,
        Rol.CLIENTE
      )
    ).rejects.toThrow(BusinessError);
  });

  it("crearPagoParaPedido rechaza entidadPago inválida", async () => {
    pedidoId = await crearPedidoDePrueba();

    await expect(
      pagosService.crearPagoParaPedido(
        pedidoId,
        "TRANSFERENCIA_BANCARIA",
        { idTransferencia: "TM-2026-000123", entidadPago: "EntidadFake" },
        usuarioId,
        Rol.CLIENTE
      )
    ).rejects.toThrow(BusinessError);
  });

  it("crearPagoParaPedido rechaza formato de idTransferencia inválido", async () => {
    pedidoId = await crearPedidoDePrueba();

    await expect(
      pagosService.crearPagoParaPedido(
        pedidoId,
        "PAGO_MOVIL",
        { idTransferencia: "FORMATO_INVALIDO", entidadPago: "EnZona" },
        usuarioId,
        Rol.CLIENTE
      )
    ).rejects.toThrow(BusinessError);
  });

  it("crearPagoParaPedido acepta idTransferencia con formato válido", async () => {
    pedidoId = await crearPedidoDePrueba();

    const pago = await pagosService.crearPagoParaPedido(
      pedidoId,
      "TRANSFERENCIA_BANCARIA",
      {
        idTransferencia: "TM-2026-000999",
        entidadPago: "Transfermovil",
        fechaTransferencia: new Date(),
      },
      usuarioId,
      Rol.CLIENTE
    );

    expect(pago.idTransferencia).toBe("TM-2026-000999");
    expect(pago.entidadPago).toBe("Transfermovil");
  });

  // ---------------------------------------------------------------------------
  // 21. subirComprobante valida idTransferencia
  // ---------------------------------------------------------------------------
  it("subirComprobante valida idTransferencia y entidadPago", async () => {
    pedidoId = await crearPedidoDePrueba();
    const pago = await pagosService.crearPagoParaPedido(
      pedidoId,
      "TRANSFERENCIA_BANCARIA",
      undefined,
      usuarioId,
      Rol.CLIENTE
    );

    await expect(
      pagosService.subirComprobante(pago.id, {
        referencia: "123456",
        idTransferencia: "FORMATO_INVALIDO",
        entidadPago: "EnZona",
      }, usuarioId)
    ).rejects.toThrow(BusinessError);
  });

  it("subirComprobante acepta idTransferencia con entidad válida", async () => {
    pedidoId = await crearPedidoDePrueba();
    const pago = await pagosService.crearPagoParaPedido(
      pedidoId,
      "PAGO_MOVIL",
      undefined,
      usuarioId,
      Rol.CLIENTE
    );

    const result = await pagosService.subirComprobante(pago.id, {
      referencia: "05-123-456-78",
      idTransferencia: "EZ-2026-000001",
      entidadPago: "EnZona",
      fechaTransferencia: new Date(),
    }, usuarioId);

    expect(result.idTransferencia).toBe("EZ-2026-000001");
    expect(result.entidadPago).toBe("EnZona");
    expect(result.estado).toBe("EN_PROCESO");
  });

  // ---------------------------------------------------------------------------
  // 22. reembolsarPago registra idTransferenciaReembolso
  // ---------------------------------------------------------------------------
  it("reembolsarPago registra idTransferenciaReembolso", async () => {
    pedidoId = await crearPedidoDePrueba();
    const pago = await pagosService.crearPagoParaPedido(
      pedidoId,
      "TRANSFERENCIA_BANCARIA",
      { idTransferencia: "TM-2026-000777", entidadPago: "Transfermovil" },
      usuarioId,
      Rol.CLIENTE
    );

    const admin = await prisma.user.findFirst({ where: { rol: "ADMIN" } });
    await pagosService.confirmarPago(pago.id, admin!.id, undefined, Rol.ADMIN);

    const reembolsado = await pagosService.reembolsarPago(
      pago.id,
      admin!.id,
      "Cliente solicitó reembolso",
      { idTransferenciaReembolso: "TM-REF-2026-000777", fechaReembolso: new Date() }
    );

    expect(reembolsado.estado).toBe("REEMBOLSADO");
    expect(reembolsado.idTransferenciaReembolso).toBe("TM-REF-2026-000777");
    expect(reembolsado.fechaReembolso).not.toBeNull();
  });

  // ---------------------------------------------------------------------------
  // 23. buscarPagoPorIdTransferencia (conciliación)
  // ---------------------------------------------------------------------------
  it("buscarPagoPorIdTransferencia retorna el pago correcto", async () => {
    pedidoId = await crearPedidoDePrueba();
    const pago = await pagosService.crearPagoParaPedido(
      pedidoId,
      "TRANSFERENCIA_BANCARIA",
      { idTransferencia: "TM-2026-000555", entidadPago: "Transfermovil" },
      usuarioId,
      Rol.CLIENTE
    );

    const encontrado = await pagosService.buscarPagoPorIdTransferencia("TM-2026-000555");
    expect(encontrado).not.toBeNull();
    expect(encontrado!.id).toBe(pago.id);
    expect(encontrado!.idTransferencia).toBe("TM-2026-000555");
  });

  it("buscarPagoPorIdTransferencia retorna null para ID inexistente", async () => {
    const encontrado = await pagosService.buscarPagoPorIdTransferencia("TM-2026-999999");
    expect(encontrado).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // 24. existeIdTransferencia
  // ---------------------------------------------------------------------------
  it("existeIdTransferencia detecta colision", async () => {
    pedidoId = await crearPedidoDePrueba();
    await pagosService.crearPagoParaPedido(
      pedidoId,
      "TRANSFERENCIA_BANCARIA",
      { idTransferencia: "TM-2026-000333", entidadPago: "Transfermovil" },
      usuarioId,
      Rol.CLIENTE
    );

    expect(await pagosService.existeIdTransferencia("TM-2026-000333")).toBe(true);
    expect(await pagosService.existeIdTransferencia("TM-2026-000000")).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // 25. listPagosDeNegocio filtra por entidadPago e idTransferencia
  // ---------------------------------------------------------------------------
  it("listPagosDeNegocio filtra por entidadPago", async () => {
    pedidoId = await crearPedidoDePrueba();
    await pagosService.crearPagoParaPedido(
      pedidoId,
      "TRANSFERENCIA_BANCARIA",
      { idTransferencia: "TM-2026-000222", entidadPago: "Transfermovil" },
      usuarioId,
      Rol.CLIENTE
    );

    const result = await pagosService.listPagosDeNegocio(
      negocioId,
      negocioOwnerId,
      { entidadPago: ["Transfermovil"] },
      Rol.NEGOCIO
    );

    expect(result.data.some((p) => p.entidadPago === "Transfermovil")).toBe(true);
  });

  it("listPagosDeUsuario filtra por idTransferencia", async () => {
    pedidoId = await crearPedidoDePrueba();
    await pagosService.crearPagoParaPedido(
      pedidoId,
      "PAGO_MOVIL",
      { idTransferencia: "EZ-2026-000444", entidadPago: "EnZona" },
      usuarioId,
      Rol.CLIENTE
    );

    const result = await pagosService.listPagosDeUsuario(usuarioId, {
      idTransferencia: "EZ-2026-000444",
    });

    expect(result.data.some((p) => p.idTransferencia === "EZ-2026-000444")).toBe(true);
  });
});
