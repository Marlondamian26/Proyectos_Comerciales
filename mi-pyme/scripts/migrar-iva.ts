import "dotenv/config";
import { Prisma, PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient();

const IVA_RATE = new Prisma.Decimal("10.00");
const IVA_DIVISOR = new Prisma.Decimal("1.10");
const ZERO = new Prisma.Decimal("0");
const HISTORICAL_IVA_RATE = new Prisma.Decimal("21.00");
const COMPLETED_ORDER_STATE = "completado";
const INVOICE_NUMBER_PATTERN = /^PR-\d{4}-\d{6}$/;

type TransactionClient = Prisma.TransactionClient;

type PendingOrder = {
  id: string;
  total: Prisma.Decimal;
  baseImponibleTotal: Prisma.Decimal;
  montoIVATotal: Prisma.Decimal;
  totalConIVA: Prisma.Decimal;
  costoEnvio: Prisma.Decimal;
  items: Array<{
    id: string;
    cantidad: number;
    precioUnitario: Prisma.Decimal;
    precioUnitarioBase: Prisma.Decimal;
    precioUnitarioConIVA: Prisma.Decimal;
    tasaIVA: Prisma.Decimal;
    tratamientoIVA: "GRAVADO" | "EXENTO" | "NO_SUJETO";
    baseImponible: Prisma.Decimal;
    montoIVA: Prisma.Decimal;
    subtotal: Prisma.Decimal;
  }>;
};

type CompletedOrder = {
  id: string;
  total: Prisma.Decimal;
  baseImponibleTotal: Prisma.Decimal;
  montoIVATotal: Prisma.Decimal;
  totalConIVA: Prisma.Decimal;
  costoEnvio: Prisma.Decimal;
  tasaIVANegocio: Prisma.Decimal;
  items: Array<{
    subtotal: Prisma.Decimal;
    tasaIVA: Prisma.Decimal;
  }>;
};

type CalculatedItem = {
  precioUnitarioBase: Prisma.Decimal;
  precioUnitarioConIVA: Prisma.Decimal;
  tasaIVA: Prisma.Decimal;
  tratamientoIVA: "GRAVADO";
  baseImponible: Prisma.Decimal;
  montoIVA: Prisma.Decimal;
  subtotal: Prisma.Decimal;
};

type FacturaParaNumerar = {
  id: string;
  numero: string;
  negocioId: string | null;
  fecha: Date;
  createdAt: Date;
  pedido: {
    negocioId: string;
    items: Array<{ negocioId: string }>;
  };
};

function toDecimal(value: unknown): Prisma.Decimal {
  if (value === null || value === undefined) {
    return new Prisma.Decimal(0);
  }

  return new Prisma.Decimal(String(value));
}

function redondear(value: Prisma.Decimal): Prisma.Decimal {
  return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

function iguales(left: Prisma.Decimal, right: Prisma.Decimal): boolean {
  return left.equals(right);
}

function calcularItemNoCompletado(item: PendingOrder["items"][number]): CalculatedItem {
  const precioUnitario = toDecimal(item.precioUnitario);
  const cantidad = new Prisma.Decimal(item.cantidad);
  const totalLinea = precioUnitario.mul(cantidad);

  if (item.cantidad <= 0) {
    return {
      precioUnitarioBase: ZERO,
      precioUnitarioConIVA: precioUnitario,
      tasaIVA: IVA_RATE,
      tratamientoIVA: "GRAVADO",
      baseImponible: ZERO,
      montoIVA: ZERO,
      subtotal: ZERO,
    };
  }

  const baseImponible = redondear(totalLinea.div(IVA_DIVISOR));
  const montoIVA = redondear(totalLinea.sub(baseImponible));
  const subtotal = redondear(baseImponible.add(montoIVA));

  return {
    precioUnitarioBase: baseImponible.div(cantidad),
    precioUnitarioConIVA: precioUnitario,
    tasaIVA: IVA_RATE,
    tratamientoIVA: "GRAVADO",
    baseImponible,
    montoIVA,
    subtotal,
  };
}

function calcularTotalesNoCompletado(pedido: PendingOrder) {
  const calculados = pedido.items.map(calcularItemNoCompletado);
  const baseImponibleTotal = calculados.reduce(
    (total, item) => total.add(item.baseImponible),
    new Prisma.Decimal(0)
  );
  const montoIVATotal = calculados.reduce(
    (total, item) => total.add(item.montoIVA),
    new Prisma.Decimal(0)
  );
  const subtotalItems = calculados.reduce(
    (total, item) => total.add(item.subtotal),
    new Prisma.Decimal(0)
  );
  const costoEnvio = redondear(toDecimal(pedido.costoEnvio));
  const totalConIVA = redondear(subtotalItems.add(costoEnvio));

  return { calculados, baseImponibleTotal, montoIVATotal, totalConIVA };
}

function itemSnapshot(item: PendingOrder["items"][number]) {
  return {
    id: item.id,
    precioUnitarioBase: item.precioUnitarioBase.toString(),
    precioUnitarioConIVA: item.precioUnitarioConIVA.toString(),
    tasaIVA: item.tasaIVA.toString(),
    tratamientoIVA: item.tratamientoIVA,
    baseImponible: item.baseImponible.toString(),
    montoIVA: item.montoIVA.toString(),
    subtotal: item.subtotal.toString(),
  };
}

function pedidoSnapshot(pedido: PendingOrder) {
  return {
    total: pedido.total.toString(),
    baseImponibleTotal: pedido.baseImponibleTotal.toString(),
    montoIVATotal: pedido.montoIVATotal.toString(),
    totalConIVA: pedido.totalConIVA.toString(),
    costoEnvio: pedido.costoEnvio.toString(),
  };
}

function pedidoNoCompletadoCambio(
  pedido: PendingOrder,
  calculados: CalculatedItem[],
  baseImponibleTotal: Prisma.Decimal,
  montoIVATotal: Prisma.Decimal,
  totalConIVA: Prisma.Decimal
): boolean {
  if (
    !iguales(pedido.total, totalConIVA) ||
    !iguales(pedido.baseImponibleTotal, baseImponibleTotal) ||
    !iguales(pedido.montoIVATotal, montoIVATotal) ||
    !iguales(pedido.totalConIVA, totalConIVA)
  ) {
    return true;
  }

  return pedido.items.some((item, index) => {
    const calculado = calculados[index];
    return (
      !calculado ||
      item.tratamientoIVA !== "GRAVADO" ||
      !iguales(item.tasaIVA, IVA_RATE) ||
      !iguales(item.precioUnitarioBase, calculado.precioUnitarioBase) ||
      !iguales(item.precioUnitarioConIVA, calculado.precioUnitarioConIVA) ||
      !iguales(item.baseImponible, calculado.baseImponible) ||
      !iguales(item.montoIVA, calculado.montoIVA) ||
      !iguales(item.subtotal, calculado.subtotal)
    );
  });
}

function ordenadaCompletadaConIVA21(pedido: CompletedOrder): boolean {
  if (iguales(pedido.tasaIVANegocio, HISTORICAL_IVA_RATE)) {
    return true;
  }

  if (pedido.items.some((item) => iguales(item.tasaIVA, HISTORICAL_IVA_RATE))) {
    return true;
  }

  const base = toDecimal(pedido.baseImponibleTotal);
  const iva = toDecimal(pedido.montoIVATotal);
  if (base.gt(0) && iva.gt(0)) {
    const tasaImplicita = iva.div(base).mul(100);
    if (tasaImplicita.sub(21).abs().lte(new Prisma.Decimal("0.05"))) {
      return true;
    }
  }

  const subtotalItems = pedido.items.reduce(
    (total, item) => total.add(item.subtotal),
    new Prisma.Decimal(0)
  );
  const ivaImplicito = toDecimal(pedido.total)
    .sub(subtotalItems)
    .sub(toDecimal(pedido.costoEnvio));
  if (subtotalItems.gt(0) && ivaImplicito.gt(0)) {
    const tasaImplicita = ivaImplicito.div(subtotalItems).mul(100);
    return tasaImplicita.sub(21).abs().lte(new Prisma.Decimal("0.05"));
  }

  return false;
}

async function crearLog(
  tx: TransactionClient,
  eventType: string,
  targetId: string | null,
  meta: Record<string, unknown>
) {
  await tx.auditLog.create({
    data: {
      eventType,
      targetId,
      meta: meta as Prisma.InputJsonValue,
    },
  });
}

async function normalizarNegocios() {
  const resultado = await prisma.negocio.updateMany({
    data: {
      regimenFiscal: "GENERAL",
      tasaIVA: IVA_RATE,
      modoPrecio: "IVA_INCLUIDO",
    },
  });

  await crearLog(prisma, "IVA_MIGRATION_BUSINESSES_NORMALIZED", null, {
    count: resultado.count,
    regimenFiscal: "GENERAL",
    tasaIVA: "10.00",
    modoPrecio: "IVA_INCLUIDO",
  });

  return resultado.count;
}

async function normalizarCatalogo() {
  const productos = await prisma.producto.updateMany({
    data: { tratamientoIVA: "GRAVADO" },
  });
  const servicios = await prisma.servicio.updateMany({
    data: { tratamientoIVA: "GRAVADO" },
  });

  await crearLog(prisma, "IVA_MIGRATION_CATALOG_NORMALIZED", null, {
    productos: productos.count,
    servicios: servicios.count,
    tratamientoIVA: "GRAVADO",
  });

  return { productos: productos.count, servicios: servicios.count };
}

async function recalcularPedidosNoCompletados() {
  const pedidos = await prisma.pedido.findMany({
    where: { estado: { not: COMPLETED_ORDER_STATE } },
    select: {
      id: true,
      total: true,
      baseImponibleTotal: true,
      montoIVATotal: true,
      totalConIVA: true,
      costoEnvio: true,
      items: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          cantidad: true,
          precioUnitario: true,
          precioUnitarioBase: true,
          precioUnitarioConIVA: true,
          tasaIVA: true,
          tratamientoIVA: true,
          baseImponible: true,
          montoIVA: true,
          subtotal: true,
        },
      },
    },
    orderBy: { fechaCreacion: "asc" },
  });

  let recalculados = 0;
  let sinCambios = 0;

  for (const pedido of pedidos) {
    const { calculados, baseImponibleTotal, montoIVATotal, totalConIVA } =
      calcularTotalesNoCompletado(pedido);
    const hayCambios = pedidoNoCompletadoCambio(
      pedido,
      calculados,
      baseImponibleTotal,
      montoIVATotal,
      totalConIVA
    );

    if (!hayCambios) {
      sinCambios++;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      for (const item of pedido.items) {
        const index = pedido.items.indexOf(item);
        const snapshot = calculados[index]!;

        await tx.pedidoItem.update({
          where: { id: item.id },
          data: {
            precioUnitarioBase: snapshot.precioUnitarioBase,
            precioUnitarioConIVA: snapshot.precioUnitarioConIVA,
            tasaIVA: IVA_RATE,
            tratamientoIVA: "GRAVADO",
            baseImponible: snapshot.baseImponible,
            montoIVA: snapshot.montoIVA,
            subtotal: snapshot.subtotal,
          },
        });
      }

      await tx.pedido.update({
        where: { id: pedido.id },
        data: {
          total: totalConIVA,
          baseImponibleTotal,
          montoIVATotal,
          totalConIVA,
          modoPrecio: "IVA_INCLUIDO",
          regimenFiscalNegocio: "GENERAL",
          tasaIVANegocio: IVA_RATE,
        },
      });

      await crearLog(tx, "IVA_PEDIDO_RECALCULADO", pedido.id, {
        antes: pedidoSnapshot(pedido),
        despues: {
          total: totalConIVA.toString(),
          baseImponibleTotal: baseImponibleTotal.toString(),
          montoIVATotal: montoIVATotal.toString(),
          totalConIVA: totalConIVA.toString(),
          tasaIVA: "10.00",
          modoPrecio: "IVA_INCLUIDO",
        },
        items: calculados.map((item, index) => ({
          id: pedido.items[index]!.id,
          baseImponible: item.baseImponible.toString(),
          montoIVA: item.montoIVA.toString(),
          subtotal: item.subtotal.toString(),
        })),
      });
    });

    recalculados++;
  }

  return { total: pedidos.length, recalculados, sinCambios };
}

