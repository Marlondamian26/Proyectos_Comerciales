/**
 * CheckoutService - business logic for the checkout flow with selectable logistics.
 *
 * Un carrito puede contener items de varios negocios. El checkout los agrupa
 * por negocio y, al confirmar, crea **un Pedido por negocio** en una transacción
 * Prisma atómica (uno o ninguno → todos o ninguno).
 *
 * Framework-agnostic: no Next.js imports. Reutiliza CartService.validarCarritoCompleto
 * y DisponibilidadService para revalidar disponibilidad.
 */
import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { ICache, getCache, cacheKeys, cachePrefixes, cacheTTL } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import { CartService } from "./CartService";
import { DisponibilidadService } from "./DisponibilidadService";
import { LogisticaService } from "./LogisticaService";
import { logAudit } from "./utils/audit";
import { normalizarFecha, formatFechaISO } from "@/shared/utils/fecha";
import {
  ENVIO_GRATIS_DESDE,
  CODIGO_CARRITO_VACIO,
  CODIGO_SIN_DISPONIBILIDAD,
  CODIGO_DIRECCION_REQUERIDA,
  CODIGO_OPCION_INVALIDA,
  CODIGO_CONFLICTO,
  METODOS_PAGO_DISPONIBLES,
  CODIGO_METODO_NO_DISPONIBLE,
  MONEDA_DEFECTO,
  CODIGO_LONGITUD,
  CODIGO_DIAS_EXPIRACION,
} from "@/core/constants";
import {
  Negocio,
  OpcionLogistica,
  TratamientoIVA,
  RegimenFiscal,
  ModoPrecio,
} from "@/generated/prisma/client";
import type { TipoEntrega } from "@/generated/prisma/client";
import type {
  CheckoutPreparadoDTO,
  ConfirmarCheckoutPayload,
  ConfirmarCheckoutResultDTO,
  RecalcularSeleccion,
  TotalesCheckoutDTO,
  SeleccionEntregaGrupo,
 } from "@/shared/checkout.types";
import { PagoService } from "./PagoService";
import IVAService, {
  type NegocioFiscal,
  type GrupoItemInput,
  type CalculoGrupoIVA,
} from "./IVAService";


