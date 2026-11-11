import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { BusinessError } from "@/shared/types";
import {
  getDisponibilidadProductoAction,
  setDisponibilidadAction,
} from "@/lib/actions";

function handleError(err: unknown) {
  if (err instanceof BusinessError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status }
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("denegado") || message.includes("autorizado")) {
    return NextResponse.json({ error: message }, { status: 403 });
  }
  console.error("Disponibilidad API error:", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get("fecha");

    const result = await getDisponibilidadProductoAction(
      id,
      fecha ? new Date(fecha) : undefined
    );
    return NextResponse.json(result);
  } catch (err: unknown) {
    return handleError(err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole([Rol.NEGOCIO, Rol.ADMIN]);
    const { id } = await params;
    const body = await request.json();

    await setDisponibilidadAction(
      id,
      body.fecha,
      body.cantidad,
      body.notas
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }
    return handleError(err);
  }
}
