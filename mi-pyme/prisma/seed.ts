/**
 * Seed reducido de Mi-Pyme (4 negocios representativos con imágenes reales).
 * Idempotente. Mantiene provincias, áreas, admins, clientes y datos mínimos.
 */

import "dotenv/config";
import { PrismaClient, Prisma } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL ?? "";
  const connectionString = rawUrl.replace(/[?&]sslmode=verify-full/, "").replace(/[?&]sslmode=require/, "");
  const adapter = new PrismaPg({ connectionString, ssl: { rejectUnauthorized: false } });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();
const BCRYPT_ROUNDS = 12;
const GENERIC_ADMIN_EMAIL = process.env.GENERIC_ADMIN_EMAIL || "admin@mi-pyme.local";
const GENERIC_ADMIN_PASSWORD = process.env.GENERIC_ADMIN_PASSWORD || "12345678";
const GENERIC_ADMIN_NAME = "Administrador Genérico";
const NEGOCIO_PASSWORD = process.env.NEGOCIO_PASSWORD || "negocio123";
const CLIENTE_PASSWORD = process.env.CLIENTE_PASSWORD || "cliente123";
const LOGISTICA_PASSWORD = process.env.LOGISTICA_PASSWORD || "logistica123";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "test1234";
const SEED_DATE = new Date("2025-01-01T00:00:00Z");

const PROVINCIAS = [
  { slug: "pinar-del-rio", nombre: "Pinar del Río" },
  { slug: "la-habana", nombre: "La Habana" },
];

const MUNICIPIOS = [
  { slug: "pinar-del-rio", nombre: "Pinar del Río", provinciaSlug: "pinar-del-rio" },
  { slug: "plaza-de-la-revolucion", nombre: "Plaza de la Revolución", provinciaSlug: "la-habana" },
];

const AREAS = [
  { slug: "comida-restaurantes", nombre: "Comida y Restaurantes", subareas: [{ slug: "pizzeria", nombre: "Pizzería" }] },
  { slug: "salud-belleza", nombre: "Salud y Belleza", subareas: [{ slug: "peluqueria", nombre: "Peluquería" }, { slug: "estetica", nombre: "Estética" }] },
  { slug: "aseo-limpieza", nombre: "Aseo y Limpieza", subareas: [{ slug: "detergentes", nombre: "Detergentes" }, { slug: "articulos-limpieza", nombre: "Artículos de limpieza" }] },
  { slug: "tecnologia", nombre: "Tecnología", subareas: [{ slug: "accesorios", nombre: "Accesorios" }, { slug: "telefonia", nombre: "Telefonía" }] },
];

