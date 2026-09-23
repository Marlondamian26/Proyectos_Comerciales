import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { prepararCheckoutAction } from "@/lib/actions";
import { BusinessError } from "@/shared/types";

function handleError(err: unknown) {
  if (err instanceof BusinessError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status }
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  console.error("Error preparing checkout:", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    await requireRole([Rol.CLIENTE, Rol.ADMIN]);

    const body = await request.json();
    const result = await prepararCheckoutAction(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    return handleError(err);
  }
}
