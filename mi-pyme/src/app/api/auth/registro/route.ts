import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, username, email, password, rol, provincia, municipio } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Email invalido" }, { status: 400 });
    }

    if (!username || username.trim().length < 3) {
      return NextResponse.json({ success: false, error: "El nombre de usuario debe tener al menos 3 caracteres" }, { status: 400 });
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ success: false, error: "El nombre de usuario solo puede contener letras, numeros y guiones bajos" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "La contrasena debe tener al menos 8 caracteres" }, { status: 400 });
    }

    const rolesValidos = ["CLIENTE", "NEGOCIO", "LOGISTICA"];
    if (!rolesValidos.includes(rol)) {
      return NextResponse.json({ success: false, error: "Rol invalido. No se puede registrar como administrador." }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return NextResponse.json({ success: false, error: "Ya existe un usuario con ese email" }, { status: 409 });
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return NextResponse.json({ success: false, error: "Ya existe un usuario con ese nombre de usuario" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        nombre,
        rol,
        provincia,
        municipio,
      },
    });

    return NextResponse.json(
      { success: true, userId: user.id, user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol } },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Registration API error:", message, err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
