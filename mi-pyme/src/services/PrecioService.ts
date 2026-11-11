import { Prisma, Moneda } from "@/generated/prisma/client";
import prisma from "@/lib/db/prisma";
import { BusinessError } from "@/shared/types";
import { Service } from "./Service";
import { ExchangeRateService, CurrencyLike } from "./ExchangeRateService";

export type DecimalLike = Prisma.Decimal | number | string;

export interface ResolucionMonedaContexto {
  userId?: string | null;
  negocioId?: string | null;
  monedaBase?: CurrencyLike | null;
  monedaVisualizacion?: CurrencyLike | null;
  conversionAutomatica?: boolean | null;
  monedaPreferida?: CurrencyLike | null;
}

export interface PrecioVistaResultado {
  montoBase: number;
  monedaBase: Moneda;
  montoVisualizacion: number;
  monedaVisualizacion: Moneda;
  conversionAutomatica: boolean;
  tasa: number;
}

export class PrecioService extends Service {
  private exchangeRateService: ExchangeRateService;

  constructor(exchangeRateService?: ExchangeRateService) {
    super();
    this.exchangeRateService = exchangeRateService ?? new ExchangeRateService();
  }

  async obtenerMonedaPreferida(ctx: ResolucionMonedaContexto): Promise<{
    monedaBase: Moneda;
    monedaVisualizacion: Moneda;
    conversionAutomatica: boolean;
  }> {
    const negocio = ctx.negocioId
      ? await prisma.negocio.findUnique({
          where: { id: ctx.negocioId },
          select: {
            monedaBase: true,
            monedaVisualizacion: true,
            conversionAutomatica: true,
          },
        })
      : null;

    const userPreference = ctx.userId
      ? await prisma.preferenciaMonedaUsuario.findUnique({
          where: { userId: ctx.userId },
          select: { moneda: true },
        })
      : null;

    const monedaBase = ctx.monedaBase
      ? ExchangeRateService.normalizarMoneda(ctx.monedaBase)
      : negocio?.monedaBase ?? Moneda.CUP;

    const preferenciaUsuario = ctx.monedaPreferida
      ? ExchangeRateService.normalizarMoneda(ctx.monedaPreferida)
      : userPreference?.moneda
        ? ExchangeRateService.normalizarMoneda(userPreference.moneda)
        : ctx.monedaVisualizacion
          ? ExchangeRateService.normalizarMoneda(ctx.monedaVisualizacion)
          : negocio?.monedaVisualizacion
            ? ExchangeRateService.normalizarMoneda(negocio.monedaVisualizacion)
            : Moneda.CUP;

    const conversionAutomatica = ctx.conversionAutomatica ?? negocio?.conversionAutomatica ?? true;

    if (negocio && conversionAutomatica) {
      return {
        monedaBase: negocio.monedaBase ?? Moneda.CUP,
        monedaVisualizacion: negocio.monedaVisualizacion ?? Moneda.CUP,
        conversionAutomatica: true,
      };
    }

    return {
      monedaBase,
      monedaVisualizacion: preferenciaUsuario,
      conversionAutomatica,
    };
  }

  async calcularPrecioVista(input: {
    montoBase: DecimalLike;
    monedaBase?: CurrencyLike | null;
    monedaVisualizacion?: CurrencyLike | null;
    userId?: string | null;
    negocioId?: string | null;
    monedaPreferida?: CurrencyLike | null;
    conversionAutomatica?: boolean | null;
  }): Promise<PrecioVistaResultado> {
    const baseValue = Number(input.montoBase);
    if (!Number.isFinite(baseValue)) {
      throw new BusinessError("El monto base no es válido", "MONTO_INVALIDO", 400);
    }

    const contexto = await this.obtenerMonedaPreferida({
      userId: input.userId,
      negocioId: input.negocioId,
      monedaBase: input.monedaBase,
      monedaVisualizacion: input.monedaVisualizacion,
      monedaPreferida: input.monedaPreferida,
      conversionAutomatica: input.conversionAutomatica,
    });

    const monedaBase = contexto.monedaBase;
    const monedaVisualizacion = contexto.monedaVisualizacion;

    if (monedaBase === monedaVisualizacion) {
      return {
        montoBase: baseValue,
        monedaBase,
        montoVisualizacion: baseValue,
        monedaVisualizacion,
        conversionAutomatica: contexto.conversionAutomatica,
        tasa: 1,
      };
    }

    const montoConvertido = await this.exchangeRateService.convert(baseValue, monedaBase, monedaVisualizacion);

    return {
      montoBase: baseValue,
      monedaBase,
      montoVisualizacion: montoConvertido,
      monedaVisualizacion,
      conversionAutomatica: contexto.conversionAutomatica,
      tasa: await this.exchangeRateService.getRate(monedaBase === Moneda.CUP ? monedaVisualizacion : monedaBase),
    };
  }

  async guardarPreferenciaMoneda(userId: string, moneda: CurrencyLike): Promise<{ userId: string; moneda: Moneda }> {
    const normalizedMoneda = ExchangeRateService.normalizarMoneda(moneda);

    const preference = await prisma.preferenciaMonedaUsuario.upsert({
      where: { userId },
      update: { moneda: normalizedMoneda },
      create: { userId, moneda: normalizedMoneda },
      select: { userId: true, moneda: true },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { monedaPreferida: normalizedMoneda },
    });

    return {
      userId: preference.userId,
      moneda: preference.moneda,
    };
  }
}

export default PrecioService;
