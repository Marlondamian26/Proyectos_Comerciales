import { NextResponse } from "next/server";
import { getOpcionesLogisticaAction } from "@/lib/actions";
import { BusinessError } from "@/shared/types";

function handleError(err: unknown) {
  if (err instanceof BusinessError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status }
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  console.error("Error fetching opciones logistica:", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const opciones = await getOpcionesLogisticaAction(id);
    return NextResponse.json(opciones);
  } catch (err: unknown) {
    return handleError(err);
  }
}
