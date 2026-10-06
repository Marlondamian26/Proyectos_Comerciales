/**
 * Seed de producción para Mi-Pyme.
 *
 * Este script crea SOLO el admin genérico. No crea datos de ejemplo.
 * Es idempotente: si el admin ya existe, no hace nada.
 *
 * Ejecutar:
 *   npx tsx scripts/seed-prod.ts
 */
import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

const ADMIN_EMAIL = "admin@mi-pyme.local";
const ADMIN_USERNAME = "admin";
const ADMIN_NAME = "Administrador Genérico";
const ADMIN_PASSWORD = process.env.GENERIC_ADMIN_PASSWORD || "12345678";

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    console.log(`Admin ya existe (id: ${existing.id}, email: ${existing.email}). No se crea.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

  await prisma.user.create({
    data: {
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      nombre: ADMIN_NAME,
      password: hashedPassword,
      rol: "ADMIN",
      isGenericAdmin: true,
      mustChangePassword: true,
      isActive: true,
    },
  });

  console.log(`Admin genérico creado (email: ${ADMIN_EMAIL}, username: ${ADMIN_USERNAME}).`);
  console.log("IMPORTANTE: El admin debe cambiar la contraseña en el primer login.");
}

main()
  .catch((e) => {
    console.error("Error en seed-prod:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
