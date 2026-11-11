import { NextResponse } from "next/server";
import {
  listarServicios,
  crearServicioAction,
  actualizarServicioAction,
  eliminarServicioAction,
} from "@/lib/actions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const servicios = await listarServicios({ negocioId: id });
    return NextResponse.json(servicios);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await crearServicioAction(id, body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: negocioId } = await params;
  const { servicioId, ...datos } = await request.json();
  void negocioId;
  try {
    const result = await actualizarServicioAction(servicioId, datos);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: negocioId } = await params;
  const { servicioId } = await request.json();
  void negocioId;
  try {
    await eliminarServicioAction(servicioId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
