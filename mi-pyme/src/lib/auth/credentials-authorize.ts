import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import { Rol } from "@/lib/auth/roles";
import { logAudit } from "@/services/utils/audit";

export interface AuthorizeCredentials {
  email?: string;
  password?: string;
  rememberMe?: string;
}

export type AuthorizeResult = {
  id: string;
  email: string | null;
  name?: string | null;
  image?: string | null;
  rol?: Rol;
  mustChangePassword: boolean;
  sessionVersion?: number;
  rememberMe?: boolean;
} | null;

export async function credentialsAuthorize(
  credentials: AuthorizeCredentials | undefined
): Promise<AuthorizeResult> {
  if (!credentials?.email || !credentials?.password) return null;

  const identifier = credentials.email
    ? credentials.email.trim().toLowerCase()
    : "";

  const user = await prisma.user.findFirst({
    where: {
      AND: [
        { OR: [{ email: identifier }, { username: identifier }] },
        { isActive: true },
      ],
    },
  });

  if (!user) {
    const inactiveUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
        isActive: false,
      },
    });

    if (inactiveUser) {
      await logAudit("LOGIN_FALLIDO_USUARIO_INACTIVO", inactiveUser.id, inactiveUser.id, {
        reason: "inactive_user_login_attempt",
        identifier,
      });
    } else {
      await logAudit("LOGIN_FALLIDO", null, null, {
        reason: "credenciales_invalidas",
        identifier,
      });
    }

    return null;
  }

  if (!user.password) {
    await logAudit("LOGIN_FALLIDO", user.id, user.id, {
      reason: "usuario_sin_password",
      identifier,
    });
    return null;
  }

  const isValid = await bcrypt.compare(credentials.password as string, user.password);
  if (!isValid) {
    await logAudit("LOGIN_FALLIDO", user.id, user.id, {
      reason: "password_incorrecto",
      identifier,
    });
    return null;
  }

  await logAudit("LOGIN_EXITOSO", user.id, user.id, {
    identifier,
    rememberMe: credentials.rememberMe === "true",
  });

  return {
    id: user.id,
    email: user.email,
    name: user.nombre ?? user.name,
    image: user.image,
    rol: user.rol as Rol,
    mustChangePassword: user.mustChangePassword,
    sessionVersion: user.sessionVersion,
    rememberMe: credentials.rememberMe === "true",
  };
}
