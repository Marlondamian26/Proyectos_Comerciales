import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eliminarCuenta, eliminarUltimoAdmin } from "@/lib/actions";

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, password, adminPassword, genericAdminPassword } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId es requerido" }, { status: 400 });
    }

    if (session.user.id !== userId) {
      return NextResponse.json({ error: "No puedes eliminar la cuenta de otro usuario" }, { status: 403 });
    }

    const isLastAdmin = session.user.rol === "ADMIN";

    if (isLastAdmin && adminPassword && genericAdminPassword) {
      const result = await eliminarUltimoAdmin(userId, { adminPassword, genericAdminPassword });
      return NextResponse.json(result);
    }

    if (!password) {
      return NextResponse.json({ error: "Contraseña requerida" }, { status: 400 });
    }

    const result = await eliminarCuenta(userId, { password });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    let status = 500;
    if (message.includes("no autorizado") || message.includes("denegado")) status = 403;
    else if (message.includes("incorrecta") || message.includes("requerida")) status = 400;
    else if (message.includes("no encontrado")) status = 404;
    console.error("Error deleting user:", err);
    return NextResponse.json({ error: message }, { status });
  }
}