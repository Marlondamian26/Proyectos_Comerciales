import bcrypt from "bcryptjs";
import prisma from "@/lib/db/prisma";
import { Rol } from "@/lib/auth/roles";
import { logAudit } from "@/services/utils/audit";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;

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
  fotoPerfilUrl?: string | null;
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
        { deletedAt: null },
      ],
    },
  });

  if (!user) {
    const inactiveUser = await prisma.user.findFirst({
      where: {
        AND: [
          { OR: [{ email: identifier }, { username: identifier }] },
          { OR: [{ isActive: false }, { deletedAt: { not: null } }] },
        ],
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

  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    const remainingMinutes = Math.ceil(
      (user.lockedUntil.getTime() - now.getTime()) / 60_000
    );
    await logAudit("LOGIN_FALLIDO", user.id, user.id, {
      reason: "cuenta_bloqueada",
      remainingMinutes,
    });
    return null;
  }

  if (user.lockedUntil && user.lockedUntil <= now) {
    await prisma.user.updateMany({
      where: {
        id: user.id,
        lockedUntil: { lte: now },
      },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
  }

  const isValid = await bcrypt.compare(credentials.password as string, user.password);
  if (!isValid) {
    const lockResult = await prisma.$transaction(async (tx) => {
      const attempt = await tx.user.updateMany({
        where: {
          id: user.id,
          isActive: true,
          deletedAt: null,
          lockedUntil: null,
        },
        data: {
          failedLoginAttempts: { increment: 1 },
        },
      });

      if (attempt.count === 0) {
        return { blocked: true, attempts: user.failedLoginAttempts };
      }

      const updatedUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { failedLoginAttempts: true },
      });

      const attempts = updatedUser?.failedLoginAttempts ?? user.failedLoginAttempts + 1;
      const blocked = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;
      if (blocked) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            lockedUntil: new Date(Date.now() + LOGIN_LOCK_DURATION_MS),
          },
        });
      }

      return { blocked, attempts };
    });

    await logAudit("LOGIN_FALLIDO", user.id, user.id, {
      reason: "password_incorrecto",
      attempts: lockResult.attempts,
      blocked: lockResult.blocked,
    });
    return null;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  await logAudit("LOGIN_EXITOSO", user.id, user.id, {
    identifier,
    rememberMe: credentials.rememberMe === "true",
  });

  return {
    id: user.id,
    email: user.email,
    name: user.nombre ?? user.name ?? undefined,
    image: user.fotoPerfilUrl ?? user.image ?? null,
    rol: user.rol as Rol,
    mustChangePassword: user.mustChangePassword,
    sessionVersion: user.sessionVersion,
    rememberMe: credentials.rememberMe === "true",
    fotoPerfilUrl: user.fotoPerfilUrl ?? undefined,
  };
}
