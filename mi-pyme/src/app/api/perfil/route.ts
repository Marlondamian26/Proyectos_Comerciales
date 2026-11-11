import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { obtenerPerfil, actualizarPerfil, cambiarPassword } from "@/lib/actions";
import { logAudit } from "@/services/utils/audit";

export async function GET() {
  try {
    let session;
    try {
      session = await auth();
    } catch {
      return NextResponse.json({ error: "No se pudo verificar la sesión" }, { status: 401 });
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const perfil = await obtenerPerfil(session.user.id);
    return NextResponse.json(perfil);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("no encontrado") ? 404 : 500;
    console.error("Error fetching perfil:", err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    let session;
    try {
      session = await auth();
    } catch {
      return NextResponse.json({ error: "No se pudo verificar la sesión" }, { status: 401 });
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, username, email, provincia, municipio } = body;

    const perfil = await actualizarPerfil(session.user.id, { nombre, username, email, provincia, municipio });
    return NextResponse.json(perfil);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    let status = 500;
    if (message.includes("no autorizado") || message.includes("denegado")) status = 403;
    else if (message.includes("no encontrado")) status = 404;
    console.error("Error updating perfil:", err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    let session;
    try {
      session = await auth();
    } catch {
      return NextResponse.json({ error: "No se pudo verificar la sesión" }, { status: 401 });
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { passwordActual, passwordNuevo } = body;

    if (!passwordActual || !passwordNuevo) {
      return NextResponse.json({ error: "Contraseña actual y nueva son requeridas" }, { status: 400 });
    }

    const result = await cambiarPassword(session.user.id, { passwordActual, passwordNuevo });

    await logAudit("PASSWORD_CAMBIADO", session.user.id, session.user.id, {});

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    let status = 500;
    if (message.includes("no autorizado") || message.includes("denegado")) status = 403;
    else if (message.includes("incorrecta") || message.includes("caracteres")) status = 400;
    console.error("Error changing password:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
