import prisma from "@/lib/db/prisma";

export async function actualizarLastLogin(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  } catch (error) {
    console.error("[AUTH] Error actualizando lastLoginAt:", error);
  }
}
