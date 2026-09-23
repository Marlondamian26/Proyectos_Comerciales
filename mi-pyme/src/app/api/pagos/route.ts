import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import {
  listPagosDeUsuarioAction,
  crearPagoAction,
} from "@/lib/actions";
import { BusinessError } from "@/shared/types";

function handleError(err: unknown) {
  if (err instanceof BusinessError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status }
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  console.error("Error in pagos API:", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    await requireRole([Rol.CLIENTE, Rol.ADMIN]);
    const url = new URL(request.url);
    const pedidoId = url.searchParams.get("pedidoId");

    if (pedidoId) {
      const { getPagoDePedidoAction } = await import("@/lib/actions");
      const result = await getPagoDePedidoAction(pedidoId);

      if (result && typeof result === "object" && "error" in result) {
        return NextResponse.json(
          { error: result.error, code: result.codigo },
          { status: result.statusCode }
        );
      }

      return NextResponse.json(result);
    }

    const estado = url.searchParams.get("estado")?.split(",") ?? undefined;
    const metodo = url.searchParams.get("metodo")?.split(",") ?? undefined;
    const entidadPago = url.searchParams.get("entidadPago")?.split(",") ?? undefined;
    const idTransferencia = url.searchParams.get("idTransferencia") ?? undefined;
    const page = url.searchParams.get("page") ? Number(url.searchParams.get("page")) : undefined;
    const limit = url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined;

    const result = await listPagosDeUsuarioAction({ estado, metodo, entidadPago, idTransferencia, page, limit });

    if (result && typeof result === "object" && "error" in result) {
      return NextResponse.json(
        { error: result.error, code: result.codigo },
        { status: result.statusCode }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([Rol.CLIENTE, Rol.ADMIN]);
    const body = await request.json();

    const result = await crearPagoAction(
      body.pedidoId,
      body.metodoPago ?? body.metodo,
      body.datosPago ?? body
    );

    if (result && typeof result === "object" && "error" in result) {
      return NextResponse.json(
        { error: result.error, code: result.codigo },
        { status: result.statusCode }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    return handleError(err);
  }
}
