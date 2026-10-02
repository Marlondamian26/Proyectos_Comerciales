import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { BusinessError } from "@/shared/types";
import { contarNoLeidasAction } from "@/lib/actions";

function handleError(err: unknown) {
  if (err instanceof BusinessError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status }
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  console.error("Error in no-leidas API:", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET() {
  try {
    await requireRole([Rol.ADMIN, Rol.CLIENTE, Rol.NEGOCIO, Rol.LOGISTICA]);
    return NextResponse.json(await contarNoLeidasAction());
  } catch (err: unknown) {
    return handleError(err);
  }
}
