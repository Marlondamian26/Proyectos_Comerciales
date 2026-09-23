import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient();

const NEGOCIO_MAIL = process.env.SEED_NEGOCIO_EMAIL || "negocio@mi-pyme.local";
const NEGOCIO_PASSWORD = process.env.SEED_NEGOCIO_PASSWORD || "12345678";

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function normalizarFecha(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: NEGOCIO_MAIL },
    update: {
      rol: "NEGOCIO",
      isActive: true,
      nombre: "Negocio Demo",
    },
    create: {
      email: NEGOCIO_MAIL,
      username: "negocio",
      nombre: "Negocio Demo",
      password: NEGOCIO_PASSWORD,
      rol: "NEGOCIO",
      isActive: true,
    },
  });

  let negocio = await prisma.negocio.findFirst({
    where: { userId: admin.id },
  });

  if (!negocio) {
    negocio = await prisma.negocio.create({
      data: {
        nombre: "Tienda Demo",
         slug: "tienda-demo",
         userId: admin.id,
         estado: "ACTIVO",
         permiteReservas: true,
         permiteEnvio: true,
      },
    });
  }

  const area = await prisma.area.upsert({
    where: { slug: "general" },
    update: {},
    create: {
      nombre: "General",
      slug: "general",
    },
  });

  await prisma.negocio.update({
    where: { id: negocio.id },
    data: { areaId: area.id },
  });

  const horariosExistentes = await prisma.horarioNegocio.count({
    where: { negocioId: negocio.id },
  });
  if (horariosExistentes === 0) {
    await prisma.horarioNegocio.createMany({
      data: [
        { negocioId: negocio.id, diaSemana: 1, horaApertura: "08:00", horaCierre: "18:00" },
        { negocioId: negocio.id, diaSemana: 2, horaApertura: "08:00", horaCierre: "18:00" },
        { negocioId: negocio.id, diaSemana: 3, horaApertura: "08:00", horaCierre: "18:00" },
        { negocioId: negocio.id, diaSemana: 4, horaApertura: "08:00", horaCierre: "18:00" },
        { negocioId: negocio.id, diaSemana: 5, horaApertura: "08:00", horaCierre: "18:00" },
        { negocioId: negocio.id, diaSemana: 6, horaApertura: "08:00", horaCierre: "13:00" },
        { negocioId: negocio.id, diaSemana: 0, horaApertura: "00:00", horaCierre: "00:00", cerrado: true },
      ],
    });
  }

  let subarea = await prisma.subarea.findFirst({
    where: { negocios: { some: { negocioId: negocio.id } } },
  });

  if (!subarea) {
    subarea = await prisma.subarea.create({
      data: {
        nombre: "Principal",
        slug: `principal-${negocio.id}`,
        areaId: area.id,
        negocios: {
          create: { negocioId: negocio.id },
        },
      },
    });
  }

  const productosDemo = [
    {
      nombre: "Pizza Margarita",
      descripcion: "Pizza clásica con mozzarella y tomate",
      precio: 12.5,
      unidadMedida: "unidad",
      imagenUrl: "https://placehold.co/64x64/png?text=Pizza",
    },
    {
      nombre: "Empanada de Carne",
      descripcion: "Empanada de carne picada",
      precio: 3.25,
      unidadMedida: "unidad",
      imagenUrl: "https://placehold.co/64x64/png?text=Empanada",
    },
    {
      nombre: "Pizza Napolitana",
      descripcion: "Pizza con mozzarella, tomate y aceitunas",
      precio: 14.0,
      unidadMedida: "unidad",
      imagenUrl: "https://placehold.co/64x64/png?text=Napo",
    },
  ];

  for (const p of productosDemo) {
    const existe = await prisma.producto.findFirst({
      where: { negocioId: negocio.id, nombre: p.nombre },
    });
    if (!existe) {
      await prisma.producto.create({
        data: {
          negocioId: negocio.id,
          subareaId: subarea.id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: p.precio,
          unidadMedida: p.unidadMedida,
          imagenUrl: p.imagenUrl,
          activo: true,
        },
      });
    }
  }

  const productos = await prisma.producto.findMany({
    where: { negocioId: negocio.id, activo: true },
  });

  const hoy = new Date();
  for (const prod of productos) {
    for (let i = 0; i < 7; i++) {
      const fecha = normalizarFecha(addDays(hoy, i));
      const cantidad = i === 0 ? 15 : 20;
      await prisma.disponibilidadProducto.upsert({
        where: {
          productoId_fecha: {
            productoId: prod.id,
            fecha,
          },
        },
        update: { cantidad },
        create: {
          productoId: prod.id,
          fecha,
          cantidad,
        },
      });
    }
  }

  const serviciosDemo = [
    {
      nombre: "Corte de Pelo",
      descripcion: "Corte de pelo clásico",
      duracionMinutos: 30,
      capacidad: 1,
      imagenUrl: "https://placehold.co/64x64/png?text=Corte",
      horariosDisponibles: {
        lunes: ["09:00", "10:00", "11:00"],
        martes: ["09:00", "10:00", "11:00"],
        miercoles: ["09:00", "10:00", "11:00"],
        jueves: ["09:00", "10:00", "11:00"],
        viernes: ["09:00", "10:00", "11:00"],
      },
    },
  ];

  for (const s of serviciosDemo) {
    const existe = await prisma.servicio.findFirst({
      where: { negocioId: negocio.id, nombre: s.nombre },
    });
    if (!existe) {
      await prisma.servicio.create({
        data: {
          negocioId: negocio.id,
          subareaId: subarea.id,
          nombre: s.nombre,
          descripcion: s.descripcion,
          duracionMinutos: s.duracionMinutos,
          capacidad: s.capacidad,
          imagenUrl: s.imagenUrl,
          horariosDisponibles: s.horariosDisponibles,
          activo: true,
        },
      });
    }
  }

  // -- Proveedor y opciones de logística (Fase 1 — Punto 4) --

  const proveedor = await prisma.proveedorLogistico.upsert({
    where: { id: `prov-${negocio.id}` },
    update: {},
    create: {
      id: `prov-${negocio.id}`,
      usuarioId: admin.id,
      nombre: "Envíos Demo",
      zonaCobertura: "Nacional",
      alcanceNacional: true,
      contacto: "demo@envios.com",
    },
  });

  await prisma.opcionLogistica.upsert({
    where: { id: `opc-${negocio.id}-domicilio` },
    update: {},
    create: {
      id: `opc-${negocio.id}-domicilio`,
      negocioId: negocio.id,
      proveedorId: proveedor.id,
      nombre: "Envío estándar",
      tipo: "envio",
      tarifaBase: 5.99,
      tarifaPorDistancia: 0.5,
      tiempoEstimado: "24-48 horas",
    },
  });

  await prisma.opcionLogistica.upsert({
    where: { id: `opc-${negocio.id}-express` },
    update: {},
    create: {
      id: `opc-${negocio.id}-express`,
      negocioId: negocio.id,
      proveedorId: proveedor.id,
      nombre: "Envío exprés",
      tipo: "express",
      tarifaBase: 12.0,
      tarifaPorDistancia: 1.0,
      tiempoEstimado: "12 horas",
    },
  });

  // -- Pedidos de ejemplo --

  const clienteDemo = await prisma.user.upsert({
    where: { email: "cliente@mi-pyme.local" },
    update: { rol: "CLIENTE", isActive: true },
    create: {
      email: "cliente@mi-pyme.local",
      username: "cliente",
      nombre: "Cliente Demo",
      password: "12345678",
      rol: "CLIENTE",
      isActive: true,
    },
  });

  const productosExistentes = await prisma.producto.findMany({
    where: { negocioId: negocio.id, activo: true },
  });

  if (productosExistentes.length > 0) {
    const opcionDom = await prisma.opcionLogistica.findUnique({
      where: { id: `opc-${negocio.id}-domicilio` },
    });

    await prisma.pedido.upsert({
      where: { id: "pedido-demo-1" },
      update: {},
      create: {
        id: "pedido-demo-1",
        usuarioId: clienteDemo.id,
        negocioId: negocio.id,
        total: 25.0,
        tipo: "producto",
        tipoEntrega: "DOMICILIO",
        negocioIds: JSON.stringify([negocio.id]),
        opcionLogisticaId: opcionDom?.id ?? null,
        costoEnvio: 5.99,
        direccionEntrega: "Calle Demo 123",
        notas: "Dejar en puerta",
        items: {
          create: [
            {
              productoId: productosExistentes[0].id,
              cantidad: 2,
              precioUnitario: productosExistentes[0].precio,
              subtotal: productosExistentes[0].precio * 2,
              negocioId: negocio.id,
            },
          ],
        },
      },
    });

    await prisma.pedido.upsert({
      where: { id: "pedido-demo-2" },
      update: {},
      create: {
        id: "pedido-demo-2",
        usuarioId: clienteDemo.id,
        negocioId: negocio.id,
        total: 12.5,
        tipo: "producto",
        tipoEntrega: "RECOGIDA_TIENDA",
        negocioIds: JSON.stringify([negocio.id]),
        opcionLogisticaId: null,
        costoEnvio: 0,
        direccionEntrega: null,
      },
    });
  }

  console.log("Disponibilidad seed completed");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
