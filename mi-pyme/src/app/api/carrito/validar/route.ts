import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { BusinessError } from "@/shared/types";
import { validarCarritoAction } from "@/lib/actions";

export async function GET() {
  try {
    const session = await requireRole([Rol.CLIENTE]);
    const result = await validarCarritoAction();
    return NextResponse.json(result);
  } catch (err: unknown) {
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
    console.error("Error validating carrito:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
