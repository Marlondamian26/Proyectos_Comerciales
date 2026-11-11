import { NextResponse } from "next/server";
import { actualizarInventarioAction } from "@/lib/actions";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: negocioId } = await params;
  const { productoId, ...datos } = await request.json();
  void negocioId;
  try {
    const result = await actualizarInventarioAction(productoId, datos);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
