import { NextResponse } from "next/server";
import {
  listOpcionesDeNegocioAction,
  crearOpcionLogisticaAction,
  actualizarOpcionLogisticaAction,
  eliminarOpcionLogisticaAction,
  listProveedoresDisponiblesAction,
} from "@/lib/actions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const proveedores = url.searchParams.get("proveedores") === "true";

    if (proveedores) {
      const result = await listProveedoresDisponiblesAction(id);
      return NextResponse.json(result);
    }

    const result = await listOpcionesDeNegocioAction(id);
    return NextResponse.json(result);
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
    const result = await crearOpcionLogisticaAction(id, body);
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
  const { opcionId, ...datos } = await request.json();
  void negocioId;
  try {
    const result = await actualizarOpcionLogisticaAction(opcionId, datos);
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
  const { opcionId } = await request.json();
  void negocioId;
  try {
    await eliminarOpcionLogisticaAction(opcionId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
