import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import {
  verificarIdTransferenciaAction,
  buscarPagoPorIdTransferenciaAction,
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
  console.error("Error in pagos/verificar-id API:", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
    const url = new URL(request.url);
    const idTransferencia = url.searchParams.get("idTransferencia");

    if (!idTransferencia) {
      return NextResponse.json(
        { error: "idTransferencia es requerido" },
        { status: 400 }
      );
    }

    const result = await verificarIdTransferenciaAction(idTransferencia);

    if (result && typeof result === "object" && "error" in result) {
      return NextResponse.json(
        { error: result.error, code: result.codigo },
        { status: result.statusCode }
      );
    }

    if (!result.existe) {
      return NextResponse.json({ disponible: true });
    }

    const pagoResult = await buscarPagoPorIdTransferenciaAction(idTransferencia);

    if (pagoResult && typeof pagoResult === "object" && "error" in pagoResult) {
      return NextResponse.json(
        { error: pagoResult.error, code: pagoResult.codigo },
        { status: pagoResult.statusCode }
      );
    }

    return NextResponse.json({
      existe: true,
      disponible: false,
      pago: pagoResult,
    });
  } catch (err: unknown) {
    return handleError(err);
  }
}