const NEGOCIOS = [
  {
    slug: "pizzeria-bella-napoli", nombre: "Pizzería Bella Napoli", descripcion: "Pizzería artesanal con pizzas napolitanas.",
    emailPropietario: "negocio.pizzeria@test.com", usernamePropietario: "pizzeria", nombrePropietario: "David Rodríguez",
    areaSlug: "comida-restaurantes", subareaSlug: "pizzeria", municipio: "Pinar del Río", provincia: "Pinar del Río",
    telefono: "559-100200", emailContacto: "contacto@pizzeriabellanapoli.com", direccionCompleta: "Av. Martí #301, Pinar del Río",
    nit: "PZN-0001-001", regimenFiscal: "GENERAL" as const, tasaIVA: 10, prefijoFactura: "PR", permiteReservas: true, permiteEnvio: true,
    imagenPortada: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200",
    productos: [
      { nombre: "Pizza Margarita", descripcion: "Mozzarella, tomate y albahaca", precio: 8, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600" },
      { nombre: "Pizza Pepperoni", descripcion: "Pepperoni y mozzarella", precio: 10, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600" },
      { nombre: "Pizza Napolitana", descripcion: "Tomate, aceitunas y orégano", precio: 9, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600" },
      { nombre: "Pizza Hawaiana", descripcion: "Jamón y piña", precio: 11, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600" },
      { nombre: "Pan de ajo", descripcion: "Recién horneado", precio: 3, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=600" },
      { nombre: "Refresco", descripcion: "Lata 330ml", precio: 2, unidadMedida: "lata", tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=600" },
    ],
    servicios: [
      { nombre: "Reserva de mesa", descripcion: "Mesa para grupos", duracionMinutos: 30, capacidad: 6, precio: 0, horariosDisponibles: { lunes:["18:00","19:00"], martes:["18:00","19:00"] }, tratamientoIVA: "NO_SUJETO" as const, imagenUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600" },
    ],
  },
  {
    slug: "salon-belleza-estrella", nombre: "Salón de Belleza Estrella", descripcion: "Servicios de belleza y cuidado personal.",
    emailPropietario: "negocio.salon@test.com", usernamePropietario: "salon", nombrePropietario: "Laura Martínez",
    areaSlug: "salud-belleza", subareaSlug: "peluqueria", municipio: "Pinar del Río", provincia: "Pinar del Río",
    telefono: "559-300400", emailContacto: "contacto@salonestrella.com", direccionCompleta: "Calle Gerardo Medina #88, Pinar del Río",
    nit: "SBE-0003-001", regimenFiscal: "GENERAL" as const, tasaIVA: 10, prefijoFactura: "PR", permiteReservas: true, permiteEnvio: false,
    imagenPortada: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200",
    productos: [],
    servicios: [
      { nombre: "Corte de cabello", descripcion: "Corte profesional", duracionMinutos: 45, capacidad: 1, precio: 10, horariosDisponibles: { lunes:["09:00","10:00"] }, tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600" },
      { nombre: "Peinado", descripcion: "Peinado para eventos", duracionMinutos: 60, capacidad: 1, precio: 15, horariosDisponibles: { lunes:["09:00","10:00"] }, tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600" },
      { nombre: "Tinte", descripcion: "Aplicación de tinte", duracionMinutos: 90, capacidad: 1, precio: 20, horariosDisponibles: { lunes:["09:00"] }, tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600" },
      { nombre: "Manicure", descripcion: "Cuidado de uñas", duracionMinutos: 40, capacidad: 1, precio: 8, horariosDisponibles: { lunes:["09:00","10:00"] }, tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600" },
      { nombre: "Pedicure", descripcion: "Cuidado de pies", duracionMinutos: 50, capacidad: 1, precio: 10, horariosDisponibles: { lunes:["09:00","10:00"] }, tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600" },
    ],
  },
  {
    slug: "ferreteria-el-tornillo", nombre: "Ferretería El Tornillo", descripcion: "Artículos de limpieza y ferretería.",
    emailPropietario: "negocio.ferreteria@test.com", usernamePropietario: "ferreteria", nombrePropietario: "Carlos Pérez",
    areaSlug: "aseo-limpieza", subareaSlug: "detergentes", municipio: "Pinar del Río", provincia: "Pinar del Río",
    telefono: "559-400500", emailContacto: "contacto@eltornillo.com", direccionCompleta: "Calle 20 #45, Pinar del Río",
    nit: "FET-0004-001", regimenFiscal: "GENERAL" as const, tasaIVA: 10, prefijoFactura: "PR", permiteReservas: false, permiteEnvio: true,
    imagenPortada: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
    productos: [
      { nombre: "Detergente", descripcion: "Detergente multiusos", precio: 5, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600" },
      { nombre: "Jabón", descripcion: "Jabón de tocador", precio: 2, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=600" },
      { nombre: "Cloro", descripcion: "Desinfectante", precio: 3, unidadMedida: "botella", tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600" },
      { nombre: "Escoba", descripcion: "Escoba de fibras", precio: 6, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600" },
      { nombre: "Trapeador", descripcion: "Trapeador con palo", precio: 7, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600" },
    ],
    servicios: [],
  },
  {
    slug: "tecnocell-cuba", nombre: "TecnoCell Cuba", descripcion: "Accesorios y tecnología móvil.",
    emailPropietario: "negocio.tecnocell@test.com", usernamePropietario: "tecnocell", nombrePropietario: "Roberto Díaz",
    areaSlug: "tecnologia", subareaSlug: "accesorios", municipio: "Pinar del Río", provincia: "Pinar del Río",
    telefono: "559-500600", emailContacto: "contacto@tecnocell.com", direccionCompleta: "Calle Real #12, Pinar del Río",
    nit: "TCC-0005-001", regimenFiscal: "GENERAL" as const, tasaIVA: 10, prefijoFactura: "PR", permiteReservas: false, permiteEnvio: true,
    imagenPortada: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200",
    productos: [
      { nombre: "Funda de celular", descripcion: "Funda protectora", precio: 8, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1601593346740-925612772716?w=600" },
      { nombre: "Audífonos", descripcion: "Audífonos con cable", precio: 15, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600" },
      { nombre: "Cable USB", descripcion: "Cable de carga", precio: 5, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600" },
      { nombre: "Cargador", descripcion: "Cargador rápido", precio: 12, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600" },
      { nombre: "Power bank", descripcion: "Batería portátil", precio: 25, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" as const, imagenUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600" },
    ],
    servicios: [],
  },
];

function horarioServicioGeneral() {
  return { lunes:["09:00","10:00","11:00"], martes:["09:00","10:00","11:00"], miercoles:["09:00","10:00","11:00"], jueves:["09:00","10:00","11:00"], viernes:["09:00","10:00","11:00"] };
}

async function logSeed(eventType: string, targetId?: string | null, meta?: Record<string, unknown>) {
  await prisma.auditLog.create({ data: { eventType, targetId: targetId ?? null, meta: (meta ?? {}) as Prisma.InputJsonValue, timestamp: SEED_DATE } });
}

async function main() {
  console.log("🌱 Seed reducido Mi-Pyme (4 negocios)...");

  const provinciaMap = new Map<string, string>();
  for (const p of PROVINCIAS) {
    const r = await prisma.provincia.upsert({ where: { slug: p.slug }, update: { nombre: p.nombre }, create: { slug: p.slug, nombre: p.nombre } });
    provinciaMap.set(p.slug, r.id);
  }
  const municipioMap = new Map<string, string>();
  for (const m of MUNICIPIOS) {
    const provId = provinciaMap.get(m.provinciaSlug);
    if (!provId) continue;
    const r = await prisma.municipio.upsert({ where: { slug: m.slug }, update: { nombre: m.nombre, provinciaId: provId }, create: { slug: m.slug, nombre: m.nombre, provinciaId: provId } });
    municipioMap.set(m.slug, r.id);
  }

  for (const area of AREAS) {
    const a = await prisma.area.upsert({ where: { slug: area.slug }, update: { nombre: area.nombre }, create: { slug: area.slug, nombre: area.nombre } });
    for (const sub of area.subareas) {
      await prisma.subarea.upsert({ where: { slug: sub.slug }, update: { nombre: sub.nombre, areaId: a.id }, create: { slug: sub.slug, nombre: sub.nombre, areaId: a.id } });
    }
  }

  const admins = [
    { email: GENERIC_ADMIN_EMAIL, username: "admin", nombre: GENERIC_ADMIN_NAME, password: GENERIC_ADMIN_PASSWORD },
    { email: "admin2@test.com", username: "admin2", nombre: "Admin Secundario", password: "test1234" },
  ];
  for (const adm of admins) {
    const hash = await bcrypt.hash(adm.password, BCRYPT_ROUNDS);
    await prisma.user.upsert({ where: { email: adm.email }, update: { nombre: adm.nombre, rol: "ADMIN", isActive: true }, create: { email: adm.email, username: adm.username, nombre: adm.nombre, password: hash, rol: "ADMIN", provincia: "Pinar del Río", municipio: "Pinar del Río", isActive: true } });
  }

  for (let i = 1; i <= 3; i++) {
    const email = `cliente${i}@test.com`;
    const hash = await bcrypt.hash(CLIENTE_PASSWORD, BCRYPT_ROUNDS);
    await prisma.user.upsert({ where: { email }, update: { rol: "CLIENTE" }, create: { email, username: `cliente${i}`, nombre: `Cliente ${i}`, password: hash, rol: "CLIENTE", provincia: "Pinar del Río", municipio: "Pinar del Río", isActive: true } });
  }

  for (let i = 1; i <= 1; i++) {
    const email = `logistica${i}@test.com`;
    const hash = await bcrypt.hash(LOGISTICA_PASSWORD, BCRYPT_ROUNDS);
    await prisma.user.upsert({ where: { email }, update: { rol: "LOGISTICA" }, create: { email, username: `logistica${i}`, nombre: `Logística ${i}`, password: hash, rol: "LOGISTICA", provincia: "Pinar del Río", municipio: "Pinar del Río", isActive: true } });
  }

  for (const neg of NEGOCIOS) {
    const ownerHash = await bcrypt.hash(NEGOCIO_PASSWORD, BCRYPT_ROUNDS);
    const owner = await prisma.user.upsert({ where: { email: neg.emailPropietario }, update: { rol: "NEGOCIO" }, create: { email: neg.emailPropietario, username: neg.usernamePropietario, nombre: neg.nombrePropietario, password: ownerHash, rol: "NEGOCIO", provincia: neg.provincia, municipio: neg.municipio, isActive: true } });
    const area = await prisma.area.findUnique({ where: { slug: neg.areaSlug } });
    const subarea = await prisma.subarea.findUnique({ where: { slug: neg.subareaSlug } });
    const negocio = await prisma.negocio.upsert({
      where: { slug: neg.slug },
      update: { nombre: neg.nombre, descripcion: neg.descripcion, activo: true, areaId: area?.id, telefono: neg.telefono, emailContacto: neg.emailContacto, direccionCompleta: neg.direccionCompleta, nit: neg.nit, regimenFiscal: neg.regimenFiscal, tasaIVA: neg.tasaIVA, prefijoFactura: neg.prefijoFactura, permiteReservas: neg.permiteReservas, permiteEnvio: neg.permiteEnvio },
      create: { slug: neg.slug, nombre: neg.nombre, descripcion: neg.descripcion, activo: true, userId: owner.id, areaId: area?.id, municipio: neg.municipio, provincia: neg.provincia, telefono: neg.telefono, emailContacto: neg.emailContacto, direccionCompleta: neg.direccionCompleta, nit: neg.nit, regimenFiscal: neg.regimenFiscal, tasaIVA: neg.tasaIVA, prefijoFactura: neg.prefijoFactura, modoPrecio: "IVA_INCLUIDO", permiteReservas: neg.permiteReservas, permiteEnvio: neg.permiteEnvio },
    });
    if (subarea) {
      await prisma.negocio.update({ where: { id: negocio.id }, data: { subareas: { connect: { id: subarea.id } } } }).catch(() => {});
    }
    for (let i = 0; i < neg.productos.length; i++) {
      const p = neg.productos[i];
      const pid = `seed-prod-${neg.slug}-${i}`;
      await prisma.producto.upsert({
        where: { id: pid },
        update: { nombre: p.nombre, descripcion: p.descripcion, precio: p.precio, imagenUrl: p.imagenUrl, tratamientoIVA: p.tratamientoIVA, activo: true },
        create: { id: pid, negocioId: negocio.id, subareaId: subarea?.id, nombre: p.nombre, descripcion: p.descripcion, precio: p.precio, unidadMedida: p.unidadMedida, tratamientoIVA: p.tratamientoIVA, imagenUrl: p.imagenUrl, activo: true },
      });
      await prisma.inventario.upsert({ where: { productoId: pid }, update: { cantidad: 20 }, create: { productoId: pid, cantidad: 20 } }).catch(() => {});
    }
    for (let i = 0; i < neg.servicios.length; i++) {
      const s = neg.servicios[i];
      const sid = `seed-serv-${neg.slug}-${i}`;
      await prisma.servicio.upsert({
        where: { id: sid },
        update: { nombre: s.nombre, descripcion: s.descripcion, duracionMinutos: s.duracionMinutos, capacidad: s.capacidad, precio: s.precio, imagenUrl: s.imagenUrl, horariosDisponibles: s.horariosDisponibles as Prisma.InputJsonValue, tratamientoIVA: s.tratamientoIVA, activo: true },
        create: { id: sid, negocioId: negocio.id, subareaId: subarea?.id, nombre: s.nombre, descripcion: s.descripcion, duracionMinutos: s.duracionMinutos, capacidad: s.capacidad, precio: s.precio, imagenUrl: s.imagenUrl, horariosDisponibles: s.horariosDisponibles as Prisma.InputJsonValue, tratamientoIVA: s.tratamientoIVA, activo: true },
      });
    }
    // horario negocio mínimo
    const dias = ["LUNES","MARTES","MIERCOLES","JUEVES","VIERNES","SABADO","DOMINGO"] as const;
    for (const dia of dias) {
      const h = await prisma.horarioNegocio.findFirst({ where: { negocioId: negocio.id, diaSemana: dia } });
      if (!h) await prisma.horarioNegocio.create({ data: { negocioId: negocio.id, diaSemana: dia, horaInicio: "08:00", horaFin: "18:00", activo: dia !== "DOMINGO" } });
    }
  }

  // datos transaccionales mínimos
  const cliente1 = await prisma.user.findUnique({ where: { email: "cliente1@test.com" } });
  const pizzeria = await prisma.negocio.findUnique({ where: { slug: "pizzeria-bella-napoli" } });
  const prodPizza = await prisma.producto.findFirst({ where: { negocioId: pizzeria?.id, nombre: { contains: "Margarita", mode: "insensitive" as Prisma.QueryMode } } });
  if (cliente1 && pizzeria && prodPizza) {
    const pedidoId = "seed-pedido-min-1";
    await prisma.pedido.upsert({
      where: { id: pedidoId },
      update: { estado: "pendiente", total: 8 },
      create: {
        id: pedidoId, usuarioId: cliente1.id, negocioId: pizzeria.id, total: 8, baseImponibleTotal: 7.27, montoIVATotal: 0.73, totalConIVA: 8,
        modoPrecio: "IVA_INCLUIDO", regimenFiscalNegocio: "GENERAL", tasaIVANegocio: 10, estado: "pendiente", tipo: "producto", tipoEntrega: "DOMICILIO",
        negocioIds: JSON.stringify([pizzeria.id]), costoEnvio: 0, estadoPago: "PENDIENTE", descuentoTotal: 0,
        items: { create: [{ productoId: prodPizza.id, cantidad: 1, precioUnitario: 8, precioUnitarioBase: 7.27, precioUnitarioConIVA: 8, tasaIVA: 10, tratamientoIVA: "GRAVADO", baseImponible: 7.27, montoIVA: 0.73, subtotal: 8, negocioId: pizzeria.id }] },
      },
    }).catch(() => {});
  }

  const counts = await prisma.$transaction([
    prisma.negocio.count(), prisma.producto.count(), prisma.servicio.count(), prisma.user.count(), prisma.pedido.count(),
  ]);
  console.log(`✅ Seed reducido: ${counts[0]} negocios, ${counts[1]} productos, ${counts[2]} servicios, ${counts[3]} usuarios, ${counts[4]} pedidos`);
  console.log("Credenciales: admin@mi-pyme.local/12345678, cliente1@test.com/cliente123, negocio.pizzeria@test.com/negocio123");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
