import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { asignarRolAdmin } from "@/lib/actions";
import { logAudit } from "@/services/utils/audit";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.rol !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId es requerido" }, { status: 400 });
    }

    const result = await asignarRolAdmin(userId, session.user.id);

    await logAudit("ROL_CAMBIADO", session.user.id, userId, {});

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    let status = 500;
    if (message.includes("no autorizado") || message.includes("denegado")) status = 403;
    else if (message.includes("no encontrado")) status = 404;
    console.error("Error assigning admin role:", err);
    return NextResponse.json({ error: message }, { status });
  }
}