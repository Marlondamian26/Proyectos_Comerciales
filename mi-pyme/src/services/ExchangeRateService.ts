import { Moneda } from "@/generated/prisma/client";
import { BusinessError } from "@/shared/types";
import prisma from "@/lib/db/prisma";
import { ICache, cacheKeys, cacheTTL, getCache } from "@/infrastructure";
import { Service } from "./Service";

export type CurrencyLike = Moneda | string;

export interface ElToqueTasasResponse {
  tasas?: Record<string, number | string>;
  rates?: Record<string, number | string>;
}

export const DEFAULT_TASAS_MONEDA: Record<Moneda, number> = {
  CUP: 1,
  USD: 500,
  EUR: 550,
  MLC: 200,
  USD_TRANSFER: 500,
  EUR_TRANSFER: 550,
};

export class ExchangeRateService extends Service {
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
  }

  static getCurrencies(): Moneda[] {
    return [
      Moneda.CUP,
      Moneda.USD,
      Moneda.EUR,
      Moneda.MLC,
      Moneda.USD_TRANSFER,
      Moneda.EUR_TRANSFER,
    ];
  }

  static normalizarMoneda(moneda: CurrencyLike | null | undefined): Moneda {
    if (!moneda) return Moneda.CUP;

    const raw = String(moneda).trim().toUpperCase();
    const aliases: Record<string, Moneda> = {
      CUP: Moneda.CUP,
      CUC: Moneda.USD,
      USD: Moneda.USD,
      EUR: Moneda.EUR,
      ECU: Moneda.EUR,
      MLC: Moneda.MLC,
      USD_TRANSFER: Moneda.USD_TRANSFER,
      EUR_TRANSFER: Moneda.EUR_TRANSFER,
    };

    if (aliases[raw]) {
      return aliases[raw];
    }

    const normalized = raw.replace(/\s+/g, "_");
    if (aliases[normalized]) {
      return aliases[normalized];
    }

    throw new BusinessError(`Moneda no soportada: ${moneda}`, "MONEDA_NO_SOPORTADA", 400);
  }

  private parseNumeric(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return parsed;
  }

  async getRates(forceRefresh = false): Promise<Record<Moneda, number>> {
    const cacheKey = cacheKeys.monedas.rates();

    if (!forceRefresh) {
      const cached = await this.cache.get<Record<Moneda, number>>(cacheKey);
      if (cached && Object.keys(cached).length > 0) {
        return cached;
      }
    }

    const latestByCurrency = new Map<Moneda, number>();
    const tasaRows = await prisma.tasaCambio.findMany({
      where: { activa: true },
      orderBy: { fecha: "desc" },
    });

    for (const row of tasaRows) {
      const moneda = ExchangeRateService.normalizarMoneda(row.moneda as CurrencyLike);
      if (!latestByCurrency.has(moneda)) {
        latestByCurrency.set(moneda, Number(row.tasa));
      }
    }

    const rates: Record<Moneda, number> = {
      CUP: 1,
      USD: DEFAULT_TASAS_MONEDA.USD,
      EUR: DEFAULT_TASAS_MONEDA.EUR,
      MLC: DEFAULT_TASAS_MONEDA.MLC,
      USD_TRANSFER: DEFAULT_TASAS_MONEDA.USD_TRANSFER,
      EUR_TRANSFER: DEFAULT_TASAS_MONEDA.EUR_TRANSFER,
    };

    for (const moneda of ExchangeRateService.getCurrencies()) {
      if (latestByCurrency.has(moneda)) {
        rates[moneda] = this.parseNumeric(latestByCurrency.get(moneda), rates[moneda]);
      }
    }

    await this.cache.set(cacheKey, rates, cacheTTL.monedas);
    return rates;
  }

  async syncFromElToque(forceRefresh = false): Promise<Record<Moneda, number>> {
    const cacheKey = cacheKeys.monedas.rates();
    const existing = forceRefresh ? null : await this.cache.get<Record<Moneda, number>>(cacheKey);
    if (existing && Object.keys(existing).length > 0 && !forceRefresh) {
      return existing;
    }

    const rates = await this.fetchFromElToque();
    const fecha = new Date();
    const data = Object.entries(rates).map(([moneda, tasa]) => ({
      fecha,
      moneda: ExchangeRateService.normalizarMoneda(moneda),
      tasa: Number(tasa),
      fuente: "ELTOQUE",
      activa: true,
    }));

    if (data.length > 0) {
      await prisma.tasaCambio.createMany({
        data,
        skipDuplicates: true,
      });
    }

    await this.cache.set(cacheKey, rates, cacheTTL.monedas);
    return rates;
  }

  async fetchFromElToque(): Promise<Record<Moneda, number>> {
    try {
      const response = await fetch("https://tasas.eltoque.com/v1/trmi", {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mi-Pyme/1.0",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as ElToqueTasasResponse;
      const tasas = payload.tasas ?? payload.rates ?? {};
      const usd = this.parseNumeric(tasas.USD ?? tasas.USD_TRANSFER, DEFAULT_TASAS_MONEDA.USD);
      const eur = this.parseNumeric(tasas.EUR ?? tasas.ECU ?? tasas.EUR_TRANSFER, DEFAULT_TASAS_MONEDA.EUR);
      const mlc = this.parseNumeric(tasas.MLC, DEFAULT_TASAS_MONEDA.MLC);

      return {
        CUP: 1,
        USD: usd,
        EUR: eur,
        MLC: mlc,
        USD_TRANSFER: usd,
        EUR_TRANSFER: eur,
      };
    } catch {
      return { ...DEFAULT_TASAS_MONEDA };
    }
  }

  async getRate(moneda: CurrencyLike): Promise<number> {
    const normalized = ExchangeRateService.normalizarMoneda(moneda);
    const rates = await this.getRates();
    return rates[normalized] ?? DEFAULT_TASAS_MONEDA[normalized] ?? 1;
  }

  async convert(
    amount: number | string,
    from: CurrencyLike,
    to: CurrencyLike
  ): Promise<number> {
    const source = ExchangeRateService.normalizarMoneda(from);
    const target = ExchangeRateService.normalizarMoneda(to);
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
      throw new BusinessError("El monto a convertir no es válido", "MONTO_INVALIDO", 400);
    }

    if (source === target) {
      return numericAmount;
    }

    const rates = await this.getRates();
    const sourceRate = source === Moneda.CUP ? 1 : rates[source] ?? DEFAULT_TASAS_MONEDA[source];
    const targetRate = target === Moneda.CUP ? 1 : rates[target] ?? DEFAULT_TASAS_MONEDA[target];

    if (source === Moneda.CUP) {
      return numericAmount / targetRate;
    }

    if (target === Moneda.CUP) {
      return numericAmount * sourceRate;
    }

    return (numericAmount * sourceRate) / targetRate;
  }
}

export default ExchangeRateService;
