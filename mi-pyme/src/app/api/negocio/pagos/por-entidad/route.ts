import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { getResumenPagosPorEntidadAction } from "@/lib/actions";
import { obtenerNegocioDelUsuario } from "@/lib/actions";
import { BusinessError } from "@/shared/types";

function handleError(err: unknown) {
  if (err instanceof BusinessError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status }
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  console.error("Error in negocio pagos/por-entidad API:", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);

    const negocio = await obtenerNegocioDelUsuario(session.id);
    if (!negocio || !negocio.id) {
      return NextResponse.json(
        { error: "No tienes un negocio asociado" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const desde = searchParams.get("desde") ? new Date(searchParams.get("desde")!) : undefined;
    const hasta = searchParams.get("hasta") ? new Date(searchParams.get("hasta")!) : undefined;

    const result = await getResumenPagosPorEntidadAction(negocio.id, { desde, hasta });

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
