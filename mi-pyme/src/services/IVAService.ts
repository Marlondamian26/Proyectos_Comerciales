import {
  Prisma,
  RegimenFiscal,
  ModoPrecio,
  TratamientoIVA,
} from "@/generated/prisma/client";
import { Service } from "./Service";

export type DecimalValue = Prisma.Decimal | number | string;

export interface NegocioFiscal {
  regimenFiscal?: RegimenFiscal;
  tasaIVA?: DecimalValue;
  modoPrecio?: ModoPrecio;
}

export interface CalcularItemParams {
  precio: DecimalValue;
  cantidad: DecimalValue;
  tratamientoIVA: TratamientoIVA;
  tasaNegocio?: DecimalValue | NegocioFiscal;
  tasaOverride?: DecimalValue | null;
  modoPrecio?: ModoPrecio;
  regimenFiscal?: RegimenFiscal;
  negocio?: NegocioFiscal;
}

export interface GrupoItemInput {
  precio?: DecimalValue;
  precioUnitario?: DecimalValue;
  precioUnitarioConIVA?: DecimalValue;
  cantidad: DecimalValue;
  tratamientoIVA?: TratamientoIVA;
  tasaOverride?: DecimalValue | null;
  modoPrecio?: ModoPrecio;
  regimenFiscal?: RegimenFiscal;
}

export interface GrupoItemCalculado {
  cantidad: DecimalValue;
  tratamientoIVA: TratamientoIVA;
  precioUnitarioBase?: DecimalValue;
  precioUnitarioConIVA?: DecimalValue;
  tasaAplicada?: DecimalValue;
  tasaIVA?: DecimalValue;
  baseImponible: DecimalValue;
  montoIVA: DecimalValue;
  subtotal?: DecimalValue;
  regimenFiscal?: RegimenFiscal;
  modoPrecio?: ModoPrecio;
}

export type GrupoItem = GrupoItemInput | GrupoItemCalculado;

export interface GrupoFiscalInput {
  items?: ReadonlyArray<GrupoItem>;
  negocio?: NegocioFiscal;
  base?: DecimalValue;
  baseImponible?: DecimalValue;
  iva?: DecimalValue;
  montoIVA?: DecimalValue;
  subtotal?: DecimalValue;
  total?: DecimalValue;
  totalConIVA?: DecimalValue;
  tasaIVA?: DecimalValue;
  regimenFiscal?: RegimenFiscal;
  modoPrecio?: ModoPrecio;
}

export interface CalculoItemIVA {
  precioUnitarioBase: Prisma.Decimal;
  precioUnitarioConIVA: Prisma.Decimal;
  tasaAplicada: Prisma.Decimal;
  baseImponible: Prisma.Decimal;
  montoIVA: Prisma.Decimal;
  subtotal: Prisma.Decimal;
  tratamientoIVA: TratamientoIVA;
  regimenFiscal: RegimenFiscal;
  modoPrecio: ModoPrecio;
}

export interface CalculoGrupoIVA {
  baseImponible: Prisma.Decimal;
  montoIVA: Prisma.Decimal;
  totalConIVA: Prisma.Decimal;
  subtotal: Prisma.Decimal;
  iva: Prisma.Decimal;
  total: Prisma.Decimal;
  items: CalculoItemIVA[];
  regimenFiscal: RegimenFiscal;
  modoPrecio: ModoPrecio;
  tasaIVA: Prisma.Decimal;
  base?: Prisma.Decimal;
  negocio?: NegocioFiscal;
}

export interface CalculoCheckoutIVA {
  baseImponible: Prisma.Decimal;
  montoIVA: Prisma.Decimal;
  totalConIVA: Prisma.Decimal;
  subtotal: Prisma.Decimal;
  iva: Prisma.Decimal;
  total: Prisma.Decimal;
  grupos: CalculoGrupoIVA[];
  tasaIVA?: Prisma.Decimal;
}

interface ConfiguracionFiscal {
  regimenFiscal: RegimenFiscal;
  tasaNegocio: Prisma.Decimal;
  modoPrecio: ModoPrecio;
}

