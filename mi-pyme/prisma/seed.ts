import { PrismaClient } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const GENERIC_ADMIN_EMAIL = process.env.GENERIC_ADMIN_EMAIL || "admin@mi-pyme.local";
const GENERIC_ADMIN_PASSWORD = process.env.GENERIC_ADMIN_PASSWORD || "12345678";
const GENERIC_ADMIN_NAME = "Administrador Genérico";

async function createGenericAdminIfNone() {
  const adminCount = await prisma.user.count({
    where: {
      rol: "ADMIN",
      isActive: true,
    },
  });

  if (adminCount > 0) {
    console.log("Admin users already exist, skipping generic admin creation");
    return;
  }

  const existingGenericAdmin = await prisma.user.findFirst({
    where: {
      email: GENERIC_ADMIN_EMAIL,
    },
  });

  if (existingGenericAdmin) {
    await prisma.user.update({
      where: { id: existingGenericAdmin.id },
      data: {
        isGenericAdmin: true,
        mustChangePassword: true,
        isActive: true,
        rol: "ADMIN",
        password: await bcrypt.hash(GENERIC_ADMIN_PASSWORD, 12),
      },
    });
    console.log("Reactivated existing generic admin");
  } else {
    const hashedPassword = await bcrypt.hash(GENERIC_ADMIN_PASSWORD, 12);
    await prisma.user.create({
      data: {
        email: GENERIC_ADMIN_EMAIL,
        username: "admin",
        password: hashedPassword,
        nombre: GENERIC_ADMIN_NAME,
        rol: "ADMIN",
        isGenericAdmin: true,
        mustChangePassword: true,
        isActive: true,
      },
    });
    console.log("Created new generic admin");
  }

  await prisma.auditLog.create({
    data: {
      eventType: "GENERIC_ADMIN_CREATED",
      meta: {
        email: GENERIC_ADMIN_EMAIL,
        reason: "No active admins found on startup",
      },
    },
  });
}

async function main() {
  console.log("Starting seed: create generic admin if none exists...");
  await createGenericAdminIfNone();
  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });