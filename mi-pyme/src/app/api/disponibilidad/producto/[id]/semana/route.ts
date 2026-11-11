import { NextResponse } from "next/server";
import { getDisponibilidadSemanaAction } from "@/lib/actions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getDisponibilidadSemanaAction(id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error fetching disponibilidad semana:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
