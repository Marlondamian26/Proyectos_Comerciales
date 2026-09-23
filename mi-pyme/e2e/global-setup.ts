import { PrismaClient, Rol } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

export default async function globalSetup() {
  const hashedPassword = await bcrypt.hash("12345678", 12);

  await prisma.user.upsert({
    where: { email: "admin@mi-pyme.local" },
    update: {
      password: hashedPassword,
      nombre: "Administrador Genérico",
      username: "admin",
      rol: "ADMIN",
      isGenericAdmin: true,
      mustChangePassword: true,
      isActive: true,
    },
    create: {
      email: "admin@mi-pyme.local",
      username: "admin",
      password: hashedPassword,
      nombre: "Administrador Genérico",
      rol: "ADMIN",
      isGenericAdmin: true,
      mustChangePassword: true,
      isActive: true,
    },
  });

  const clienteNegocioPassword = await bcrypt.hash("E2eCliente123", 12);
  const existingClienteNegocio = await prisma.user.findUnique({
    where: { email: "e2e-cliente-negocio@test.com" },
  });

  if (!existingClienteNegocio) {
    const negocioOwner = await prisma.user.create({
      data: {
        email: "e2e-cliente-negocio@test.com",
        username: "e2e_cliente_negocio",
        password: clienteNegocioPassword,
        nombre: "Cliente Negocio Test",
        rol: Rol.CLIENTE,
        mustChangePassword: false,
        isActive: true,
      },
    });

    const area = await prisma.area.findFirst({});
    if (area) {
      const negocio = await prisma.negocio.create({
        data: {
          nombre: "Negocio Cliente Test",
          slug: "negocio-cliente-test",
          activo: true,
          areaId: area.id,
          regimenFiscal: "GENERAL",
          tasaIVA: 10,
          modoPrecio: "IVA_INCLUIDO",
          nit: "E2E-NEGOCIO-001",
        },
      });

      await prisma.negocio.update({
        where: { id: negocio.id },
        data: { userId: negocioOwner.id },
      });
    }
  } else {
    await prisma.user.update({
      where: { email: "e2e-cliente-negocio@test.com" },
      data: { password: clienteNegocioPassword },
    });
  }

  const existingInactive = await prisma.user.findUnique({
    where: { email: "e2e-inactive@test.com" },
  });

  if (!existingInactive) {
    const inactivePassword = await bcrypt.hash("e2e-inactive-pass", 10);
    await prisma.user.create({
      data: {
        email: "e2e-inactive@test.com",
        username: "e2e_inactive",
        password: inactivePassword,
        nombre: "E2E Inactive User",
        rol: "CLIENTE",
        mustChangePassword: false,
        isActive: false,
      },
    });
  }

  await prisma.$disconnect();
};