interface CalculoItemRaw {
  calculo: CalculoItemIVA;
  baseImponibleRaw: Prisma.Decimal;
  montoIVARaw: Prisma.Decimal;
  totalRaw: Prisma.Decimal;
}

const CERO = new Prisma.Decimal(0);
const UNO = new Prisma.Decimal(1);
const CIENTO = new Prisma.Decimal(100);

export class IVAService extends Service {
  calcularItem(params: CalcularItemParams): CalculoItemIVA {
    return this.calcularItemRaw(params).calculo;
  }

  calcularGrupo(
    items: ReadonlyArray<GrupoItem>,
    negocio: NegocioFiscal = {}
  ): CalculoGrupoIVA {
    const configuracion = this.configuracionFiscal(negocio);
    let baseImponibleRaw = CERO;
    let montoIVARaw = CERO;
    const calculados: CalculoItemIVA[] = [];

    for (const item of items) {
      if (this.esItemCalculado(item)) {
        const base = this.decimal(item.baseImponible);
        const iva = this.decimal(item.montoIVA);
        const subtotal =
          item.subtotal === undefined ? base.add(iva) : this.decimal(item.subtotal);
        baseImponibleRaw = baseImponibleRaw.add(base);
        montoIVARaw = montoIVARaw.add(iva);
        calculados.push(this.itemCalculado(item, configuracion));
        continue;
      }

      const precio =
        item.precio ?? item.precioUnitario ?? item.precioUnitarioConIVA;
      if (precio === undefined) {
        continue;
      }

      const resultado = this.calcularItemRaw({
        precio,
        cantidad: item.cantidad,
        tratamientoIVA: item.tratamientoIVA ?? TratamientoIVA.GRAVADO,
        tasaNegocio: configuracion.tasaNegocio,
        tasaOverride: item.tasaOverride,
        modoPrecio: item.modoPrecio ?? configuracion.modoPrecio,
        regimenFiscal: item.regimenFiscal ?? configuracion.regimenFiscal,
      });
      baseImponibleRaw = baseImponibleRaw.add(resultado.baseImponibleRaw);
      montoIVARaw = montoIVARaw.add(resultado.montoIVARaw);
      calculados.push(resultado.calculo);
    }

    const totalRaw = baseImponibleRaw.add(montoIVARaw);
    const baseImponible = this.redondear(baseImponibleRaw);
    const montoIVA = this.redondear(montoIVARaw);
    const totalConIVA = this.redondear(totalRaw);
    const tasaIVA =
      configuracion.regimenFiscal === RegimenFiscal.GENERAL
        ? this.redondear(configuracion.tasaNegocio)
        : CERO;

    return {
      baseImponible,
      montoIVA,
      totalConIVA,
      subtotal: baseImponible,
      iva: montoIVA,
      total: totalConIVA,
      items: calculados,
      regimenFiscal: configuracion.regimenFiscal,
      modoPrecio: configuracion.modoPrecio,
      tasaIVA,
    };
  }

  calcularCheckout(
    grupos: ReadonlyArray<CalculoGrupoIVA | GrupoFiscalInput>
  ): CalculoCheckoutIVA {
    let baseImponibleRaw = CERO;
    let montoIVARaw = CERO;
    const calculados: CalculoGrupoIVA[] = [];

    for (const grupo of grupos) {
      // CalculoGrupoIVA always has tasaIVA as a required field
      if ('tasaIVA' in grupo) {
        const calcGrupo = grupo as CalculoGrupoIVA;
        baseImponibleRaw = baseImponibleRaw.add(calcGrupo.baseImponible);
        montoIVARaw = montoIVARaw.add(calcGrupo.montoIVA);
        calculados.push(calcGrupo);
        continue;
      }

      // GrupoFiscalInput
      const input = grupo as GrupoFiscalInput;
      const baseExplicita = input.base ?? input.baseImponible;
      const ivaExplicita = input.montoIVA ?? input.iva;
      const totalExplicito = input.totalConIVA ?? input.total;

      if (baseExplicita !== undefined || ivaExplicita !== undefined || totalExplicito !== undefined) {
        const base = baseExplicita === undefined ? CERO : this.decimal(baseExplicita);
        const iva = ivaExplicita === undefined ? CERO : this.decimal(ivaExplicita);
        const total =
          totalExplicito === undefined
            ? base.add(iva)
            : this.decimal(totalExplicito);
        baseImponibleRaw = baseImponibleRaw.add(base);
        montoIVARaw = montoIVARaw.add(iva);
        const regimen = input.negocio?.regimenFiscal ?? RegimenFiscal.GENERAL;
        const modo = input.negocio?.modoPrecio ?? ModoPrecio.IVA_INCLUIDO;
        const tasa = input.negocio?.tasaIVA ?? 10;
        calculados.push({
          baseImponible: this.redondear(base),
          montoIVA: this.redondear(iva),
          totalConIVA: this.redondear(total),
          subtotal: this.redondear(base),
          iva: this.redondear(iva),
          total: this.redondear(total),
          items: [],
          regimenFiscal: regimen,
          modoPrecio: modo,
          tasaIVA: regimen === RegimenFiscal.GENERAL ? this.redondear(tasa) : CERO,
        });
        continue;
      }

      const calculo = this.calcularGrupo(input.items ?? [], input.negocio);
      baseImponibleRaw = baseImponibleRaw.add(calculo.baseImponible);
      montoIVARaw = montoIVARaw.add(calculo.montoIVA);
      calculados.push(calculo);
    }

    const totalRaw = baseImponibleRaw.add(montoIVARaw);
    const baseImponible = this.redondear(baseImponibleRaw);
    const montoIVA = this.redondear(montoIVARaw);
    const totalConIVA = this.redondear(totalRaw);

    return {
      baseImponible,
      montoIVA,
      totalConIVA,
      subtotal: baseImponible,
      iva: montoIVA,
      total: totalConIVA,
      grupos: calculados,
      tasaIVA: calculados[0]?.tasaIVA,
    };
  }

  formatearNumeroFactura(
    negocio:
      | { prefijoFactura?: string; codigoFactura?: string; nit?: string }
      | string
      | null
      | undefined,
    anio: number | string,
    consecutivo: number | string
  ): string {
    const objeto =
      typeof negocio === "object" && negocio !== null ? negocio : {};
    const prefijo =
      objeto.prefijoFactura ?? objeto.codigoFactura ?? "PR";
    const ano = String(anio).padStart(4, "0");
    const numero = String(consecutivo).padStart(6, "0");
    return `${prefijo}-${ano}-${numero}`;
  }

  private calcularItemRaw(params: CalcularItemParams): CalculoItemRaw {
    const configuracion = this.configuracionFiscal({
      regimenFiscal: params.regimenFiscal,
      tasaIVA: this.tasaNegocio(params),
      modoPrecio: params.modoPrecio,
      ...this.negocio(params),
    });
    const precio = this.decimal(params.precio);
    const cantidad = this.decimal(params.cantidad);
    const gravado =
      params.tratamientoIVA === TratamientoIVA.GRAVADO &&
      configuracion.regimenFiscal === RegimenFiscal.GENERAL;
    const tasaAplicadaRaw = gravado
      ? this.tasaConOverride(params, configuracion)
      : CERO;
    const factor = UNO.add(tasaAplicadaRaw.div(CIENTO));
    let precioUnitarioBaseRaw: Prisma.Decimal;
    let montoIVARawUnitario: Prisma.Decimal;
    let precioUnitarioConIVARaw: Prisma.Decimal;

    if (configuracion.modoPrecio === ModoPrecio.IVA_AGREGADO) {
      precioUnitarioBaseRaw = precio;
      montoIVARawUnitario = precio.mul(tasaAplicadaRaw.div(CIENTO));
      precioUnitarioConIVARaw = precioUnitarioBaseRaw.add(montoIVARawUnitario);
    } else {
      precioUnitarioBaseRaw = precio.div(factor);
      montoIVARawUnitario = precio.sub(precioUnitarioBaseRaw);
      precioUnitarioConIVARaw = precio;
    }

    const baseImponibleRaw = precioUnitarioBaseRaw.mul(cantidad);
    const montoIVARaw = montoIVARawUnitario.mul(cantidad);
    const totalRaw = baseImponibleRaw.add(montoIVARaw);
    const calculo: CalculoItemIVA = {
      precioUnitarioBase: this.redondear(precioUnitarioBaseRaw),
      precioUnitarioConIVA: this.redondear(precioUnitarioConIVARaw),
      tasaAplicada: this.redondear(tasaAplicadaRaw),
      baseImponible: this.redondear(baseImponibleRaw),
      montoIVA: this.redondear(montoIVARaw),
      subtotal: this.redondear(totalRaw),
      tratamientoIVA: params.tratamientoIVA,
      regimenFiscal: configuracion.regimenFiscal,
      modoPrecio: configuracion.modoPrecio,
    };

    return { calculo, baseImponibleRaw, montoIVARaw, totalRaw };
  }

