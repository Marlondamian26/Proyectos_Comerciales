import { describe, expect, it } from "vitest";
import {
  Prisma,
  RegimenFiscal,
  ModoPrecio,
  TratamientoIVA,
} from "@/generated/prisma/client";
import { IVAService } from "@/services/IVAService";

const service = new IVAService();
const decimal = (value: string | number | Prisma.Decimal) =>
  new Prisma.Decimal(value);

const fmt = (d: Prisma.Decimal) => d.toFixed(2);

describe("IVAService", () => {
  it("calcula un item con IVA incluido y tasa del 10%", () => {
    const result = service.calcularItem({
      precio: decimal("110"),
      cantidad: 1,
      tratamientoIVA: TratamientoIVA.GRAVADO,
      tasaNegocio: decimal("10"),
      modoPrecio: ModoPrecio.IVA_INCLUIDO,
    });

    expect(fmt(result.precioUnitarioBase)).toBe("100.00");
    expect(fmt(result.precioUnitarioConIVA)).toBe("110.00");
    expect(fmt(result.tasaAplicada)).toBe("10.00");
    expect(fmt(result.baseImponible)).toBe("100.00");
    expect(fmt(result.montoIVA)).toBe("10.00");
    expect(fmt(result.subtotal)).toBe("110.00");
  });

  it("calcula un item con IVA agregado y tasa del 10%", () => {
    const result = service.calcularItem({
      precio: decimal("100"),
      cantidad: 1,
      tratamientoIVA: TratamientoIVA.GRAVADO,
      tasaNegocio: "10",
      modoPrecio: ModoPrecio.IVA_AGREGADO,
    });

    expect(fmt(result.precioUnitarioBase)).toBe("100.00");
    expect(fmt(result.precioUnitarioConIVA)).toBe("110.00");
    expect(fmt(result.tasaAplicada)).toBe("10.00");
    expect(fmt(result.baseImponible)).toBe("100.00");
    expect(fmt(result.montoIVA)).toBe("10.00");
    expect(fmt(result.subtotal)).toBe("110.00");
  });

  it("mantiene el precio sin IVA para un item EXENTO", () => {
    const result = service.calcularItem({
      precio: "123.45",
      cantidad: 2,
      tratamientoIVA: TratamientoIVA.EXENTO,
      tasaNegocio: "10",
      modoPrecio: ModoPrecio.IVA_INCLUIDO,
    });

    expect(result.tratamientoIVA).toBe(TratamientoIVA.EXENTO);
    expect(fmt(result.tasaAplicada)).toBe("0.00");
    expect(fmt(result.precioUnitarioBase)).toBe("123.45");
    expect(fmt(result.precioUnitarioConIVA)).toBe("123.45");
    expect(fmt(result.baseImponible)).toBe("246.90");
    expect(fmt(result.montoIVA)).toBe("0.00");
    expect(fmt(result.subtotal)).toBe("246.90");
  });

  it("distingue un item NO_SUJETO y no le aplica IVA", () => {
    const result = service.calcularItem({
      precio: "50",
      cantidad: 3,
      tratamientoIVA: TratamientoIVA.NO_SUJETO,
      tasaNegocio: "10",
      modoPrecio: ModoPrecio.IVA_AGREGADO,
    });

    expect(result.tratamientoIVA).toBe(TratamientoIVA.NO_SUJETO);
    expect(fmt(result.tasaAplicada)).toBe("0.00");
    expect(fmt(result.baseImponible)).toBe("150.00");
    expect(fmt(result.montoIVA)).toBe("0.00");
    expect(fmt(result.subtotal)).toBe("150.00");
  });

  it("anula la tasa de un item gravado en un regimen SIMPLIFICADO", () => {
    const result = service.calcularItem({
      precio: "110",
      cantidad: 1,
      tratamientoIVA: TratamientoIVA.GRAVADO,
      tasaNegocio: "10",
      regimenFiscal: RegimenFiscal.SIMPLIFICADO,
      modoPrecio: ModoPrecio.IVA_INCLUIDO,
    });

    expect(fmt(result.tasaAplicada)).toBe("0.00");
    expect(fmt(result.baseImponible)).toBe("110.00");
    expect(fmt(result.montoIVA)).toBe("0.00");
    expect(fmt(result.subtotal)).toBe("110.00");
  });

  it("usa tasaIVAOverride para un item gravado", () => {
    const result = service.calcularItem({
      precio: "105",
      cantidad: 1,
      tratamientoIVA: TratamientoIVA.GRAVADO,
      tasaNegocio: "10",
      tasaOverride: "5",
      modoPrecio: ModoPrecio.IVA_INCLUIDO,
    });

    expect(fmt(result.tasaAplicada)).toBe("5.00");
    expect(fmt(result.precioUnitarioBase)).toBe("100.00");
    expect(fmt(result.montoIVA)).toBe("5.00");
    expect(fmt(result.subtotal)).toBe("105.00");
  });

  it("redondea solo el resultado final con ROUND_HALF_UP", () => {
    const result = service.calcularItem({
      precio: "0.05",
      cantidad: 1,
      tratamientoIVA: TratamientoIVA.GRAVADO,
      tasaNegocio: "10",
      modoPrecio: ModoPrecio.IVA_AGREGADO,
    });

    expect(fmt(result.precioUnitarioBase)).toBe("0.05");
    expect(fmt(result.montoIVA)).toBe("0.01");
    expect(fmt(result.subtotal)).toBe("0.06");
  });

  it("suma los items de un grupo sin redondear sus pasos intermedios", () => {
    const result = service.calcularGrupo(
      [
        {
          precio: "110",
          cantidad: 1,
          tratamientoIVA: TratamientoIVA.GRAVADO,
        },
        {
          precio: "55",
          cantidad: 2,
          tratamientoIVA: TratamientoIVA.GRAVADO,
        },
      ],
      {
        regimenFiscal: RegimenFiscal.GENERAL,
        tasaIVA: "10",
        modoPrecio: ModoPrecio.IVA_INCLUIDO,
      }
    );

    expect(fmt(result.baseImponible)).toBe("200.00");
    expect(fmt(result.montoIVA)).toBe("20.00");
    expect(fmt(result.totalConIVA)).toBe("220.00");
    expect(result.items).toHaveLength(2);
  });

  it("calcula un checkout con grupos de regimenes distintos", () => {
    const gravado = service.calcularGrupo(
      [{ precio: "110", cantidad: 1, tratamientoIVA: TratamientoIVA.GRAVADO }],
      {
        regimenFiscal: RegimenFiscal.GENERAL,
        tasaIVA: "10",
        modoPrecio: ModoPrecio.IVA_INCLUIDO,
      }
    );
    const exento = service.calcularGrupo(
      [{ precio: "25", cantidad: 2, tratamientoIVA: TratamientoIVA.EXENTO }],
      {
        regimenFiscal: RegimenFiscal.EXENTO,
        tasaIVA: "10",
        modoPrecio: ModoPrecio.IVA_INCLUIDO,
      }
    );

    const result = service.calcularCheckout([gravado, exento]);

    expect(fmt(result.baseImponible)).toBe("150.00");
    expect(fmt(result.montoIVA)).toBe("10.00");
    expect(fmt(result.totalConIVA)).toBe("160.00");
    expect(result.grupos).toHaveLength(2);
  });

  it("formatea el numero consecutivo de factura", () => {
    expect(service.formatearNumeroFactura({ nit: "123" }, 2026, 123)).toBe(
      "PR-2026-000123"
    );
    expect(service.formatearNumeroFactura("PR", "2026", 7)).toBe(
      "PR-2026-000007"
    );
  });
});
