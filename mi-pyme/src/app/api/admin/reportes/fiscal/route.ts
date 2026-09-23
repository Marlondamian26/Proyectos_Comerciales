import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    await requireRole([Rol.ADMIN]);

    const [
      facturas,
      negocios,
      kpiNegocios,
    ] = await Promise.all([
      prisma.factura.findMany({
        where: { estado: { not: "ANULADA" } },
        select: {
          total: true,
          baseImponible: true,
          montoIVA: true,
        },
      }),
      prisma.factura.findMany({
        where: { estado: { not: "ANULADA" } },
        select: {
          negocioId: true,
          usuario: {
            select: { id: true, email: true },
          },
        },
        distinct: ["negocioId"],
      }),
      prisma.negocio.findMany({
        where: {
          facturas: {
            some: { estado: { not: "ANULADA" } },
          },
        },
        select: {
          id: true,
          nombre: true,
          nit: true,
          regimenFiscal: true,
          _count: { select: { facturas: true } },
          facturas: {
            where: { estado: { not: "ANULADA" } },
            select: { total: true },
          },
        },
      }),
    ]);

    const totalFacturado = facturas.reduce(
      (sum: number, f: { total: { toNumber: () => number } | null }) => sum + Number(f?.total ?? 0),
      0
    );
    const totalIVACobrado = facturas.reduce(
      (sum: number, f: { montoIVA: { toNumber: () => number } | null }) => sum + Number(f?.montoIVA ?? 0),
      0
    );
    const totalBaseImponible = facturas.reduce(
      (sum: number, f: { baseImponible: { toNumber: () => number } | null }) => sum + Number(f?.baseImponible ?? 0),
      0
    );
    const facturasEmitidas = facturas.length;
    const numeroFacturas = facturas.length;
    const negociosActivos = negocios.length;

    const negociosConFiscal = kpiNegocios.map((n) => ({
      id: n.id,
      nombre: n.nombre,
      nit: n.nit,
      regimenFiscal: n.regimenFiscal ?? "GENERAL",
      totalFacturado: n.facturas.reduce(
        (sum: number, f: { total: { toNumber: () => number } | null }) => sum + Number(f?.total ?? 0),
        0
      ),
    }));

    const kpi = {
      totalFacturado,
      totalIVACobrado,
      totalIVAPagado: 0,
      totalBaseImponible,
      facturasEmitidas,
      numeroFacturas,
      negociosActivos,
    };

    return NextResponse.json({
      kpi,
      negocios: negociosConFiscal,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      message.includes("denegado") || message.includes("autorizado")
        ? 403
        : 500;
    console.error("Error fetching fiscal report:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
