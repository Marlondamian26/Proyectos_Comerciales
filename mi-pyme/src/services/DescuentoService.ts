/**
 * DescuentoService - orquesta la aplicación de promociones, cupones y combos
 * en el checkout.
 *
 * Framework-agnostic. No Next.js imports.
 *
 * Orden de aplicación:
 * 1. Promociones automáticas (por negocio)
 * 2. Combo (reemplaza precio de items por precio del combo, repartido proporcionalmente)
 * 3. Cupón (sobre subtotal post-promociones post-combo)
 * 4. IVA sobre base post-descuentos
 * 5. Envío (puede ser gratis por promoción/cupón)
 */
import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { ICache, getCache } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import { PromocionService } from "./PromocionService";
import { CuponService } from "./CuponService";
import { ComboService } from "./ComboService";
import { CODIGO_CUPON_INVALIDO, CODIGO_COMBO_NO_DISPONIBLE } from "@/core/constants";
import IVAService, { type GrupoItemInput, type NegocioFiscal } from "./IVAService";
import type {
  ItemCarritoParaDescuento,
  DescuentoItem,
  DescuentoPorNegocio,
  DescuentoComboPorNegocio,
  ResultadoDescuentos,
  PromocionDTO,
} from "@/shared/descuentos.types";
import type { RegimenFiscal, ModoPrecio, TratamientoIVA } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";