async function contarPedidosCompletados() {
  const pedidos = await prisma.pedido.findMany({
    where: { estado: COMPLETED_ORDER_STATE },
    select: {
      id: true,
      total: true,
      baseImponibleTotal: true,
      montoIVATotal: true,
      totalConIVA: true,
      costoEnvio: true,
      tasaIVANegocio: true,
      items: {
        select: {
          subtotal: true,
          tasaIVA: true,
        },
      },
    },
  });
  const conIVA21 = pedidos.filter(ordenadaCompletadaConIVA21).length;

  await crearLog(prisma, "IVA_PEDIDOS_COMPLETADOS_PRESERVADOS", null, {
    total: pedidos.length,
    conIVA21: conIVA21,
  });

  return { total: pedidos.length, conIVA21 };
}

function numeroFactura(anio: number, consecutivo: number): string {
  return `PR-${anio}-${String(consecutivo).padStart(6, "0")}`;
}

function consecutivoNumeroFactura(numero: string): number | null {
  const coincidencia = /^PR-\d{4}-(\d{6})$/.exec(numero);
  return coincidencia ? Number(coincidencia[1]) : null;
}

function negocioFactura(factura: FacturaParaNumerar): string | null {
  return (
    factura.negocioId ??
    factura.pedido.negocioId ??
    factura.pedido.items[0]?.negocioId ??
    null
  );
}

