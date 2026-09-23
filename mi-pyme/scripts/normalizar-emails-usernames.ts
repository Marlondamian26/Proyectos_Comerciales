/**
 * Script manual para normalizar emails y usernames a lowercase.
 *
 * Ejecutar con: npx tsx scripts/normalizar-emails-usernames.ts
 *
 * Este script NO corre durante la migración de Prisma. Se ejecuta manualmente
 * porque puede haber colisiones (dos usuarios que, tras normalizar a lowercase,
 * tendrían el mismo email o username). En caso de colisión, el script se detiene
 * y reporta los casos para resolución manual del administrador.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

async function main() {
  console.log("Escaneando usuarios con email o username no normalizados...\n");

  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, username: true },
  });

  const needingFix = allUsers.filter((u) => {
    return (
      (u.email !== null && u.email !== u.email.toLowerCase()) ||
      (u.username !== null && u.username !== u.username.toLowerCase())
    );
  });

  if (needingFix.length === 0) {
    console.log("Todos los emails y usernames ya estan en lowercase. No se requiere accion.");
    return;
  }

  console.log(`Se encontraron ${needingFix.length} usuarios con email o username no normalizados.`);

  const allEmails = new Map<string, string[]>();
  const allUsernames = new Map<string, string[]>();

  for (const u of allUsers) {
    if (u.email) {
      const lower = u.email.toLowerCase();
      if (!allEmails.has(lower)) allEmails.set(lower, []);
      allEmails.get(lower)!.push(u.id);
    }
    if (u.username) {
      const lower = u.username.toLowerCase();
      if (!allUsernames.has(lower)) allUsernames.set(lower, []);
      allUsernames.get(lower)!.push(u.id);
    }
  }

  const emailCollisions = [...allEmails.entries()].filter(([key, ids]) => key && ids.length > 1);
  const usernameCollisions = [...allUsernames.entries()].filter(([key, ids]) => key && ids.length > 1);

  if (emailCollisions.length > 0 || usernameCollisions.length > 0) {
    console.error("DETENIDO: Se detectaron colisiones tras normalizar a lowercase.\n");

    if (emailCollisions.length > 0) {
      console.error("Colisiones de email:");
      for (const [email, ids] of emailCollisions) {
        console.error(`  - "${email}" -> IDs: ${ids.join(", ")}`);
      }
      console.error("");
    }

    if (usernameCollisions.length > 0) {
      console.error("Colisiones de username:");
      for (const [username, ids] of usernameCollisions) {
        console.error(`  - "${username}" -> IDs: ${ids.join(", ")}`);
      }
      console.error("");
    }

    console.error("Resuelve las colisiones manualmente antes de ejecutar este script nuevamente.");
    process.exit(1);
  }

  console.log("No se detectaron colisiones. Proceediendo con la normalizacion.\n");

  let count = 0;

  for (const u of needingFix) {
    const data: { email?: string; username?: string } = {};

    if (u.email && u.email !== u.email.toLowerCase()) {
      data.email = u.email.toLowerCase();
    }

    if (u.username && u.username !== u.username.toLowerCase()) {
      data.username = u.username.toLowerCase();
    }

    await prisma.user.update({
      where: { id: u.id },
      data,
    });

    count++;
    console.log(`  Normalizado: ${u.id} -> email=${data.email}, username=${data.username}`);
  }

  console.log(`\nNormalizacion completada. ${count} usuarios actualizados.`);
}

main()
  .catch((err) => {
    console.error("Error durante la normalizacion:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
