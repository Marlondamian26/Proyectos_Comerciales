/**
 * Helper para registrar auditoría de forma framework-agnostic.
 */
import prisma from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function logAudit(
  eventType: string,
  actorId: string | null,
  targetId: string | null,
  meta?: Record<string, unknown>
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      eventType,
      actorId,
      targetId,
      meta: meta as Prisma.InputJsonValue,
    },
  });
}