export class DescuentoService extends Service {
  private cache: ICache;
  private promocionService: PromocionService;
  private cuponService: CuponService;
  private comboService: ComboService;
  private ivaService: IVAService;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
    this.promocionService = new PromocionService(this.cache);
    this.cuponService = new CuponService(this.cache);
    this.comboService = new ComboService(this.cache);
    this.ivaService = new IVAService();
  }

  /**
   * Aplica descuentos al carrito.
   * Devuelve el resultado con todos los cálculos fiscales.
   */
  async aplicarDescuentos(
    userId: string,
    items: ItemCarritoParaDescuento[],
    cuponCodigo?: string
  ): Promise<ResultadoDescuentos> {
    // Agrupar items por negocio
    const gruposPorNegocio = new Map<string, ItemCarritoParaDescuento[]>();
    for (const item of items) {
      if (!gruposPorNegocio.has(item.negocioId)) {
        gruposPorNegocio.set(item.negocioId, []);
      }
      gruposPorNegocio.get(item.negocioId)!.push(item);
    }

    // Cargar datos fiscales de negocios
    const negocioIds = Array.from(gruposPorNegocio.keys());
    const negociosRaw = await prisma.negocio.findMany({
      where: { id: { in: negocioIds } },
      select: {
        id: true,
        nombre: true,
        regimenFiscal: true,
        tasaIVA: true,
        modoPrecio: true,
        permiteEnvio: true,
        permiteAcumularDescuentos: true,
      },
    });

    type NegocioInfo = {
      id: string;
      nombre: string | null;
      regimenFiscal: string;
      tasaIVA: Prisma.Decimal | null;
      modoPrecio: string;
      permiteEnvio: boolean;
      permiteAcumularDescuentos: boolean;
    };
    const negocioMap = new Map<string, NegocioInfo>(
      negociosRaw.map((n) => [
        n.id,
        {
          id: n.id,
          nombre: n.nombre,
          regimenFiscal: n.regimenFiscal,
          tasaIVA: n.tasaIVA,
          modoPrecio: n.modoPrecio,
          permiteEnvio: n.permiteEnvio,
          permiteAcumularDescuentos: n.permiteAcumularDescuentos,
        } as NegocioInfo,
      ])
    );

    // Cargar productos/servicios fiscales
    const productos = await this.cargarProductos(items);
    const servicios = await this.cargarServicios(items);

    // Aplicar promociones por negocio
    const gruposConPromos: DescuentoPorNegocio[] = [];
    let descuentoTotalPromos = 0;

    for (const [negocioId, itemsNegocio] of gruposPorNegocio) {
      const promociones = await this.promocionService.listPromocionesAplicables(
        negocioId,
        itemsNegocio,
        userId
      );

      const itemsConDescuento: DescuentoItem[] = [];
      const promocionesAplicadas: PromocionDTO[] = [];
      let subtotalOriginal = 0;
      let subtotalConDescuento = 0;
      let envioGratis = false;
      let descuentoNegocio = 0;
      let promoExclusiva: PromocionDTO | null = null;

      for (const item of itemsNegocio) {
        const itemTotal = item.precioUnitario * item.cantidad;
        subtotalOriginal += itemTotal;
      }

      if (promociones.length > 0) {
        const promosActivas = promociones.filter((p) => p.estado === "ACTIVA");

        for (const promo of promosActivas) {
          if (promo.exclusiva && promoExclusiva) continue;

          const descuentoItems = this.promocionService.calcularDescuento(promo, itemsNegocio);

          const tieneDescuentoReal = descuentoItems.length > 0 && descuentoItems.some((d) => d.descuento > 0);
          const isEnvioGratis = promo.tipo === "ENVIO_GRATIS";

          if (descuentoItems.length > 0 && (tieneDescuentoReal || isEnvioGratis)) {
            if (promo.exclusiva) promoExclusiva = promo;
            promocionesAplicadas.push(promo);

            for (const di of descuentoItems) {
              const existing = itemsConDescuento.find((e) => e.id === di.id);
              if (existing) {
                existing.precioConDescuento = di.precioConDescuento;
                existing.descuento = di.descuento;
              } else {
                itemsConDescuento.push({ ...di });
              }
            }

            if (isEnvioGratis) {
              envioGratis = true;
            }
          }
        }
      }

      // Items sin descuento
      for (const item of itemsNegocio) {
        if (!itemsConDescuento.find((d) => d.id === item.id)) {
          const itemTotal = item.precioUnitario * item.cantidad;
          itemsConDescuento.push({
            id: item.id,
            productoId: item.productoId,
            servicioId: item.servicioId,
            cantidad: item.cantidad,
            precioOriginal: itemTotal,
            precioConDescuento: itemTotal,
            descuento: 0,
          });
        }
      }

      subtotalConDescuento = itemsConDescuento.reduce((s, d) => s + d.precioConDescuento, 0);
      descuentoNegocio = subtotalOriginal - subtotalConDescuento;
      descuentoTotalPromos += descuentoNegocio;

      gruposConPromos.push({
        negocioId,
        itemsOriginales: itemsConDescuento,
        subtotalOriginal,
        subtotalConDescuento,
        descuentoTotal: descuentoNegocio,
        envioGratis,
        promocionesAplicadas: promocionesAplicadas.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          tipo: p.tipo,
          descuento: 0,
        })),
      });
    }

    // Aplicar combo (si hay)
    let comboAplicado = null;
    let descuentoTotalCombo = 0;

    const itemCombo = items.find((i) => {
      const meta = i.metadata as Record<string, unknown> | null;
      return meta?.comboId != null;
    });

    if (itemCombo) {
      const comboId = (itemCombo.metadata as Record<string, unknown>).comboId as string;
      const combo = await this.comboService.getCombo(comboId);

      const disponible = await this.comboService.validarCombo(comboId);
      if (!disponible) {
        throw new BusinessError(
          `El combo "${combo.nombre}" no está disponible`,
          CODIGO_COMBO_NO_DISPONIBLE,
          400
        );
      }

      const itemsDescompuestos = await this.comboService.descomponerCombo(comboId);
      const precioCombo = Number(combo.precio);
      const precioOriginalTotal = itemsDescompuestos.reduce(
        (s, i) => s + i.precioOriginal,
        0
      );
      descuentoTotalCombo = Math.max(0, precioOriginalTotal - precioCombo);

      // Repartir el descuento proporcionalmente por negocio
      const repartoNegociosMap = new Map<string, { subtotalOriginal: number; items: typeof itemsDescompuestos }>();
      for (const item of itemsDescompuestos) {
        if (!repartoNegociosMap.has(item.negocioId)) {
          repartoNegociosMap.set(item.negocioId, { subtotalOriginal: 0, items: [] });
        }
        const entry = repartoNegociosMap.get(item.negocioId)!;
        entry.subtotalOriginal += item.precioOriginal;
        entry.items.push(item);
      }

      const repartoNegocios: DescuentoComboPorNegocio[] = [];
      for (const [negocioId, data] of repartoNegociosMap) {
        const factor = precioOriginalTotal > 0 ? data.subtotalOriginal / precioOriginalTotal : 0;
        const descuentoAsignado = descuentoTotalCombo * factor;
        repartoNegocios.push({
          negocioId,
          descuentoAsignado,
          items: data.items.map((i) => ({
            id: i.productoId ?? i.servicioId ?? "",
            productoId: i.productoId,
            servicioId: i.servicioId,
            cantidad: i.cantidad,
            precioOriginal: i.precioOriginal,
            precioConDescuento: i.precioConDescuento,
          })),
        });

        // Actualizar grupos con descuento del combo
        const grupoExistente = gruposConPromos.find((g) => g.negocioId === negocioId);
        if (grupoExistente) {
          for (const di of grupoExistente.itemsOriginales) {
            const itemDescompuesto = data.items.find(
              (d) => d.productoId === di.productoId || d.servicioId === di.servicioId
            );
            if (itemDescompuesto) {
              const factorItem = precioOriginalTotal > 0 ? itemDescompuesto.precioOriginal / precioOriginalTotal : 0;
              di.descuento += descuentoTotalCombo * factorItem;
              di.precioConDescuento = di.precioOriginal - di.descuento;
            }
          }
          grupoExistente.descuentoTotal += descuentoAsignado;
          grupoExistente.subtotalConDescuento = grupoExistente.subtotalConDescuento - descuentoAsignado;
        }
      }

      // Items descompuestos con cálculo fiscal
      const itemsDescompuestosConIVA = [];
      for (const item of itemsDescompuestos) {
        const prod = item.productoId ? productos.get(item.productoId) : null;
        const serv = item.servicioId ? servicios.get(item.servicioId) : null;
        const tratamiento = (prod?.tratamientoIVA ?? serv?.tratamientoIVA ?? "GRAVADO") as TratamientoIVA;
        const tasaOverride = prod?.tasaIVAOverride ?? serv?.tasaIVAOverride ?? null;

        const negocioInfo = negocioMap.get(item.negocioId);
        const negocioFiscal: NegocioFiscal = {
          regimenFiscal: (negocioInfo?.regimenFiscal as RegimenFiscal) ?? "GENERAL",
          tasaIVA: Number(negocioInfo?.tasaIVA ?? 10),
          modoPrecio: (negocioInfo?.modoPrecio as ModoPrecio) ?? "IVA_INCLUIDO",
        };

        const calc = this.ivaService.calcularItem({
          precio: item.precioConDescuento / item.cantidad,
          cantidad: item.cantidad,
          tratamientoIVA: tratamiento,
          negocio: negocioFiscal,
          tasaOverride: tasaOverride ? Number(tasaOverride) : null,
        });

        itemsDescompuestosConIVA.push({
          productoId: item.productoId,
          servicioId: item.servicioId,
          cantidad: item.cantidad,
          negocioId: item.negocioId,
          precioOriginal: item.precioOriginal,
          precioConDescuento: item.precioConDescuento,
          tratamientoIVA: tratamiento,
          tasaIVAOverride: tasaOverride,
          baseImponible: Number(calc.baseImponible),
          montoIVA: Number(calc.montoIVA),
          subtotal: Number(calc.subtotal),
        });
      }

      comboAplicado = {
        comboId: combo.id,
        nombre: combo.nombre,
        descuentoTotal: descuentoTotalCombo,
        repartoNegocios,
        itemsDescompuestos: itemsDescompuestosConIVA,
      };
    }

    // Aplicar cupón (si hay código)
    let cuponAplicado = null;
    let descuentoCupon = 0;
    let permiteAcumular = false;

    if (cuponCodigo) {
      const itemsAValidar = items;
      const validacion = await this.cuponService.validarCupon(cuponCodigo, userId, itemsAValidar);

      if (!validacion.valido) {
        throw new BusinessError(
          validacion.errores.join("; "),
          CODIGO_CUPON_INVALIDO,
          400
        );
      }

      const cupon = validacion.cupon!;
      const resultado = this.cuponService.aplicarDescuento(cupon, items);
      descuentoCupon = resultado.descuentoTotal;
      cuponAplicado = {
        cuponId: cupon.id,
        codigo: cupon.codigo,
        tipo: cupon.tipo,
        valor: cupon.valor ? Number(cupon.valor) : null,
        descuentoTotal: descuentoCupon,
      };

      // Verificar acumulación con promociones
      let todosPermitenAcumular = true;
      for (const g of gruposConPromos) {
        const negocio = negocioMap.get(g.negocioId);
        if (negocio && !negocio.permiteAcumularDescuentos) {
          todosPermitenAcumular = false;
          break;
        }
      }
      permiteAcumular = todosPermitenAcumular;
    }

    // Calcular subtotales finales
    let subtotalOriginal = 0;
    let subtotalConDescuento = 0;

    for (const g of gruposConPromos) {
      subtotalOriginal += g.subtotalOriginal;
      subtotalConDescuento += g.subtotalConDescuento;
    }

    // Si el cupón aplica y no se acumula con promo, ver qué es mayor
    if (cuponAplicado && !permiteAcumular && descuentoCupon > descuentoTotalPromos) {
      // El cupón es mayor: revertimos promociones y aplicamos solo cupón
      subtotalConDescuento = subtotalOriginal - descuentoCupon;
    } else if (cuponAplicado && !permiteAcumular && descuentoTotalPromos > descuentoCupon) {
      // Ya se aplicaron promociones, el cupón no se acumula
      // Resetear cupón
      cuponAplicado = null;
      descuentoCupon = 0;
    } else if (cuponAplicado && permiteAcumular) {
      subtotalConDescuento = subtotalOriginal - descuentoTotalPromos - descuentoCupon;
    }

    // Ajustar por combo si aplica
    if (comboAplicado) {
      subtotalConDescuento -= descuentoTotalCombo;
    }

    // Calcular envío
    let envioTotal = 0;
    let tieneEnvioGratisPorPromo = false;

    for (const g of gruposConPromos) {
      if (g.envioGratis) {
        tieneEnvioGratisPorPromo = true;
      }
    }

    // Verificar si el cupón es ENVIO_GRATIS
    if (cuponAplicado && cuponAplicado.tipo === "ENVIO_GRATIS") {
      tieneEnvioGratisPorPromo = true;
    }

    envioTotal = tieneEnvioGratisPorPromo ? 0 : 0; // El envío se calcula en CheckoutService.recalcularTotales

    // Calcular IVA sobre la base post-descuento
    const gruposConDatos = [];
    let baseImponibleTotal = 0;
    let montoIVATotal = 0;

    for (const g of gruposConPromos) {
      const negocio = negocioMap.get(g.negocioId);
      if (!negocio) continue;

      const negocioFiscal: NegocioFiscal = {
        regimenFiscal: negocio.regimenFiscal as RegimenFiscal ?? "GENERAL",
        tasaIVA: Number(negocio.tasaIVA ?? 10),
        modoPrecio: negocio.modoPrecio as ModoPrecio ?? "IVA_INCLUIDO",
      };

      const itemsFiscales: GrupoItemInput[] = [];
      for (const item of g.itemsOriginales) {
        const prod = item.productoId ? productos.get(item.productoId ?? "") : null;
        const serv = item.servicioId ? servicios.get(item.servicioId ?? "") : null;

         itemsFiscales.push({
          precio: item.precioConDescuento / Math.max(item.cantidad, 1),
          cantidad: item.cantidad,
          tratamientoIVA: (prod?.tratamientoIVA ?? serv?.tratamientoIVA ?? "GRAVADO") as TratamientoIVA,
          tasaOverride: (prod?.tasaIVAOverride ?? serv?.tasaIVAOverride ?? null)
            ? Number(prod?.tasaIVAOverride ?? serv?.tasaIVAOverride)
            : null,
        });
      }

      const calcGrupo = this.ivaService.calcularGrupo(itemsFiscales, negocioFiscal);
      gruposConDatos.push(calcGrupo);
      baseImponibleTotal += Number(calcGrupo.baseImponible);
      montoIVATotal += Number(calcGrupo.montoIVA);
    }

    // Si hay combo con items descompuestos, incluirlos en el cálculo fiscal
    if (comboAplicado) {
      const itemsPorNegocio = new Map<string, typeof comboAplicado.itemsDescompuestos>();
      for (const item of comboAplicado.itemsDescompuestos) {
        if (!itemsPorNegocio.has(item.negocioId)) {
          itemsPorNegocio.set(item.negocioId, []);
        }
        itemsPorNegocio.get(item.negocioId)!.push(item);
      }

      for (const [negocioId, itemsCombo] of itemsPorNegocio) {
        const negocio = negocioMap.get(negocioId);
        if (!negocio) continue;

        const negocioFiscal: NegocioFiscal = {
          regimenFiscal: negocio.regimenFiscal as RegimenFiscal ?? "GENERAL",
          tasaIVA: Number(negocio.tasaIVA ?? 10),
          modoPrecio: negocio.modoPrecio as ModoPrecio ?? "IVA_INCLUIDO",
        };

        const itemsFiscales: GrupoItemInput[] = itemsCombo.map((i) => ({
          precio: i.precioConDescuento / Math.max(i.cantidad, 1),
          cantidad: i.cantidad,
          tratamientoIVA: i.tratamientoIVA,
          tasaOverride: i.tasaIVAOverride ? Number(i.tasaIVAOverride) : null,
        }));

        const calcGrupo = this.ivaService.calcularGrupo(itemsFiscales, negocioFiscal);
        baseImponibleTotal += Number(calcGrupo.baseImponible);
        montoIVATotal += Number(calcGrupo.montoIVA);
      }
    }

    const descuentoTotal = descuentoTotalPromos + descuentoCupon + descuentoTotalCombo;
    const totalSinEnvio = subtotalConDescuento + montoIVATotal;
    const total = totalSinEnvio + envioTotal;

    return {
      grupos: gruposConPromos,
      comboAplicado,
      cuponAplicado,
      descuentoTotal,
      subtotalOriginal,
      subtotalConDescuento,
      iva: montoIVATotal,
      envio: envioTotal,
      total,
      baseImponible: baseImponibleTotal,
      montoIVA: montoIVATotal,
    };
  }

  private async cargarProductos(
    items: ItemCarritoParaDescuento[]
  ): Promise<Map<string, { tratamientoIVA: string; tasaIVAOverride: string | null }>> {
    const productoIds = items
      .filter((i) => i.productoId)
      .map((i) => i.productoId!);
    if (productoIds.length === 0) return new Map();

    const productos = await prisma.producto.findMany({
      where: { id: { in: productoIds } },
      select: { id: true, tratamientoIVA: true, tasaIVAOverride: true },
    });

    const map = new Map();
    for (const p of productos) {
      map.set(p.id, { tratamientoIVA: p.tratamientoIVA, tasaIVAOverride: p.tasaIVAOverride });
    }
    return map;
  }

  private async cargarServicios(
    items: ItemCarritoParaDescuento[]
  ): Promise<Map<string, { tratamientoIVA: string; tasaIVAOverride: string | null }>> {
    const servicioIds = items
      .filter((i) => i.servicioId)
      .map((i) => i.servicioId!);
    if (servicioIds.length === 0) return new Map();

    const servicios = await prisma.servicio.findMany({
      where: { id: { in: servicioIds } },
      select: { id: true, tratamientoIVA: true, tasaIVAOverride: true },
    });

    const map = new Map();
    for (const s of servicios) {
      map.set(s.id, { tratamientoIVA: s.tratamientoIVA, tasaIVAOverride: s.tasaIVAOverride });
    }
    return map;
  }
}

export default DescuentoService;
