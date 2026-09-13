import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ensureGenericAdminExists } from "@/lib/actions";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.rol !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    await ensureGenericAdminExists(session.user.id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    let status = 500;
    if (message.includes("no autorizado") || message.includes("denegado")) status = 403;
    console.error("Error creating generic admin:", err);
    return NextResponse.json({ error: message }, { status });
  }
}