import { PrismaClient, Rol } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "mipyme.db");

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`,
    },
  },
});

export async function setupTestData() {
  await prisma.$executeRawUnsafe(`DELETE FROM "FacturaItem";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Factura";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "PedidoItem";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Pedido";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Reserva";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "CarritoItem";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Carrito";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Inventario";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Servicio";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Producto";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "NegocioSubarea";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Negocio";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "User";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Area";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Subarea";`);

  const area = await prisma.area.create({
    data: { nombre: "Servicios", slug: "servicios", activo: true },
  });

  const subarea = await prisma.subarea.create({
    data: {
      nombre: "Belleza",
      slug: "belleza",
      activo: true,
    },
  });

  const negocio = await prisma.negocio.create({
    data: {
      nombre: "Spa Premium",
      slug: "spa-premium",
      activo: true,
      areaId: area.id,
    },
  });

  await prisma.negocioSubarea.create({
    data: { negocioId: negocio.id, subareaId: subarea.id },
  });

  const password = await bcrypt.hash("password123", 10);
  const usuario = await prisma.user.create({
    data: {
      email: "cliente@test.com",
      password,
      nombre: "Cliente Test",
      rol: Rol.CLIENTE,
    },
  });

  const producto = await prisma.producto.create({
    data: {
      negocioId: negocio.id,
      subareaId: subarea.id,
      nombre: "Kit de Belleza",
      descripcion: "Kit completo de belleza",
      precio: 25.5,
      unidadMedida: "unidad",
      imagenUrl: "https://example.com/kit.jpg",
      activo: true,
      disponibleHoy: true,
    },
  });

  const servicio = await prisma.servicio.create({
    data: {
      negocioId: negocio.id,
      subareaId: subarea.id,
      nombre: "Manicura",
      descripcion: "Servicio de manicura",
      duracionMinutos: 60,
      horariosDisponibles: JSON.stringify([]),
      capacidad: 5,
      imagenUrl: "https://example.com/manicura.jpg",
      activo: true,
    },
  });

  const inventario = await prisma.inventario.create({
    data: {
      productoId: producto.id,
      cantidadActual: 100,
      puntoReorden: 10,
      ubicacion: "Almacén A",
    },
  });

  return {
    usuario,
    negocio,
    area,
    subarea,
    producto,
    servicio,
    inventario,
  };
}

export async function cleanupTestData() {
  await prisma.$disconnect();
}
