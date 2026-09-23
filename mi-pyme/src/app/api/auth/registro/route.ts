import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "@/lib/auth/constants";
import { validarPassword } from "@/lib/auth/password-policy";
import { logAudit } from "@/services/utils/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, username, email, password, provincia, municipio } = body;

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedUsername = username?.trim().toLowerCase();

    if (!normalizedEmail || !normalizedUsername || !password) {
      return NextResponse.json({ success: false, error: "Email, usuario y contrasena son requeridos" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ success: false, error: "Email invalido" }, { status: 400 });
    }

    if (normalizedUsername.length < 3) {
      return NextResponse.json({ success: false, error: "El nombre de usuario debe tener al menos 3 caracteres" }, { status: 400 });
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(normalizedUsername)) {
      return NextResponse.json({ success: false, error: "El nombre de usuario solo puede contener letras, numeros y guiones bajos" }, { status: 400 });
    }

    const passwordValidation = validarPassword(password);
    if (!passwordValidation.valida) {
      return NextResponse.json({ success: false, error: passwordValidation.errores.join("; ") }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      return NextResponse.json({ success: false, error: "Ya existe un usuario con ese email" }, { status: 409 });
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });
    if (existingUsername) {
      return NextResponse.json({ success: false, error: "Ya existe un usuario con ese nombre de usuario" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        password: hashedPassword,
        nombre,
        rol: "CLIENTE",
        provincia,
        municipio,
      },
    });

    await logAudit("REGISTRO_USUARIO", null, user.id, {
      email: user.email,
      username: user.username,
      rol: "CLIENTE",
      nombre: user.nombre,
      provincia,
      municipio,
    });

    return NextResponse.json(
      { success: true, userId: user.id, user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol } },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Ya existe un usuario")) {
      await logAudit("REGISTRO_FALLIDO", null, null, { reason: "duplicado", error: message });
    }
    console.error("Registration API error:", message, err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
