/**
 * Helper central de permisos para el panel de negocio.
 *
 * Valida que un usuario (identificado por `userId` y `rolActual`) tenga
 * acceso a un negocio. Cobertura de los tres casos:
 *
 *  1. Propietario directo — `negocio.userId === userId`
 *  2. Gestor vía NegocioUsuario (N:N) — TODO migrar en Fase 2, hoy se usan 1:1
 *  3. ADMIN — siempre tiene acceso
 *
 * @throws {BusinessError} con código NO_AUTORIZADO (403) si no autorizado
 * @throws {BusinessError} con código NO_ENCONTRADO (404) si el negocio no existe
 */
import prisma from "@/lib/db/prisma";
import { BusinessError } from "@/shared/types";

export async function assertPertenencia(
  userId: string,
  negocioId: string,
  rolActual?: string
): Promise<void> {
  const negocio = await prisma.negocio.findUnique({
    where: { id: negocioId },
    select: { userId: true },
  });

  if (!negocio) {
    throw new BusinessError(
      "Negocio no encontrado",
      "NO_ENCONTRADO",
      404
    );
  }

  if (rolActual === "ADMIN") {
    return;
  }

  if (!negocio.userId || negocio.userId !== userId) {
    throw new BusinessError(
      "No tienes permiso para acceder a este negocio",
      "NO_AUTORIZADO",
      403
    );
  }
}

export async function assertPropietarioOManager(
  userId: string,
  negocioId: string,
  rolActual?: string
): Promise<void> {
  if (rolActual === "ADMIN") {
    return;
  }

  const negocio = await prisma.negocio.findUnique({
    where: { id: negocioId },
    select: { userId: true },
  });

  if (!negocio) {
    throw new BusinessError("Negocio no encontrado", "NO_ENCONTRADO", 404);
  }

  if (negocio.userId === userId) {
    return;
  }

  // TODO(Fase 2): revisar NegocioUsuario para soporte N:N
  const negocioUsuario = await prisma.negocioUsuario.findFirst({
    where: { negocioId, userId },
  });

  if (!negocioUsuario) {
    throw new BusinessError(
      "No tienes permiso para acceder a este negocio",
      "NO_AUTORIZADO",
      403
    );
  }
}
