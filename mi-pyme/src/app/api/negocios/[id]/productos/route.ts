import { NextResponse } from "next/server";
import {
  listarProductos,
  crearProductoAction,
  actualizarProductoAction,
  eliminarProductoAction,
} from "@/lib/actions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productos = await listarProductos({ negocioId: id });
    return NextResponse.json(productos);
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
    const result = await crearProductoAction(id, body);
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
  const { productoId, ...datos } = await request.json();
  void negocioId;
  try {
    const result = await actualizarProductoAction(productoId, datos);
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
  const { productoId } = await request.json();
  void negocioId;
  try {
    await eliminarProductoAction(productoId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
