import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { BusinessError } from "@/shared/types";
import type { TipoNotificacion, EstadoNotificacion } from "@/generated/prisma/client";
import {
  listarNotificacionesAction,
  marcarTodasLeidasAction,
} from "@/lib/actions";

function handleError(err: unknown) {
  if (err instanceof BusinessError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status }
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  console.error("Error in notificaciones API:", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    await requireRole([Rol.ADMIN, Rol.CLIENTE, Rol.NEGOCIO, Rol.LOGISTICA]);
    const url = new URL(request.url);

    const tipo = url.searchParams.get("tipo")?.split(",");
    const estado = url.searchParams.get("estado")?.split(",");
    const page = url.searchParams.get("page") ? Number(url.searchParams.get("page")) : undefined;
    const limit = url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined;

    const result = await listarNotificacionesAction({
      tipo: tipo as TipoNotificacion[] | undefined,
      estado: estado as EstadoNotificacion[] | undefined,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([Rol.ADMIN, Rol.CLIENTE, Rol.NEGOCIO, Rol.LOGISTICA]);
    const url = new URL(request.url);
    const accion = url.searchParams.get("accion");

    if (accion === "leer-todas") {
      const result = await marcarTodasLeidasAction();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err: unknown) {
    return handleError(err);
  }
}