async function numerarFacturasRetroactivas() {
  const facturas = await prisma.factura.findMany({
    orderBy: [{ fecha: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      numero: true,
      negocioId: true,
      fecha: true,
      createdAt: true,
      pedido: {
        select: {
          negocioId: true,
          items: {
            select: { negocioId: true },
          },
        },
      },
    },
  });

  const usadas = new Set(facturas.map((factura) => factura.numero).filter(Boolean));
  const porNegocio = new Map<string | null, FacturaParaNumerar[]>();

  for (const factura of facturas) {
    const negocioId = negocioFactura(factura);
    const grupo = porNegocio.get(negocioId) ?? [];
    grupo.push(factura);
    porNegocio.set(negocioId, grupo);
  }

  let numeradas = 0;
  let sinNegocio = 0;

  for (const [negocioId, grupo] of porNegocio) {
    if (!negocioId) {
      sinNegocio += grupo.length;
      continue;
    }

    const negocio = await prisma.negocio.findUnique({
      where: { id: negocioId },
      select: { numeroFacturaConsecutivo: true },
    });
    const existentes = grupo
      .map((factura) => consecutivoNumeroFactura(factura.numero))
      .filter((consecutivo): consecutivo is number => consecutivo !== null);
    let siguiente = existentes.length > 0 ? Math.max(...existentes) + 1 : 1;
    let maximo = Math.max(negocio?.numeroFacturaConsecutivo ?? 0, ...existentes);
    let grupoNumeradas = 0;

    await prisma.$transaction(async (tx) => {
      for (const factura of grupo) {
        if (INVOICE_NUMBER_PATTERN.test(factura.numero)) {
          continue;
        }

        let consecutivo = siguiente;
        let nuevoNumero: string;
        do {
          nuevoNumero = numeroFactura(factura.fecha.getFullYear(), consecutivo);
          consecutivo += 1;
        } while (usadas.has(nuevoNumero));

        await tx.factura.update({
          where: { id: factura.id },
          data: { numero: nuevoNumero },
        });
        usadas.add(nuevoNumero);
        siguiente = consecutivo;
        maximo = Math.max(maximo, consecutivo - 1);
        grupoNumeradas++;
        numeradas++;

        await crearLog(tx, "IVA_FACTURA_NUMERADA_RETROACTIVA", factura.id, {
          negocioId,
          numeroAnterior: factura.numero,
          numeroNuevo: nuevoNumero,
          consecutivo: consecutivo - 1,
        });
      }

      if (grupoNumeradas > 0 || (negocio && maximo > negocio.numeroFacturaConsecutivo)) {
        await tx.negocio.update({
          where: { id: negocioId },
          data: { numeroFacturaConsecutivo: maximo },
        });
      }
    });
  }

  await crearLog(prisma, "IVA_FACTURAS_NUMERADAS_RETROACTIVAS", null, {
    numeradas,
    sinNegocio,
    total: facturas.length,
  });

  return { total: facturas.length, numeradas, sinNegocio };
}

async function main() {
  const iniciadoEn = new Date();
  await crearLog(prisma, "IVA_MIGRATION_STARTED", null, {
    iniciadoEn: iniciadoEn.toISOString(),
    tasaIVA: "10.00",
    modoPrecio: "IVA_INCLUIDO",
  });

  const negocios = await normalizarNegocios();
  const catalogo = await normalizarCatalogo();
  const pedidos = await recalcularPedidosNoCompletados();
  const completados = await contarPedidosCompletados();
  const facturas = await numerarFacturasRetroactivas();
  const finalizadoEn = new Date();

  await crearLog(prisma, "IVA_MIGRATION_COMPLETED", null, {
    iniciadoEn: iniciadoEn.toISOString(),
    finalizadoEn: finalizadoEn.toISOString(),
    negocios,
    productosCatalogo: catalogo.productos,
    serviciosCatalogo: catalogo.servicios,
    pedidosNoCompletados: pedidos.total,
    pedidosRecalculados: pedidos.recalculados,
    pedidosSinCambios: pedidos.sinCambios,
    pedidosCompletados: completados.total,
    pedidosCompletadosConIVA21: completados.conIVA21,
    facturas: facturas.total,
    facturasNumeradas: facturas.numeradas,
    facturasSinNegocio: facturas.sinNegocio,
  });

  console.log(
    `Migración IVA completada: ${negocios} negocios, ${catalogo.productos} productos, ${catalogo.servicios} servicios, ${pedidos.recalculados} pedidos recalculados, ${facturas.numeradas} facturas numeradas`
  );
}

main()
  .catch((error: unknown) => {
    console.error("Error en la migración de IVA:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
