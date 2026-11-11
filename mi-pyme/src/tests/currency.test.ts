import { describe, expect, it } from "vitest";
import { Moneda } from "@/generated/prisma/client";
import { ExchangeRateService, DEFAULT_TASAS_MONEDA } from "@/services/ExchangeRateService";
import { PrecioService } from "@/services/PrecioService";

const exchangeRateService = new ExchangeRateService();
const precioService = new PrecioService(exchangeRateService);

describe("ExchangeRateService", () => {
  it("convierte CUP a USD con la tasa de referencia", async () => {
    const result = await exchangeRateService.convert(1000, Moneda.CUP, Moneda.USD);
    expect(result).toBeCloseTo(2, 8);
  });

  it("convierte USD a CUP y entre monedas con CUP como puente", async () => {
    const usdToCup = await exchangeRateService.convert(10, Moneda.USD, Moneda.CUP);
    const usdToEur = await exchangeRateService.convert(10, Moneda.USD, Moneda.EUR);

    expect(usdToCup).toBeCloseTo(5000, 8);
    expect(usdToEur).toBeCloseTo(9.09090909, 6);
  });

  it("devuelve tasas por defecto si la API de ElToque falla", async () => {
    const fallback = await exchangeRateService.fetchFromElToque();
    expect(fallback.USD).toBe(DEFAULT_TASAS_MONEDA.USD);
    expect(fallback.EUR).toBe(DEFAULT_TASAS_MONEDA.EUR);
    expect(fallback.MLC).toBe(DEFAULT_TASAS_MONEDA.MLC);
  });
});

describe("PrecioService", () => {
  it("calcula el precio visual con la moneda del negocio cuando hay conversión automatica", async () => {
    const result = await precioService.calcularPrecioVista({
      montoBase: 1000,
      monedaBase: Moneda.CUP,
      monedaVisualizacion: Moneda.USD,
    });

    expect(result.monedaBase).toBe(Moneda.CUP);
    expect(result.monedaVisualizacion).toBe(Moneda.USD);
    expect(result.montoVisualizacion).toBeCloseTo(2, 8);
  });
});
