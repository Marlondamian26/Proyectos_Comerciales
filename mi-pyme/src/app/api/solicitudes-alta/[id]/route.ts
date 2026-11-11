import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import {
  cancelarSolicitudAltaAction,
  aprobarNegocioAction,
  rechazarNegocioAction,
} from "@/lib/actions";

const solicitudService = new (await import("@/services/SolicitudAltaService")).SolicitudAltaService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireRole([Rol.ADMIN]);
  const solicitud = await solicitudService.getSolicitud(
    id,
    session.id,
    session.rol
  );
    if (!solicitud) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }
    return NextResponse.json(solicitud);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { accion, motivo } = body;

  try {
    if (accion === "aprobar") {
      const result = await aprobarNegocioAction(id);
      return NextResponse.json(result);
    } else if (accion === "rechazar") {
      if (!motivo || motivo.trim().length < 5) {
        return NextResponse.json(
          { error: "El motivo de rechazo es obligatorio (mínimo 5 caracteres)" },
          { status: 400 }
        );
      }
      const result = await rechazarNegocioAction(id, motivo);
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await cancelarSolicitudAltaAction(id);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