  private configuracionFiscal(negocio: NegocioFiscal = {}): ConfiguracionFiscal {
    return {
      regimenFiscal: negocio.regimenFiscal ?? RegimenFiscal.GENERAL,
      tasaNegocio:
        negocio.tasaIVA === undefined
          ? new Prisma.Decimal(10)
          : this.decimal(negocio.tasaIVA),
      modoPrecio: negocio.modoPrecio ?? ModoPrecio.IVA_INCLUIDO,
    };
  }

  private negocio(params: CalcularItemParams): NegocioFiscal {
    if (params.negocio) {
      return params.negocio;
    }
    return this.esNegocioFiscal(params.tasaNegocio)
      ? params.tasaNegocio
      : {};
  }

  private tasaNegocio(params: CalcularItemParams): DecimalValue {
    if (this.esNegocioFiscal(params.tasaNegocio)) {
      return params.tasaNegocio.tasaIVA ?? 10;
    }
    if (params.negocio?.tasaIVA !== undefined) {
      return params.negocio.tasaIVA;
    }
    return params.tasaNegocio ?? 10;
  }

  private tasaConOverride(
    params: CalcularItemParams,
    configuracion: ConfiguracionFiscal
  ): Prisma.Decimal {
    if (params.tasaOverride !== undefined && params.tasaOverride !== null) {
      return this.decimal(params.tasaOverride);
    }
    return configuracion.tasaNegocio;
  }

  private esItemCalculado(item: GrupoItem): item is GrupoItemCalculado {
    return "baseImponible" in item && "montoIVA" in item;
  }

  private esNegocioFiscal(
    valor: DecimalValue | NegocioFiscal | undefined
  ): valor is NegocioFiscal {
    return typeof valor === "object" && valor !== null && "tasaIVA" in valor;
  }

  private itemCalculado(
    item: GrupoItemCalculado,
    configuracion: ConfiguracionFiscal
  ): CalculoItemIVA {
    const cantidad = this.decimal(item.cantidad);
    const baseImponible = this.decimal(item.baseImponible);
    const montoIVA = this.decimal(item.montoIVA);
    const subtotal =
      item.subtotal === undefined
        ? baseImponible.add(montoIVA)
        : this.decimal(item.subtotal);
    const precioUnitarioBase =
      item.precioUnitarioBase === undefined
        ? baseImponible.div(cantidad)
        : this.decimal(item.precioUnitarioBase);
    const precioUnitarioConIVA =
      item.precioUnitarioConIVA === undefined
        ? subtotal.div(cantidad)
        : this.decimal(item.precioUnitarioConIVA);

    return {
      precioUnitarioBase: this.redondear(precioUnitarioBase),
      precioUnitarioConIVA: this.redondear(precioUnitarioConIVA),
      tasaAplicada: this.redondear(item.tasaAplicada ?? item.tasaIVA ?? CERO),
      baseImponible: this.redondear(baseImponible),
      montoIVA: this.redondear(montoIVA),
      subtotal: this.redondear(subtotal),
      tratamientoIVA: item.tratamientoIVA,
      regimenFiscal: item.regimenFiscal ?? configuracion.regimenFiscal,
      modoPrecio: item.modoPrecio ?? configuracion.modoPrecio,
    };
  }

  private decimal(valor: DecimalValue): Prisma.Decimal {
    return new Prisma.Decimal(valor);
  }

  private redondear(valor: DecimalValue): Prisma.Decimal {
    return this.decimal(valor).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
  }
}

export default IVAService;