export class CheckoutService extends Service {
  private cartService: CartService;
  private dispService: DisponibilidadService;
  private logisticaService: LogisticaService;
  private pagoService: PagoService;
  private ivaService: IVAService;
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
    this.cartService = new CartService(this.cache);
    this.dispService = new DisponibilidadService(this.cache);
    this.logisticaService = new LogisticaService(this.cache);
    this.pagoService = new PagoService(this.cache);
    this.ivaService = new IVAService();
  }

  private generarCheckoutToken(): string {
    return `ckt_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
  }

  /**
   * PREPARAR CHECKOUT
   * No persiste nada. Calcula el carrito agrupado por negocio, con disponibilidad
   * y totales preliminares. Genera un checkoutToken para idempotencia.
   */
  async prepararCheckout(
    userId: string,
    options?: { direccionEntrega?: string }
  ): Promise<CheckoutPreparadoDTO> {
    const carrito = await this.cartService.obtenerCarrito(userId);

    if (!carrito || carrito.items.length === 0) {
      throw new BusinessError(
        "El carrito está vacío",
        CODIGO_CARRITO_VACIO,
        400
      );
    }

    // Resolver negocio, producto y servicio de cada item
    const itemsEnriquecidos = await Promise.all(
      carrito.items.map(async (item) => {
        const negocioId =
          item.producto?.negocioId ?? item.servicio?.negocioId ?? null;

          const producto = item.productoId
            ? await prisma.producto.findUnique({
                where: { id: item.productoId },
                select: {
                  id: true,
                  nombre: true,
                  precio: true,
                  imagenUrl: true,
                  negocioId: true,
                  tratamientoIVA: true,
                  tasaIVAOverride: true,
                },
              })
            : null;

          const servicio = item.servicioId
            ? await prisma.servicio.findUnique({
                where: { id: item.servicioId },
                select: {
                  id: true,
                  nombre: true,
                  imagenUrl: true,
                  negocioId: true,
                  tratamientoIVA: true,
                  tasaIVAOverride: true,
                },
              })
            : null;

        const resolvedNegocioId = negocioId ?? producto?.negocioId ?? servicio?.negocioId ?? "";

        return {
          id: item.id,
          productoId: item.productoId,
          servicioId: item.servicioId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          tipo: item.tipo,
          fechaEntrega: item.fechaEntrega ?? null,
          negocioId: resolvedNegocioId,
          producto: producto
            ? {
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                imagenUrl: producto.imagenUrl ?? undefined,
                tratamientoIVA: producto.tratamientoIVA ?? TratamientoIVA.GRAVADO,
                tasaIVAOverride: producto.tasaIVAOverride ?? null,
              }
            : null,
          servicio: servicio
            ? {
                id: servicio.id,
                nombre: servicio.nombre,
                imagenUrl: servicio.imagenUrl ?? undefined,
                tratamientoIVA: servicio.tratamientoIVA ?? TratamientoIVA.GRAVADO,
                tasaIVAOverride: servicio.tasaIVAOverride ?? null,
              }
            : null,
        };
      })
    );

    // Agrupar por negocioId
    const gruposPorNegocio = new Map<string, typeof itemsEnriquecidos>();
    for (const item of itemsEnriquecidos) {
      if (!gruposPorNegocio.has(item.negocioId)) {
        gruposPorNegocio.set(item.negocioId, []);
      }
      gruposPorNegocio.get(item.negocioId)!.push(item);
    }

    // Cargar datos de negocios y validar disponibilidad
    const negocioIds = Array.from(gruposPorNegocio.keys());
    const negocios = await prisma.negocio.findMany({
      where: { id: { in: negocioIds } },
      select: {
        id: true,
        nombre: true,
        direccion: true,
        provincia: true,
        municipio: true,
        permiteEnvio: true,
        regimenFiscal: true,
        tasaIVA: true,
        modoPrecio: true,
      },
    });

    const negocioMap = new Map(negocios.map((n) => [n.id, n]));

    // Validar disponibilidad de todos los items
    const validaciones = await this.cartService.validarCarritoCompleto(userId);
    const problemasPorItem = new Map<string, string[]>();
    for (const v of validaciones) {
      if (v.problema) {
        const existing = problemasPorItem.get(v.itemId) ?? [];
        existing.push(v.problema);
        problemasPorItem.set(v.itemId, existing);
      }
    }

    // Cargar opciones de logística para cada negocio que permite envío
    const opcionesPorNegocio = new Map<string, OpcionLogistica[]>();
    for (const negocio of negocios) {
      if (negocio.permiteEnvio) {
        const ops = await this.logisticaService.listOpcionesParaCheckout(
          negocio.id
        );
        opcionesPorNegocio.set(negocio.id, ops);
      }
    }

    const grupos = [];
    const gruposCalculados: CalculoGrupoIVA[] = [];

    for (const [negocioId, items] of gruposPorNegocio) {
      const negocio = negocioMap.get(negocioId);
      if (!negocio) continue;

      const erroresDisponibilidad: string[] = [];
      for (const item of items) {
        const errs = problemasPorItem.get(item.id);
        if (errs && errs.length > 0) {
          const nombre = item.producto?.nombre ?? item.servicio?.nombre ?? item.id;
          erroresDisponibilidad.push(`${nombre}: ${errs.join("; ")}`);
        }
      }

      const disponibilidadOk = erroresDisponibilidad.length === 0;
      const ops = opcionesPorNegocio.get(negocioId) ?? [];

      const negocioFiscal: NegocioFiscal = {
        regimenFiscal: negocio.regimenFiscal ?? RegimenFiscal.GENERAL,
        tasaIVA: negocio.tasaIVA ?? 10,
        modoPrecio: negocio.modoPrecio ?? ModoPrecio.IVA_INCLUIDO,
      };

      const itemsFiscales: GrupoItemInput[] = items.map((i) => ({
        precio: i.precioUnitario,
        cantidad: i.cantidad,
        tratamientoIVA:
          i.producto?.tratamientoIVA ?? i.servicio?.tratamientoIVA ?? TratamientoIVA.GRAVADO,
        tasaOverride:
          i.producto?.tasaIVAOverride ?? i.servicio?.tasaIVAOverride ?? null,
      }));

      const calculoGrupo = this.ivaService.calcularGrupo(itemsFiscales, negocioFiscal);
      gruposCalculados.push(calculoGrupo);

      grupos.push({
        negocioId: negocio.id,
        negocio: {
          id: negocio.id,
          nombre: negocio.nombre,
          direccion: negocio.direccion,
          provincia: negocio.provincia,
          municipio: negocio.municipio,
          permiteEnvio: negocio.permiteEnvio,
          regimenFiscal: negocio.regimenFiscal,
          tasaIVA: Number(negocio.tasaIVA),
          modoPrecio: negocio.modoPrecio,
        },
        items: items.map((i, idx) => {
          const calcItem = calculoGrupo.items[idx];
          return {
            id: i.id,
            productoId: i.productoId,
            servicioId: i.servicioId,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
            tipo: i.tipo,
            fechaEntrega: i.fechaEntrega,
            producto: i.producto,
            servicio: i.servicio,
            tratamientoIVA: calcItem.tratamientoIVA,
            tasaIVA: Number(calcItem.tasaAplicada),
            precioUnitarioBase: Number(calcItem.precioUnitarioBase.toFixed(2)),
            precioUnitarioConIVA: Number(calcItem.precioUnitarioConIVA.toFixed(2)),
            baseImponible: Number(calcItem.baseImponible.toFixed(2)),
            montoIVA: Number(calcItem.montoIVA.toFixed(2)),
            subtotal: Number(calcItem.subtotal.toFixed(2)),
          };
        }),
        subtotal: Number(calculoGrupo.totalConIVA.toFixed(2)),
        iva: Number(calculoGrupo.montoIVA.toFixed(2)),
        baseImponible: Number(calculoGrupo.baseImponible.toFixed(2)),
        montoIVA: Number(calculoGrupo.montoIVA.toFixed(2)),
        totalConIVA: Number(calculoGrupo.totalConIVA.toFixed(2)),
        regimenFiscal: negocio.regimenFiscal,
        tasaIVA: Number(negocio.tasaIVA),
        modoPrecio: negocio.modoPrecio,
        opcionesLogistica: ops.map((o) => ({
          id: o.id,
          nombre: o.nombre,
          tipo: o.tipo,
          costo: Number(o.tarifaBase),
          tiempoEstimado: o.tiempoEstimado,
        })),
        puedeRecogerEnTienda: true,
        disponibilidadOk,
        erroresDisponibilidad,
      });
    }

    // Los envíos se calculan en recalcularTotales cuando el cliente elige.
    // En preparar, asumimos 0 (se recalcula al seleccionar).
    const checkoutCalculado = this.ivaService.calcularCheckout(gruposCalculados);

    const totales: TotalesCheckoutDTO = {
      subtotal: Number(checkoutCalculado.totalConIVA.toFixed(2)),
      iva: Number(checkoutCalculado.montoIVA.toFixed(2)),
      envio: 0,
      total: Number(checkoutCalculado.totalConIVA.toFixed(2)),
      baseImponible: Number(checkoutCalculado.baseImponible.toFixed(2)),
      montoIVA: Number(checkoutCalculado.montoIVA.toFixed(2)),
      totalConIVA: Number(checkoutCalculado.totalConIVA.toFixed(2)),
      tasaIVA:
        gruposCalculados.length === 1
          ? Number(gruposCalculados[0].tasaIVA)
          : undefined,
      regimenFiscal: undefined,
      modoPrecio: undefined,
    };

    // Generar y almacenar token de checkout para idempotencia
    const checkoutToken = this.generarCheckoutToken();
    const tokenData = {
      token: checkoutToken,
      userId,
      negocioIds: grupos.map((g) => g.negocioId),
      items: carrito.items.map((i) => ({
        id: i.id,
        productoId: i.productoId,
        servicioId: i.servicioId,
        cantidad: i.cantidad,
        fechaEntrega: i.fechaEntrega,
      })),
      expiresAt: Date.now() + cacheTTL.checkout * 1000,
    };
    await this.cache.set(cacheKeys.checkout.token(checkoutToken), tokenData, cacheTTL.checkout);

    return {
      checkoutToken,
      grupos,
      totales,
      direccionUsuario: options?.direccionEntrega ?? undefined,
    };
  }

  /**
   * RECALCULAR TOTALES
   * Recalcula subtotal, desglose de IVA (10% cubano) y envío según la selección actual del cliente.
   * Usa IVAService para aplicar la tasa correcta (10% según régimen, o 0% según régimen/tratamiento).
   */
  async recalcularTotales(
    userId: string,
    seleccion: RecalcularSeleccion
  ): Promise<TotalesCheckoutDTO> {
    const carrito = await this.cartService.obtenerCarrito(userId);
    if (!carrito || carrito.items.length === 0) {
      throw new BusinessError(
        "El carrito está vacío",
        CODIGO_CARRITO_VACIO,
        400
      );
    }

    // Agrupar items del carrito por negocio
    const gruposPorNegocio = new Map<string, typeof carrito.items>();
    for (const item of carrito.items) {
      const negocioId = item.producto?.negocioId ?? item.servicio?.negocioId ?? "";
      if (!negocioId) continue;
      if (!gruposPorNegocio.has(negocioId)) {
        gruposPorNegocio.set(negocioId, []);
      }
      gruposPorNegocio.get(negocioId)!.push(item);
    }

    const negocioIds = Array.from(gruposPorNegocio.keys());

    // Cargar negocios con datos fiscales
    const negocios = await prisma.negocio.findMany({
      where: { id: { in: negocioIds } },
      select: {
        id: true,
        regimenFiscal: true,
        tasaIVA: true,
        modoPrecio: true,
      },
    });
    const negocioMap = new Map(negocios.map((n) => [n.id, n]));

    // Cargar tratamientoIVA de productos/servicios
    const productoIds = carrito.items
      .filter((i) => i.productoId)
      .map((i) => i.productoId!);
    const servicioIds = carrito.items
      .filter((i) => i.servicioId)
      .map((i) => i.servicioId!);

    const productos =
      productoIds.length > 0
        ? await prisma.producto.findMany({
            where: { id: { in: productoIds } },
            select: { id: true, tratamientoIVA: true, tasaIVAOverride: true },
          })
        : [];
    const servicios =
      servicioIds.length > 0
        ? await prisma.servicio.findMany({
            where: { id: { in: servicioIds } },
            select: { id: true, tratamientoIVA: true, tasaIVAOverride: true },
          })
        : [];
    const productoMap = new Map(productos.map((p) => [p.id, p]));
    const servicioMap = new Map(servicios.map((s) => [s.id, s]));

    const gruposCalculados: CalculoGrupoIVA[] = [];
    let envioTotal = 0;

    for (const [negocioId, items] of gruposPorNegocio) {
      const negocio = negocioMap.get(negocioId);
      if (!negocio) continue;

      const negocioFiscal: NegocioFiscal = {
        regimenFiscal: negocio.regimenFiscal ?? RegimenFiscal.GENERAL,
        tasaIVA: negocio.tasaIVA ?? 10,
        modoPrecio: negocio.modoPrecio ?? ModoPrecio.IVA_INCLUIDO,
      };

      const itemsFiscales: GrupoItemInput[] = items.map((i) => {
        const prod = i.productoId ? productoMap.get(i.productoId) : null;
        const serv = i.servicioId ? servicioMap.get(i.servicioId) : null;
        return {
          precio: i.precioUnitario,
          cantidad: i.cantidad,
          tratamientoIVA:
            prod?.tratamientoIVA ?? serv?.tratamientoIVA ?? TratamientoIVA.GRAVADO,
          tasaOverride: prod?.tasaIVAOverride ?? serv?.tasaIVAOverride ?? null,
        };
      });

      const calculoGrupo = this.ivaService.calcularGrupo(itemsFiscales, negocioFiscal);
      gruposCalculados.push(calculoGrupo);

      // Calcular envío para este negocio
      const grupo = seleccion.grupos.find((g) => g.negocioId === negocioId);
      if (grupo && grupo.tipoEntrega === "DOMICILIO") {
        const ops = await this.logisticaService.listOpcionesParaCheckout(negocioId);
        const opcion = ops.find((o) => o.id === grupo.opcionLogisticaId);
        if (!opcion) {
          throw new BusinessError(
            "Opción de logística no válida para este negocio",
            CODIGO_OPCION_INVALIDA,
            400
          );
        }
        const costo = Number(opcion.tarifaBase);
        const subtotalGrupo = Number(calculoGrupo.totalConIVA.toFixed(2));
        const envioNeto =
          ENVIO_GRATIS_DESDE > 0 && subtotalGrupo >= ENVIO_GRATIS_DESDE
            ? 0
            : costo;
        envioTotal += envioNeto;
      }

      // RECOGIDA_TIENDA → envío = 0
    }

    const checkoutCalculado = this.ivaService.calcularCheckout(gruposCalculados);

    const subtotalTotal = Number(checkoutCalculado.totalConIVA.toFixed(2));
    const ivaTotal = Number(checkoutCalculado.montoIVA.toFixed(2));
    const envio = Number(envioTotal.toFixed(2));

    return {
      subtotal: subtotalTotal,
      iva: ivaTotal,
      envio: envio,
      total: Number((subtotalTotal + envio).toFixed(2)),
      baseImponible: Number(checkoutCalculado.baseImponible.toFixed(2)),
      montoIVA: ivaTotal,
      totalConIVA: subtotalTotal,
      tasaIVA:
        gruposCalculados.length === 1
          ? Number(gruposCalculados[0].tasaIVA)
          : undefined,
      regimenFiscal: undefined,
      modoPrecio: undefined,
    };
  }

  /**
   * CONFIRMAR CHECKOUT
   * Valida disponibilidad de nuevo (race condition), valida selecciones,
   * y crea un Pedido por negocio en una transacción Prisma.
   * Vacía el carrito y registra auditoría solo si la transacción tiene éxito.
   */
  async confirmarCheckout(
    userId: string,
    payload: ConfirmarCheckoutPayload
  ): Promise<ConfirmarCheckoutResultDTO> {
    // Validar checkoutToken
    const tokenData = await this.cache.get(cacheKeys.checkout.token(payload.checkoutToken));
    if (!tokenData || (tokenData as { userId: string; expiresAt: number }).userId !== userId) {
      throw new BusinessError(
        "Token de checkout inválido o expirado",
        CODIGO_CONFLICTO,
        409
      );
    }
    if ((tokenData as { expiresAt: number }).expiresAt < Date.now()) {
      await this.cache.del(cacheKeys.checkout.token(payload.checkoutToken));
      throw new BusinessError(
        "Sesión de checkout expirada",
        CODIGO_CONFLICTO,
        409
      );
    }

    // Validar método de pago
    if (payload.metodoPago && !METODOS_PAGO_DISPONIBLES.includes(payload.metodoPago)) {
      throw new BusinessError(
        `El método de pago ${payload.metodoPago} no está disponible`,
        CODIGO_METODO_NO_DISPONIBLE,
        400
      );
    }

    const carrito = await this.cartService.obtenerCarrito(userId);
    if (!carrito || carrito.items.length === 0) {
      throw new BusinessError(
        "El carrito está vacío",
        CODIGO_CARRITO_VACIO,
        400
      );
    }

    // Enriquecer items con negocio
    const itemsEnriquecidos = await Promise.all(
      carrito.items.map(async (item) => {
        const negocioId =
          item.producto?.negocioId ?? item.servicio?.negocioId ?? "";
        return {
          ...item,
          negocioId,
          producto: item.producto ?? null,
          servicio: item.servicio ?? null,
        };
      })
    );

    // Validar que cada grupo en payload tenga items en el carrito
    const gruposDelCarrito = new Map<string, typeof itemsEnriquecidos>();
    for (const item of itemsEnriquecidos) {
      if (!gruposDelCarrito.has(item.negocioId)) {
        gruposDelCarrito.set(item.negocioId, []);
      }
      gruposDelCarrito.get(item.negocioId)!.push(item);
    }

    // Validar payload
    for (const grupo of payload.grupos) {
      const itemsDelGrupo = gruposDelCarrito.get(grupo.negocioId);
      if (!itemsDelGrupo || itemsDelGrupo.length === 0) {
        throw new BusinessError(
          `No hay items del negocio ${grupo.negocioId} en el carrito`,
          CODIGO_CONFLICTO,
          409
        );
      }

      if (grupo.tipoEntrega === "DOMICILIO") {
        if (!grupo.opcionLogisticaId) {
          throw new BusinessError(
            `No se seleccionó opción de logística para el negocio ${grupo.negocioId}`,
            CODIGO_OPCION_INVALIDA,
            400
          );
        }
        if (!grupo.direccionEntrega) {
          throw new BusinessError(
            `Se requiere dirección de entrega para el negocio ${grupo.negocioId}`,
            CODIGO_DIRECCION_REQUERIDA,
            400
          );
        }

        // Validar que la opción pertenece al negocio
        await this.logisticaService.validarOpcion(
          grupo.negocioId,
          grupo.opcionLogisticaId
        );
      }
    }

    // Revalidar disponibilidad (race condition entre preparar y confirmar)
    const validaciones = await this.cartService.validarCarritoCompleto(userId);
    const problemas = validaciones.filter((v) => v.problema);
    if (problemas.length > 0) {
      const detalles = problemas
        .map((p) => {
          const item = itemsEnriquecidos.find((i) => i.id === p.itemId);
          const nombre = item?.producto?.nombre ?? item?.servicio?.nombre ?? p.itemId;
          return `${nombre}: ${p.problema}`;
        })
        .join("; ");
      throw new BusinessError(
        `No se puede confirmar el checkout: ${detalles}`,
        CODIGO_SIN_DISPONIBILIDAD,
        409
      );
    }

    // Cargar datos fiscales de negocios antes de la transacción
    const negocioIdsSet = Array.from(
      new Set(payload.grupos.map((g) => g.negocioId))
    );
    const negocioFiscalData = await prisma.negocio.findMany({
      where: { id: { in: negocioIdsSet } },
      select: {
        id: true,
        regimenFiscal: true,
        tasaIVA: true,
        modoPrecio: true,
      },
    });
    const negocioFiscalMap = new Map(
      negocioFiscalData.map((n) => [n.id, n])
    );

    // Cargar tratamientoIVA de productos y servicios
    const productoIds = carrito.items
      .filter((i) => i.productoId)
      .map((i) => i.productoId!);
    const servicioIds = carrito.items
      .filter((i) => i.servicioId)
      .map((i) => i.servicioId!);

    const productosFiscales =
      productoIds.length > 0
        ? await prisma.producto.findMany({
            where: { id: { in: productoIds } },
            select: { id: true, tratamientoIVA: true, tasaIVAOverride: true },
          })
        : [];
    const serviciosFiscales =
      servicioIds.length > 0
        ? await prisma.servicio.findMany({
            where: { id: { in: servicioIds } },
            select: { id: true, tratamientoIVA: true, tasaIVAOverride: true },
          })
        : [];
    const productoFiscalMap = new Map(
      productosFiscales.map((p) => [p.id, p])
    );
    const servicioFiscalMap = new Map(
      serviciosFiscales.map((s) => [s.id, s])
    );

    // Ejecutar transacción: crear un Pedido por negocio
    const pedidosCreados = await prisma.$transaction(async (tx) => {
      const result: { id: string; negocioId: string; total: number; estado: string; codigoEntrega: string | null }[] = [];

      for (const grupo of payload.grupos) {
        const itemsDelGrupo = gruposDelCarrito.get(grupo.negocioId)!;

        // Datos fiscales del negocio (snapshot)
        const negocioFiscal = negocioFiscalMap.get(grupo.negocioId);
        const nf: NegocioFiscal = {
          regimenFiscal: negocioFiscal?.regimenFiscal ?? RegimenFiscal.GENERAL,
          tasaIVA: negocioFiscal?.tasaIVA ?? 10,
          modoPrecio: negocioFiscal?.modoPrecio ?? ModoPrecio.IVA_INCLUIDO,
        };

        // Construir items fiscales para el cálculo
        const itemsFiscales: GrupoItemInput[] = itemsDelGrupo.map((i) => {
          const prod = i.productoId ? productoFiscalMap.get(i.productoId) : null;
          const serv = i.servicioId ? servicioFiscalMap.get(i.servicioId) : null;
          return {
            precio: i.precioUnitario,
            cantidad: i.cantidad,
            tratamientoIVA:
              prod?.tratamientoIVA ?? serv?.tratamientoIVA ?? TratamientoIVA.GRAVADO,
            tasaOverride: prod?.tasaIVAOverride ?? serv?.tasaIVAOverride ?? null,
          };
        });

        const calculoGrupo = this.ivaService.calcularGrupo(itemsFiscales, nf);

        // Calcular costo de envío
        let costoEnvio = 0;
        if (grupo.tipoEntrega === "DOMICILIO" && grupo.opcionLogisticaId) {
          const opcion = await tx.opcionLogistica.findUnique({
            where: { id: grupo.opcionLogisticaId },
            select: { tarifaBase: true },
          });
          if (opcion) {
            costoEnvio = Number(opcion.tarifaBase);
            const subtotalGrupo = Number(calculoGrupo.totalConIVA.toFixed(2));
            const envioNeto =
              ENVIO_GRATIS_DESDE > 0 && subtotalGrupo >= ENVIO_GRATIS_DESDE
                ? 0
                : costoEnvio;
            costoEnvio = envioNeto;
          }
        }

        const totalConIVA = Number(calculoGrupo.totalConIVA.toFixed(2));
        const total = totalConIVA + costoEnvio;

        // Validar que todos los items tienen el mismo negocioId
        const negocioIdsItems = new Set(
          itemsDelGrupo.map((i) => i.negocioId)
        );
        if (negocioIdsItems.size > 1) {
          throw new BusinessError(
            `Los items del pedido para el negocio ${grupo.negocioId} tienen negocios inconsistentes`,
            CODIGO_CONFLICTO,
            409
          );
        }

        const tipo =
          itemsDelGrupo.some((i) => i.tipo === "producto") &&
          itemsDelGrupo.some((i) => i.tipo === "servicio")
            ? "mixto"
            : itemsDelGrupo.some((i) => i.tipo === "producto")
            ? "producto"
            : "servicio";

        const baseImponibleTotal = Number(calculoGrupo.baseImponible.toFixed(2));
        const montoIVATotal = Number(calculoGrupo.montoIVA.toFixed(2));

        const pedido = await tx.pedido.create({
          data: {
            usuarioId: userId,
            negocioId: grupo.negocioId,
            total: Number(total.toFixed(2)),
            estado: "pendiente",
            tipo,
            tipoEntrega: grupo.tipoEntrega,
            opcionLogisticaId: grupo.opcionLogisticaId ?? null,
            costoEnvio: Number(costoEnvio.toFixed(2)),
            direccionEntrega:
              grupo.tipoEntrega === "DOMICILIO"
                ? grupo.direccionEntrega
                : null,
            fechaEntrega: payload.fechaEntrega
              ? new Date(payload.fechaEntrega)
              : itemsDelGrupo.some((i) => i.fechaEntrega)
              ? itemsDelGrupo[0]!.fechaEntrega!
              : undefined,
            notas: grupo.notas ?? null,
            negocioIds: JSON.stringify([grupo.negocioId]),
            baseImponibleTotal,
            montoIVATotal,
            totalConIVA,
            modoPrecio: nf.modoPrecio,
            regimenFiscalNegocio: nf.regimenFiscal,
            tasaIVANegocio: Number(nf.tasaIVA),
            items: {
              create: itemsDelGrupo.map((item, idx) => {
                const calc = calculoGrupo.items[idx];
                return {
                  productoId: item.productoId,
                  servicioId: item.servicioId,
                  cantidad: item.cantidad,
                  precioUnitario: item.precioUnitario,
                  precioUnitarioBase: Number(calc.precioUnitarioBase.toFixed(2)),
                  precioUnitarioConIVA: Number(calc.precioUnitarioConIVA.toFixed(2)),
                  tasaIVA: Number(calc.tasaAplicada.toFixed(2)),
                  tratamientoIVA: calc.tratamientoIVA,
                  baseImponible: Number(calc.baseImponible.toFixed(2)),
                  montoIVA: Number(calc.montoIVA.toFixed(2)),
                  subtotal: Number(calc.subtotal.toFixed(2)),
                  negocioId: item.negocioId,
                  fechaEntrega: item.fechaEntrega ?? undefined,
                };
              }),
            },
          },
          include: {
            items: {
              include: { producto: true, servicio: true, negocio: true },
            },
          },
        });

        result.push({
          id: pedido.id,
          negocioId: grupo.negocioId,
          total: Number(total.toFixed(2)),
          estado: pedido.estado,
          codigoEntrega: null,
        });
      }

      // Vaciar carrito
      await tx.carritoItem.deleteMany({
        where: { carrito: { usuarioId: userId, estado: "activo" } },
      });

      // Crear pago si se especificó método
      const pagosAudit: { id: string; pedidoId: string; metodo: string; estado: string; monto: number }[] = [];
      const codigosCache: { pagoId: string; pedidoId: string; codigoPlano: string }[] = [];
      if (payload.metodoPago) {
        for (const grp of payload.grupos) {
          const pedidoDelGrupo = result.find((p) => p.negocioId === grp.negocioId);
          if (!pedidoDelGrupo) continue;

          const estadoInicial =
            payload.datosPago?.referencia || payload.datosPago?.comprobanteUrl
              ? "EN_PROCESO"
              : "PENDIENTE";

          // Generar código de entrega para EFECTIVO_CONTRA_ENTREGA
          let codigoEntregaPlano: string | null = null;
          const esEfectivoContraEntrega =
            payload.metodoPago === "EFECTIVO_CONTRA_ENTREGA" && estadoInicial === "PENDIENTE";

          const datosPago: any = {
            pedidoId: pedidoDelGrupo.id,
            metodo: payload.metodoPago,
            estado: estadoInicial,
            monto: pedidoDelGrupo.total,
            moneda: MONEDA_DEFECTO,
            referencia: payload.datosPago?.referencia ?? null,
            comprobanteUrl: payload.datosPago?.comprobanteUrl ?? null,
            notasCliente: payload.datosPago?.notasCliente ?? null,
          };

          if (esEfectivoContraEntrega) {
            const codigoPlano = crypto
              .getRandomValues(new Uint32Array(1))[0]
              .toString()
              .slice(-CODIGO_LONGITUD)
              .padStart(CODIGO_LONGITUD, "0");
            const codigoHash = await bcrypt.hash(codigoPlano, 12);
            const ahora = new Date();
            const expiraEn = new Date(ahora.getTime() + CODIGO_DIAS_EXPIRACION * 24 * 60 * 60 * 1000);

            datosPago.codigoEntregaHash = codigoHash;
            datosPago.codigoEntregaExpira = expiraEn;
            datosPago.codigoEntregaRegeneraciones = 0;
            datosPago.codigoEntregaIntentos = 0;
            datosPago.codigoEntregaUsadoEn = null;
            datosPago.codigoEntregaBloqueado = false;
            codigoEntregaPlano = codigoPlano;
          }

          const pago = await tx.pago.create({ data: datosPago });

          // Sincronizar estadoPago denormalizado en Pedido
          await tx.pedido.update({
            where: { id: pedidoDelGrupo.id },
            data: { estadoPago: estadoInicial },
          });

          pagosAudit.push({
            id: pago.id,
            pedidoId: pedidoDelGrupo.id,
            metodo: payload.metodoPago,
            estado: estadoInicial,
            monto: Number(pedidoDelGrupo.total),
          });

          if (codigoEntregaPlano) {
            codigosCache.push({ pagoId: pago.id, pedidoId: pedidoDelGrupo.id, codigoPlano: codigoEntregaPlano });
          }
        }
      }

      // Asociar códigos de entrega a los resultados de pedidos
      for (const { pedidoId, codigoPlano } of codigosCache) {
        const item = result.find((p) => p.id === pedidoId);
        if (item) {
          item.codigoEntrega = codigoPlano;
        }
      }

      return { result, pagosAudit, codigosCache };
    });

   // Auditoría de pagos (fuera de la transacción para evitar locks en SQLite)
    for (const pagoAudit of pedidosCreados.pagosAudit) {
      await logAudit("PAGO_CREADO", userId, pagoAudit.id, {
        pedidoId: pagoAudit.pedidoId,
        metodo: pagoAudit.metodo,
        estado: pagoAudit.estado,
        monto: pagoAudit.monto,
        moneda: MONEDA_DEFECTO,
        origen: "CHECKOUT",
        ...(pagoAudit.metodo === "EFECTIVO_CONTRA_ENTREGA" ? { codigoGenerado: true } : {}),
      });
    }

    // Cachear códigos de entrega (fuera de la transacción, solo si fue exitosa)
    for (const { pagoId, codigoPlano } of pedidosCreados.codigosCache) {      await this.cache.set(
        cacheKeys.codigoEntrega.cache(pagoId),
        codigoPlano,
        CODIGO_DIAS_EXPIRACION * 24 * 60 * 60
      );
    }

    const pedidos = pedidosCreados.result;

    // Invalidar caches
    await this.cache.del(cacheKeys.carrito.usuario(userId));
    await this.cache.invalidatePrefix(cachePrefixes.pedidosUsuario + userId + ":");
    await this.cache.del(cacheKeys.checkout.token(payload.checkoutToken));

    // Invalidar disponibilidad de productos afectados
    for (const item of carrito.items) {
      if (item.productoId) {
        await this.dispService.invalidateProductoCache(item.productoId);
      }
    }

    // Auditoría
    for (const pedido of pedidos) {
      await logAudit("PEDIDO_CREADO_CHECKOUT", userId, pedido.id, {
        negocioId: pedido.negocioId,
        tipoEntrega: payload.grupos.find((g) => g.negocioId === pedido.negocioId)?.tipoEntrega,
        total: pedido.total,
      });
    }

    const totalGeneral = pedidos.reduce((sum, p) => sum + p.total, 0);

    return {
      pedidosCreados: pedidos,
      totalGeneral: Number(totalGeneral.toFixed(2)),
    };
  }
}

export default CheckoutService;
