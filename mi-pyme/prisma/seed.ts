/**
 * Seed maestro de Mi-Pyme.
 *
 * Este seed es idempotente: puede ejecutarse N veces sin duplicar datos.
 * Usa `upsert` por email/username/slug y verifica existencia antes de crear
 * entidades sin clave única natural.
 *
 * Variables de entorno (con defaults):
 *   - GENERIC_ADMIN_PASSWORD (default "12345678")
 *   - NEGOCIO_PASSWORD       (default "negocio123")
 *   - CLIENTE_PASSWORD       (default "cliente123")
 *   - LOGISTICA_PASSWORD     (default "logistica123")
 *   - TEST_PASSWORD          (default "test1234")
 *
 * Uso:
 *   npx prisma db seed
 *   # o
 *   npm run db:seed
 */

import "dotenv/config";
import { PrismaClient, Prisma } from "@/generated/prisma/client";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

const GENERIC_ADMIN_EMAIL = process.env.GENERIC_ADMIN_EMAIL || "admin@mi-pyme.local";
const GENERIC_ADMIN_PASSWORD = process.env.GENERIC_ADMIN_PASSWORD || "12345678";
const GENERIC_ADMIN_NAME = "Administrador Genérico";

const NEGOCIO_PASSWORD = process.env.NEGOCIO_PASSWORD || "negocio123";
const CLIENTE_PASSWORD = process.env.CLIENTE_PASSWORD || "cliente123";
const LOGISTICA_PASSWORD = process.env.LOGISTICA_PASSWORD || "logistica123";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "test1234";

interface AreaDef {
  slug: string;
  nombre: string;
  subareas: { slug: string; nombre: string }[];
}

interface ProductoDef {
  nombre: string;
  descripcion: string;
  precio: number;
  unidadMedida: string;
  tratamientoIVA: "GRAVADO" | "EXENTO" | "NO_SUJETO";
}

interface ServicioDef {
  nombre: string;
  descripcion: string;
  duracionMinutos: number;
  capacidad: number;
  precio?: number;
  horariosDisponibles: Record<string, string[]>;
  tratamientoIVA: "GRAVADO" | "EXENTO" | "NO_SUJETO";
  tipo?: "SERVICIO_GENERAL" | "TRANSPORTE";
  tipoTransporte?: string;
  pesoMaximo?: number;
  dimensionesMaximas?: string;
  origenBase?: string;
  destinoBase?: string;
  alcanceNacional?: boolean;
}

interface ProveedorDef {
  slug: string;
  nombre: string;
  zonaCobertura: string;
  alcanceNacional: boolean;
  contacto: string;
}

interface NegocioDef {
  slug: string;
  nombre: string;
  descripcion: string;
  emailPropietario: string;
  usernamePropietario: string;
  nombrePropietario: string;
  areaSlug: string;
  subareaSlug: string;
  municipio: string;
  provincia: string;
  telefono: string;
  emailContacto: string;
  direccionCompleta: string;
  nit: string;
  regimenFiscal: "GENERAL" | "SIMPLIFICADO" | "EXENTO" | "NO_SUJETO";
  tasaIVA: number;
  permiteReservas: boolean;
  permiteEnvio: boolean;
  productos: ProductoDef[];
  servicios: ServicioDef[];
  transporteServicios?: ServicioDef[];
}

const AREAS: AreaDef[] = [
  {
    slug: "aseo-limpieza",
    nombre: "Aseo y Limpieza",
    subareas: [
      { slug: "detergentes", nombre: "Detergentes" },
      { slug: "jabones", nombre: "Jabones" },
      { slug: "desinfectantes", nombre: "Desinfectantes" },
    ],
  },
  {
    slug: "alimentos",
    nombre: "Alimentos",
    subareas: [
      { slug: "carnicos", nombre: "Cárnicos" },
      { slug: "bebidas", nombre: "Bebidas" },
      { slug: "lacteos", nombre: "Lácteos" },
      { slug: "granos", nombre: "Granos" },
      { slug: "vegetales", nombre: "Vegetales" },
      { slug: "panaderia", nombre: "Panadería" },
    ],
  },
  {
    slug: "electrodomesticos",
    nombre: "Electrodomésticos",
    subareas: [
      { slug: "linea-blanca", nombre: "Línea blanca" },
      { slug: "pequenos-electrodomesticos", nombre: "Pequeños electrodomésticos" },
    ],
  },
  {
    slug: "salud-belleza",
    nombre: "Salud y Belleza",
    subareas: [
      { slug: "cosmeticos", nombre: "Cosméticos" },
      { slug: "peluqueria", nombre: "Peluquería" },
      { slug: "barberia", nombre: "Barbería" },
    ],
  },
  {
    slug: "comida-restaurantes",
    nombre: "Comida y Restaurantes",
    subareas: [
      { slug: "comida-criolla", nombre: "Comida criolla" },
      { slug: "comida-rapida", nombre: "Comida rápida" },
      { slug: "pizzeria", nombre: "Pizzería" },
      { slug: "reposteria", nombre: "Repostería" },
    ],
  },
  {
    slug: "servicios-profesionales",
    nombre: "Servicios Profesionales",
    subareas: [
      { slug: "reparaciones", nombre: "Reparaciones" },
      { slug: "electricidad", nombre: "Electricidad" },
      { slug: "plomeria", nombre: "Plomería" },
      { slug: "transporte", nombre: "Transporte" },
    ],
  },
  {
    slug: "tecnologia",
    nombre: "Tecnología",
    subareas: [
      { slug: "telefonia", nombre: "Telefonía" },
      { slug: "informatica", nombre: "Informática" },
    ],
  },
];

const PROVEEDORES: ProveedorDef[] = [
  {
    slug: "envios-pinar",
    nombre: "Envíos Pinar",
    zonaCobertura: "Pinar del Río",
    alcanceNacional: false,
    contacto: "contacto@envios-pinar.com",
  },
  {
    slug: "envios-vinales",
    nombre: "Envíos Viñales",
    zonaCobertura: "Viñales",
    alcanceNacional: false,
    contacto: "contacto@envios-vinales.com",
  },
  {
    slug: "logistica-nacional",
    nombre: "Logística Nacional",
    zonaCobertura: "Cuba",
    alcanceNacional: true,
    contacto: "contacto@logistica-nacional.com",
  },
];

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function normalizeDate(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function logSeed(
  eventType: string,
  targetId: string | null,
  meta: Record<string, unknown>
) {
  await prisma.auditLog.create({
    data: { eventType, targetId, meta },
  });
}

async function actualizarUsuario(
  where: Prisma.UserWhereUniqueInput,
  data: Prisma.UserUpdateInput
) {
  return prisma.user.update({ where, data });
}

async function upsertUsuario(
  email: string,
  username: string | null,
  data: Omit<Prisma.UserCreateInput, "email" | "username">
) {
  return prisma.user.upsert({
    where: { email },
    update: {
      ...data,
      ...(username ? { username } : {}),
    },
    create: {
      email,
      ...(username ? { username } : {}),
      ...data,
    },
  });
}

const NEGOCIOS: NegocioDef[] = [
  {
    slug: "panaderia-la-espiga",
    nombre: "Panadería La Espiga",
    descripcion: "Panadería artesanal con productos frescos hechos en Pinar del Río",
    emailPropietario: "panaderia@test.com",
    usernamePropietario: "panaderia",
    nombrePropietario: "María González",
    areaSlug: "alimentos",
    subareaSlug: "panaderia",
    municipio: "Pinar del Río",
    provincia: "Pinar del Río",
    telefono: "559-123456",
    emailContacto: "contacto@panaderialaespiga.com",
    direccionCompleta: "Calle 20 de julio #123, Pinar del Río",
    nit: "1234567890AB",
    regimenFiscal: "GENERAL",
    tasaIVA: 10,
    permiteReservas: false,
    permiteEnvio: true,
    productos: [
      { nombre: "Pan de higo", descripcion: "Pan dulce tradicional con higo", precio: 0.8, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Pastelitos de guayaba", descripcion: "Pastelitos recién horneados con guayaba", precio: 1.5, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Galletas María", descripcion: "Galletas crujientes tipo María", precio: 1.2, unidadMedida: "paquete", tratamientoIVA: "EXENTO" },
      { nombre: "Croissant", descripcion: "Croissant hojaldrado recién horneado", precio: 1.0, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Jugo de naranja natural", descripcion: "Jugo exprimido de naranjas locales", precio: 2.0, unidadMedida: "botella", tratamientoIVA: "EXENTO" },
      { nombre: "Bollos de anís", descripcion: "Bollos tradicionales de anís", precio: 3.5, unidadMedida: "paquete", tratamientoIVA: "GRAVADO" },
    ],
    servicios: [
      {
        nombre: "Personalizar pastel",
        descripcion: "Personalización de pasteles para eventos especiales",
        duracionMinutos: 30,
        capacidad: 2,
        precio: 50.0,
        horariosDisponibles: {
          lunes: ["09:00", "10:00", "11:00"],
          martes: ["09:00", "10:00", "11:00"],
          miercoles: ["09:00", "10:00", "11:00"],
          jueves: ["09:00", "10:00", "11:00"],
          viernes: ["09:00", "10:00", "11:00"],
        },
        tratamientoIVA: "GRAVADO",
      },
      {
        nombre: "Servicio de catering",
        descripcion: "Catering para eventos de hasta 50 personas",
        duracionMinutos: 60,
        capacidad: 5,
        precio: 200.0,
        horariosDisponibles: {
          lunes: ["14:00", "15:00"],
          martes: ["14:00", "15:00"],
          miercoles: ["14:00", "15:00"],
          jueves: ["14:00", "15:00"],
          viernes: ["14:00", "15:00"],
        },
        tratamientoIVA: "GRAVADO",
      },
    ],
  },
  {
    slug: "carniceria-el-rincon",
    nombre: "Carnicería El Rincón",
    descripcion: "Carnicería con carne fresca de calidad en el centro de Pinar del Río",
    emailPropietario: "carniceria@test.com",
    usernamePropietario: "carniceria",
    nombrePropietario: "Carlos Pérez",
    areaSlug: "alimentos",
    subareaSlug: "carnicos",
    municipio: "Pinar del Río",
    provincia: "Pinar del Río",
    telefono: "559-234567",
    emailContacto: "contacto@carniceriaelrincon.com",
    direccionCompleta: "Av. Martí #456, Pinar del Río",
    nit: "2345678901CD",
    regimenFiscal: "GENERAL",
    tasaIVA: 10,
    permiteReservas: false,
    permiteEnvio: true,
    productos: [
      { nombre: "Carne molida de res", descripcion: "Carne molida de res 100% pura", precio: 180.0, unidadMedida: "kg", tratamientoIVA: "GRAVADO" },
      { nombre: "Pollo entero", descripcion: "Pollo fresco criado en libertad", precio: 350.0, unidadMedida: "kg", tratamientoIVA: "GRAVADO" },
      { nombre: "Cerdo pierna", descripcion: "Pierna de cerdo fresca", precio: 280.0, unidadMedida: "kg", tratamientoIVA: "GRAVADO" },
      { nombre: "Res filete", descripcion: "Filete de res de calidad premium", precio: 450.0, unidadMedida: "kg", tratamientoIVA: "GRAVADO" },
      { nombre: "Chorizo criollo", descripcion: "Chorizo tradicional cubano", precio: 220.0, unidadMedida: "kg", tratamientoIVA: "GRAVADO" },
      { nombre: "Chorizo de pollo", descripcion: "Chorizo de pollo sin grasa", precio: 190.0, unidadMedida: "kg", tratamientoIVA: "GRAVADO" },
    ],
    servicios: [
      {
        nombre: "Corte a medida",
        descripcion: "Corte de carne según especificaciones del cliente",
        duracionMinutos: 15,
        capacidad: 10,
        precio: 20.0,
        horariosDisponibles: {
          lunes: ["08:00", "09:00", "10:00"],
          martes: ["08:00", "09:00", "10:00"],
          miercoles: ["08:00", "09:00", "10:00"],
          jueves: ["08:00", "09:00", "10:00"],
          viernes: ["08:00", "09:00", "10:00"],
        },
        tratamientoIVA: "GRAVADO",
      },
      {
        nombre: "Empaque especial",
        descripcion: "Servicio de empaquetado al vacío para congelación",
        duracionMinutos: 10,
        capacidad: 5,
        precio: 15.0,
        horariosDisponibles: {
          lunes: ["14:00", "15:00", "16:00"],
          martes: ["14:00", "15:00", "16:00"],
          miercoles: ["14:00", "15:00", "16:00"],
          jueves: ["14:00", "15:00", "16:00"],
          viernes: ["14:00", "15:00", "16:00"],
        },
        tratamientoIVA: "GRAVADO",
      },
    ],
  },
  {
    slug: "barberia-el-corte",
    nombre: "Barbería El Corte",
    descripcion: "Barbería clásica con servicios de corte y afeitado en el centro de Pinar del Río",
    emailPropietario: "barberia@test.com",
    usernamePropietario: "barberia",
    nombrePropietario: "Luis Martínez",
    areaSlug: "salud-belleza",
    subareaSlug: "barberia",
    municipio: "Pinar del Río",
    provincia: "Pinar del Río",
    telefono: "559-345678",
    emailContacto: "contacto@barberiaelcorte.com",
    direccionCompleta: "Calle Reforma #789, Pinar del Río",
    nit: "3456789012EF",
    regimenFiscal: "SIMPLIFICADO",
    tasaIVA: 0,
    permiteReservas: true,
    permiteEnvio: false,
    productos: [
      { nombre: "Gel para cabello", descripcion: "Gel fijador fuerte sin gluten", precio: 50.0, unidadMedida: "unidad", tratamientoIVA: "NO_SUJETO" },
      { nombre: "Pomada modeladora", descripcion: "Pomada para peinillos con aroma a menta", precio: 45.0, unidadMedida: "unidad", tratamientoIVA: "NO_SUJETO" },
      { nombre: "Toalla de papel descanso", descripcion: "Toallas de papel para uso único", precio: 10.0, unidadMedida: "paquete", tratamientoIVA: "NO_SUJETO" },
      { nombre: "Aceite esencial de romero", descripcion: "Aceite de romero para el cuero cabelludo", precio: 30.0, unidadMedida: "botella", tratamientoIVA: "NO_SUJETO" },
      { nombre: "Tijera de peluquero", descripcion: "Tijera profesional de acero inoxidable", precio: 25.0, unidadMedida: "unidad", tratamientoIVA: "NO_SUJETO" },
    ],
    servicios: [
      {
        nombre: "Corte de pelo",
        descripcion: "Corte clásico con navaja y tijera",
        duracionMinutos: 30,
        capacidad: 1,
        precio: 30.0,
        horariosDisponibles: {
          lunes: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
          martes: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
          miercoles: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
          jueves: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
          viernes: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
        },
        tratamientoIVA: "NO_SUJETO",
      },
      {
        nombre: "Afeitado clásico con tijera",
        descripcion: "Afeitado con tijera, navaja y pomada",
        duracionMinutos: 30,
        capacidad: 1,
        precio: 25.0,
        horariosDisponibles: {
          lunes: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"],
          martes: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"],
          miercoles: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"],
          jueves: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"],
          viernes: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"],
        },
        tratamientoIVA: "NO_SUJETO",
      },
      {
        nombre: "Recorte de barba",
        descripcion: "Recorte y modelado de barba con tijera y máquina",
        duracionMinutos: 20,
        capacidad: 1,
        precio: 20.0,
        horariosDisponibles: {
          lunes: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
          martes: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
          miercoles: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
          jueves: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
          viernes: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
        },
        tratamientoIVA: "NO_SUJETO",
      },
    ],
  },
  {
    slug: "reposteria-dulce-sueno",
    nombre: "Repostería Dulce Sueño",
    descripcion: "Repostería artesanal con productos de calidad en Viñales",
    emailPropietario: "reposteria@test.com",
    usernamePropietario: "reposteria",
    nombrePropietario: "Ana López",
    areaSlug: "comida-restaurantes",
    subareaSlug: "reposteria",
    municipio: "Viñales",
    provincia: "Pinar del Río",
    telefono: "559-456789",
    emailContacto: "contacto@reposteriadulcesueno.com",
    direccionCompleta: "Calle Principal #12, Viñales",
    nit: "4567890123GH",
    regimenFiscal: "EXENTO",
    tasaIVA: 0,
    permiteReservas: false,
    permiteEnvio: true,
    productos: [
      { nombre: "Pastel de chocolate", descripcion: "Pastel húmedo con cobertura de chocolate negro", precio: 25.0, unidadMedida: "unidad", tratamientoIVA: "EXENTO" },
      { nombre: "Cupcakes de vainilla", descripcion: "Cupcakes con frosting de vainilla y frutas", precio: 5.0, unidadMedida: "unidad", tratamientoIVA: "EXENTO" },
      { nombre: "Donuts glaseados", descripcion: "Donuts recién hechos con glaseado", precio: 8.0, unidadMedida: "unidad", tratamientoIVA: "EXENTO" },
      { nombre: "Galletas decoradas", descripcion: "Galletas de mantequilla decoradas a mano", precio: 3.0, unidadMedida: "unidad", tratamientoIVA: "EXENTO" },
      { nombre: "Bizcocho de zanahoria", descripcion: "Bizcocho húmedo con zanahoria y nueces", precio: 12.0, unidadMedida: "unidad", tratamientoIVA: "EXENTO" },
    ],
    servicios: [
      {
        nombre: "Decoración de pastel",
        descripcion: "Servicio de decoración personalizada para eventos",
        duracionMinutos: 60,
        capacidad: 2,
        precio: 75.0,
        horariosDisponibles: {
          lunes: ["10:00", "11:00", "14:00", "15:00"],
          martes: ["10:00", "11:00", "14:00", "15:00"],
          miercoles: ["10:00", "11:00", "14:00", "15:00"],
          jueves: ["10:00", "11:00", "14:00", "15:00"],
          viernes: ["10:00", "11:00", "14:00", "15:00"],
        },
        tratamientoIVA: "EXENTO",
      },
      {
        nombre: "Pedido especial",
        descripcion: "Preparación de productos especiales con 48h de anticipación",
        duracionMinutos: 30,
        capacidad: 5,
        precio: 40.0,
        horariosDisponibles: {
          lunes: ["09:00", "10:00", "11:00"],
          martes: ["09:00", "10:00", "11:00"],
          miercoles: ["09:00", "10:00", "11:00"],
          jueves: ["09:00", "10:00", "11:00"],
          viernes: ["09:00", "10:00", "11:00"],
        },
        tratamientoIVA: "EXENTO",
      },
    ],
  },
  {
    slug: "techstore-express",
    nombre: "TechStore Express",
    descripcion: "Tienda de tecnología y accesorios electrónicos en Consolación del Sur",
    emailPropietario: "techstore@test.com",
    usernamePropietario: "techstore",
    nombrePropietario: "Roberto Díaz",
    areaSlug: "tecnologia",
    subareaSlug: "informatica",
    municipio: "Consolación del Sur",
    provincia: "Pinar del Río",
    telefono: "559-567890",
    emailContacto: "contacto@techstore-express.com",
    direccionCompleta: "Av. Cents. #345, Consolación del Sur",
    nit: "5678901234IJ",
    regimenFiscal: "GENERAL",
    tasaIVA: 10,
    permiteReservas: false,
    permiteEnvio: true,
    productos: [
      { nombre: "Cargador USB-C 20W", descripcion: "Cargador rápido USB-C con tecnología de carga rápida", precio: 15.0, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Cable USB-C a USB-A", descripcion: "Cable de datos y carga de 1.5m", precio: 8.0, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Auriculares inalámbricos", descripcion: "Auriculares Bluetooth con microfono", precio: 50.0, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Soporte para celular", descripcion: "Soporte ajustable para escritorio", precio: 5.0, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Power bank 10000mAh", descripcion: "Batería externa compacta con USB-C", precio: 30.0, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
    ],
    servicios: [
      {
        nombre: "Reparación de pantalla",
        descripcion: "Reparación de pantallas de smartphones y tablets",
        duracionMinutos: 60,
        capacidad: 3,
        precio: 50.0,
        horariosDisponibles: {
          lunes: ["09:00", "10:00", "11:00", "14:00", "15:00"],
          martes: ["09:00", "10:00", "11:00", "14:00", "15:00"],
          miercoles: ["09:00", "10:00", "11:00", "14:00", "15:00"],
          jueves: ["09:00", "10:00", "11:00", "14:00", "15:00"],
          viernes: ["09:00", "10:00", "11:00", "14:00", "15:00"],
        },
        tratamientoIVA: "GRAVADO",
      },
      {
        nombre: "Garantía extendida",
        descripcion: "Asesoría y gestión de garantía para dispositivos electrónicos",
        duracionMinutos: 15,
        capacidad: 20,
        precio: 10.0,
        horariosDisponibles: {
          lunes: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"],
          martes: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"],
          miercoles: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"],
          jueves: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"],
          viernes: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"],
        },
        tratamientoIVA: "GRAVADO",
      },
    ],
  },
  {
    slug: "transportes-nacionales",
    nombre: "Transportes Nacionales S.A.",
    descripcion: "Servicio de transporte de paquetes y mudanzas a nivel nacional",
    emailPropietario: "transportes@test.com",
    usernamePropietario: "transportes",
    nombrePropietario: "María Fernández",
    areaSlug: "servicios-profesionales",
    subareaSlug: "transporte",
    municipio: "La Habana",
    provincia: "La Habana",
    telefono: "559-012345",
    emailContacto: "contacto@transportes-nacionales.com",
    direccionCompleta: "Calle Obispo #101, La Habana Vieja, La Habana",
    nit: "9988776655XY",
    regimenFiscal: "GENERAL",
    tasaIVA: 10,
    permiteReservas: true,
    permiteEnvio: true,
    productos: [],
    servicios: [
      {
        nombre: "Envío de paquetes nacional",
        descripcion: "Servicio de envío de paquetes a cualquier provincia de Cuba",
        duracionMinutos: 120,
        capacidad: 1,
        precio: 150.0,
        horariosDisponibles: {
          lunes: ["09:00", "12:00", "15:00"],
          martes: ["09:00", "12:00", "15:00"],
          miercoles: ["09:00", "12:00", "15:00"],
          jueves: ["09:00", "12:00", "15:00"],
          viernes: ["09:00", "12:00", "15:00"],
          sabado: ["09:00", "12:00"],
        },
        tratamientoIVA: "GRAVADO",
        tipo: "TRANSPORTE",
        tipoTransporte: "ENVIO_PAQUETE",
        pesoMaximo: 20,
        dimensionesMaximas: "100x60x60 cm",
        alcanceNacional: true,
      },
      {
        nombre: "Transporte de personas",
        descripcion: "Servicio de traslado de personas con vehículo privado",
        duracionMinutos: 30,
        capacidad: 1,
        precio: 80.0,
        horariosDisponibles: {
          lunes: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
          martes: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
          miercoles: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
          jueves: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
          viernes: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
          sabado: ["08:00", "10:00", "12:00", "14:00"],
        },
        tratamientoIVA: "GRAVADO",
        tipo: "TRANSPORTE",
        tipoTransporte: "TRANSPORTE_PERSONAS",
        pesoMaximo: 100,
        alcanceNacional: true,
      },
    ],
  },
];

const HOJAS_HORARIO = [
  { diaSemana: 1, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 2, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 3, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 4, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 5, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 6, horaApertura: "08:00", horaCierre: "13:00", cerrado: false },
  { diaSemana: 0, horaApertura: "00:00", horaCierre: "00:00", cerrado: true },
];

async function seedAdminGenerico() {
  console.log("→ Seed: Admin genérico");

  const adminCount = await prisma.user.count({
    where: { rol: "ADMIN", isActive: true, deletedAt: null },
  });

  if (adminCount > 0) {
    console.log("  Admins activos ya existen, saltando creación");
    return;
  }

  const existingGenericAdmin = await prisma.user.findFirst({
    where: { email: GENERIC_ADMIN_EMAIL },
  });

  const hashedPassword = await hashPassword(GENERIC_ADMIN_PASSWORD);

  if (existingGenericAdmin) {
    await prisma.user.update({
      where: { id: existingGenericAdmin.id },
      data: {
        username: "admin",
        password: hashedPassword,
        nombre: GENERIC_ADMIN_NAME,
        rol: "ADMIN",
        isGenericAdmin: true,
        mustChangePassword: true,
        isActive: true,
        deletedAt: null,
        deletedBy: null,
        deletedReason: null,
      },
    });
    console.log("  Reactivado admin genérico existente");
  } else {
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
    console.log("  Creado admin genérico");
  }

  await logSeed("GENERIC_ADMIN_CREATED", null, {
    email: GENERIC_ADMIN_EMAIL,
    reason: "Seed: no active admins found",
  });
}

async function seedUsuariosBase() {
  console.log("→ Seed: Usuarios base (ADMIN, CLIENTE, LOGISTICA)");

  await upsertUsuario(
    "admin2@test.com",
    "admin2",
    {
      nombre: "Ana Ruiz",
      rol: "ADMIN",
      password: await hashPassword("admin2pass"),
      isGenericAdmin: false,
      mustChangePassword: false,
      isActive: true,
      emailVerified: new Date(),
    }
  );
  console.log("  Usuario ADMIN: admin2@test.com");

  for (const cliente of [
    { email: "cliente1@test.com", username: "cliente1", nombre: "Pedro Sánchez" },
    { email: "cliente2@test.com", username: "cliente2", nombre: "Luisa Fernández" },
    { email: "cliente3@test.com", username: "cliente3", nombre: "Miguel Torres" },
  ]) {
    await upsertUsuario(cliente.email, cliente.username, {
      nombre: cliente.nombre,
      rol: "CLIENTE",
      password: await hashPassword(CLIENTE_PASSWORD),
      isActive: true,
      emailVerified: new Date(),
    });
    await logSeed("SEED_USUARIO_CREADO", null, {
      email: cliente.email,
      rol: "CLIENTE",
    });
    console.log(`  Usuario CLIENTE: ${cliente.email}`);
  }

  await upsertUsuario(
    "logistica@test.com",
    "logistica",
    {
      nombre: "Empresa Logística",
      rol: "LOGISTICA",
      password: await hashPassword(LOGISTICA_PASSWORD),
      isActive: true,
      emailVerified: new Date(),
    }
  );
  console.log("  Usuario LOGISTICA: logistica@test.com");
}

async function seedUsuariosAuthTest() {
  console.log("→ Seed: Usuarios de test de auth");

  const now = new Date();
  const lockedUntil = new Date(now.getTime() + 60 * 60 * 1000);

  await upsertUsuario(
    "inactive@test.com",
    "inactive",
    {
      nombre: "Usuario Inactivo",
      rol: "CLIENTE",
      password: await hashPassword(TEST_PASSWORD),
      isActive: false,
      mustChangePassword: false,
      emailVerified: new Date(),
    }
  );
  console.log("  inactive@test.com (isActive: false)");

  await upsertUsuario(
    "mustchange@test.com",
    "mustchange",
    {
      nombre: "Usuario Must Change",
      rol: "CLIENTE",
      password: await hashPassword(TEST_PASSWORD),
      isActive: true,
      mustChangePassword: true,
      emailVerified: new Date(),
    }
  );
  console.log("  mustchange@test.com (mustChangePassword: true)");

  await upsertUsuario(
    "locked@test.com",
    "locked",
    {
      nombre: "Usuario Bloqueado",
      rol: "CLIENTE",
      password: await hashPassword(TEST_PASSWORD),
      isActive: true,
      failedLoginAttempts: 3,
      lockedUntil,
      emailVerified: new Date(),
    }
  );
  console.log("  locked@test.com (failedLoginAttempts: 3, lockedUntil: +1h)");
}

async function seedAreasYSubareas() {
  console.log("→ Seed: Áreas y subáreas");

  let areaCount = 0;
  let subareaCount = 0;

  for (const areaDef of AREAS) {
    await prisma.area.upsert({
      where: { slug: areaDef.slug },
      update: { nombre: areaDef.nombre, activo: true },
      create: { slug: areaDef.slug, nombre: areaDef.nombre },
    });
    areaCount++;

    for (const sa of areaDef.subareas) {
      const subareaSlug = `${areaDef.slug}-${sa.slug}`;
      await prisma.subarea.upsert({
        where: { slug: subareaSlug },
        update: { nombre: sa.nombre, activo: true, areaId: (await prisma.area.findUniqueOrThrow({ where: { slug: areaDef.slug } })).id },
        create: { slug: subareaSlug, nombre: sa.nombre, area: { connect: { slug: areaDef.slug } } },
      });
      subareaCount++;
    }

    console.log(`  Área: ${areaDef.nombre} (${areaDef.subareas.length} subáreas)`);
  }

  console.log(`  Total: ${areaCount} áreas, ${subareaCount} subáreas`);
}

async function seedProveedoresLogisticos() {
  console.log("→ Seed: Proveedores logísticos");

  const logisticaUser = await prisma.user.findFirst({
    where: { email: "logistica@test.com" },
    select: { id: true },
  });

  if (!logisticaUser) {
    console.log("  ERROR: No se encontró usuario LOGISTICA");
    return;
  }

  for (const provDef of PROVEEDORES) {
    const proveedorId = `seed-prov-${provDef.slug}`;
    const proveedor = await prisma.proveedorLogistico.upsert({
      where: { id: proveedorId },
      update: {
        nombre: provDef.nombre,
        zonaCobertura: provDef.zonaCobertura,
        alcanceNacional: provDef.alcanceNacional,
        contacto: provDef.contacto,
        activo: true,
        usuarioId: logisticaUser.id,
      },
      create: {
        id: proveedorId,
        usuarioId: logisticaUser.id,
        nombre: provDef.nombre,
        zonaCobertura: provDef.zonaCobertura,
        alcanceNacional: provDef.alcanceNacional,
        contacto: provDef.contacto,
      },
    });
    console.log(`  Proveedor: ${proveedor.nombre}`);
  }
}

async function seedNegociosYDatos() {
  console.log("→ Seed: Negocios, productos, servicios, inventario, disponibilidad");

  const admin = await prisma.user.findFirst({
    where: { isGenericAdmin: true },
    select: { id: true },
  });

  for (const negocioDef of NEGOCIOS) {
    const negocioId = `seed-neg-${negocioDef.slug}`;

    const propietario = await upsertUsuario(
      negocioDef.emailPropietario,
      negocioDef.usernamePropietario,
      {
        nombre: negocioDef.nombrePropietario,
        rol: "NEGOCIO",
        password: await hashPassword(NEGOCIO_PASSWORD),
        isActive: true,
        emailVerified: new Date(),
        provincia: negocioDef.provincia,
        municipio: negocioDef.municipio,
      }
    );
    await logSeed("SEED_USUARIO_CREADO", propietario.id, {
      email: negocioDef.emailPropietario,
      rol: "NEGOCIO",
    });

    const area = await prisma.area.findUniqueOrThrow({
      where: { slug: negocioDef.areaSlug },
      select: { id: true },
    });

    const subarea = await prisma.subarea.findUniqueOrThrow({
      where: { slug: `${negocioDef.areaSlug}-${negocioDef.subareaSlug}` },
      select: { id: true },
    });

    const negocio = await prisma.negocio.upsert({
      where: { id: negocioId },
      update: {
        nombre: negocioDef.nombre,
        slug: negocioDef.slug,
        userId: propietario.id,
        descripcion: negocioDef.descripcion,
        provincia: negocioDef.provincia,
        municipio: negocioDef.municipio,
        telefono: negocioDef.telefono,
        emailContacto: negocioDef.emailContacto,
        direccion: negocioDef.direccionCompleta,
        activo: true,
        estado: "ACTIVO",
        aprobadoPorId: admin?.id ?? null,
        aprobadoEn: new Date(0),
        regimenFiscal: negocioDef.regimenFiscal as Prisma.RegimenFiscal,
        tasaIVA: negocioDef.tasaIVA,
        modoPrecio: "IVA_INCLUIDO" as Prisma.ModoPrecio,
        nit: negocioDef.nit,
        prefijoFactura: "PR",
        numeroFacturaConsecutivo: 0,
        permiteReservas: negocioDef.permiteReservas,
        permiteEnvio: negocioDef.permiteEnvio,
        areaId: area.id,
      },
      create: {
        id: negocioId,
        nombre: negocioDef.nombre,
        slug: negocioDef.slug,
        userId: propietario.id,
        descripcion: negocioDef.descripcion,
        provincia: negocioDef.provincia,
        municipio: negocioDef.municipio,
        telefono: negocioDef.telefono,
        emailContacto: negocioDef.emailContacto,
        direccion: negocioDef.direccionCompleta,
        activo: true,
        estado: "ACTIVO",
        aprobadoPorId: admin?.id ?? null,
        aprobadoEn: admin ? new Date() : undefined,
        regimenFiscal: negocioDef.regimenFiscal as Prisma.RegimenFiscal,
        tasaIVA: negocioDef.tasaIVA,
        modoPrecio: "IVA_INCLUIDO" as Prisma.ModoPrecio,
        nit: negocioDef.nit,
        direccionFiscal: negocioDef.direccionCompleta,
        telefonoFiscal: negocioDef.telefono,
        emailFiscal: negocioDef.emailContacto,
        prefijoFactura: "PR",
        numeroFacturaConsecutivo: 0,
        permiteReservas: negocioDef.permiteReservas,
        permiteEnvio: negocioDef.permiteEnvio,
        areaId: area.id,
      },
    });

    await logSeed("SEED_NEGOCIO_CREADO", negocio.id, {
      nombre: negocioDef.nombre,
      emailPropietario: negocioDef.emailPropietario,
      regimenFiscal: negocioDef.regimenFiscal,
    });
    console.log(`  Negocio: ${negocioDef.nombre} (${negocioDef.municipio})`);

    // NegocioSubarea link
    await prisma.negocioSubarea.upsert({
      where: { negocioId_subareaId: { negocioId: negocio.id, subareaId: subarea.id } },
      update: {},
      create: { negocioId: negocio.id, subareaId: subarea.id },
    });

    // Horarios
    for (const h of HOJAS_HORARIO) {
      await prisma.horarioNegocio.upsert({
        where: { negocioId_diaSemana: { negocioId: negocio.id, diaSemana: h.diaSemana } },
        update: {
          horaApertura: h.horaApertura,
          horaCierre: h.horaCierre,
          cerrado: h.cerrado,
        },
        create: {
          negocioId: negocio.id,
          diaSemana: h.diaSemana,
          horaApertura: h.horaApertura,
          horaCierre: h.horaCierre,
          cerrado: h.cerrado,
        },
      });
    }

    // Productos + inventario + disponibilidad
    const hoy = new Date();
    for (let i = 0; i < negocioDef.productos.length; i++) {
      const prodDef = negocioDef.productos[i];
      const prodId = `seed-prod-${negocioDef.slug}-${i}`;
      const imagenUrl = `https://placehold.co/64x64/png?text=${encodeURIComponent(prodDef.nombre.substring(0, 10))}`;

      const producto = await prisma.producto.upsert({
        where: { id: prodId },
        update: {
          nombre: prodDef.nombre,
          descripcion: prodDef.descripcion,
          precio: prodDef.precio,
          unidadMedida: prodDef.unidadMedida,
          imagenUrl,
          tratamientoIVA: prodDef.tratamientoIVA as Prisma.TratamientoIVA,
        },
        create: {
          id: prodId,
          negocioId: negocio.id,
          subareaId: subarea.id,
          nombre: prodDef.nombre,
          descripcion: prodDef.descripcion,
          precio: prodDef.precio,
          unidadMedida: prodDef.unidadMedida,
          imagenUrl,
          tratamientoIVA: prodDef.tratamientoIVA as Prisma.TratamientoIVA,
        },
      });

      // Inventario
      const inventarioExistente = await prisma.inventario.findFirst({
        where: { productoId: producto.id },
      });
      if (!inventarioExistente) {
        await prisma.inventario.create({
          data: {
            productoId: producto.id,
            cantidadActual: 50 + i * 10,
            puntoReorden: 10,
            ubicacion: "Almacén principal",
          },
        });
      } else {
        await prisma.inventario.update({
          where: { id: inventarioExistente.id },
          data: {
            cantidadActual: 50 + i * 10,
            puntoReorden: 10,
            ubicacion: "Almacén principal",
          },
        });
      }

      // Disponibilidad para los próximos 7 días
      for (let d = 0; d < 7; d++) {
        const fecha = normalizeDate(addDays(hoy, d));
        await prisma.disponibilidadProducto.upsert({
          where: { productoId_fecha: { productoId: producto.id, fecha } },
          update: { cantidad: 15 + i * 5 },
          create: {
            productoId: producto.id,
            fecha,
            cantidad: 15 + i * 5,
          },
        });
      }

      console.log(`    Producto: ${prodDef.nombre} (${prodDef.tratamientoIVA})`);
    }

    // Servicios
    for (let i = 0; i < negocioDef.servicios.length; i++) {
      const servDef = negocioDef.servicios[i];
      const servId = `seed-serv-${negocioDef.slug}-${i}`;

      await prisma.servicio.upsert({
        where: { id: servId },
        update: {
          nombre: servDef.nombre,
          descripcion: servDef.descripcion,
          duracionMinutos: servDef.duracionMinutos,
          capacidad: servDef.tipo === "TRANSPORTE" ? 1 : servDef.capacidad,
          precio: servDef.precio ?? 0,
          horariosDisponibles: servDef.horariosDisponibles,
          tratamientoIVA: servDef.tratamientoIVA as Prisma.TratamientoIVA,
          tipo: servDef.tipo ?? "SERVICIO_GENERAL",
          tipoTransporte: servDef.tipoTransporte ?? undefined,
          pesoMaximo: servDef.pesoMaximo != null ? new Prisma.Decimal(servDef.pesoMaximo) : undefined,
          dimensionesMaximas: servDef.dimensionesMaximas ?? undefined,
          origenBase: servDef.origenBase ?? undefined,
          destinoBase: servDef.destinoBase ?? undefined,
          alcanceNacional: servDef.alcanceNacional ?? false,
        },
        create: {
          id: servId,
          negocioId: negocio.id,
          subareaId: subarea.id,
          nombre: servDef.nombre,
          descripcion: servDef.descripcion,
          duracionMinutos: servDef.duracionMinutos,
          capacidad: servDef.tipo === "TRANSPORTE" ? 1 : servDef.capacidad,
          precio: servDef.precio ?? 0,
          horariosDisponibles: servDef.horariosDisponibles,
          imagenUrl: `https://placehold.co/64x64/png?text=${encodeURIComponent(servDef.nombre.substring(0, 10))}`,
          tratamientoIVA: servDef.tratamientoIVA as Prisma.TratamientoIVA,
          tipo: servDef.tipo ?? "SERVICIO_GENERAL",
          tipoTransporte: servDef.tipoTransporte ?? undefined,
          pesoMaximo: servDef.pesoMaximo != null ? new Prisma.Decimal(servDef.pesoMaximo) : undefined,
          dimensionesMaximas: servDef.dimensionesMaximas ?? undefined,
          origenBase: servDef.origenBase ?? undefined,
          destinoBase: servDef.destinoBase ?? undefined,
          alcanceNacional: servDef.alcanceNacional ?? false,
        },
      });

      console.log(`    Servicio: ${servDef.nombre}`);
    }

    // Opciones logísticas
    const proveedoresLogisticos = await prisma.proveedorLogistico.findMany({
      where: { activo: true },
    });

    for (let i = 0; i < proveedoresLogisticos.length; i++) {
      const prov = proveedoresLogisticos[i];
      const tipos = ["domicilio", "express", "programada"];

      for (let t = 0; t < tipos.length; t++) {
        const tipo = tipos[t];
        const opcId = `seed-opc-${negocioDef.slug}-${prov.id}-${tipo}`;

        const opciones = [
          { nombre: "Envío estándar", tipo: "DOMICILIO", tarifaBase: 2.99, tarifaPorDistancia: 0.5, tiempoEstimado: "24-48 horas" },
          { nombre: "Envío exprés", tipo: "EXPRESS", tarifaBase: 5.99, tarifaPorDistancia: 1.0, tiempoEstimado: "12 horas" },
          { nombre: "Entrega programada", tipo: "PROGRAMADA", tarifaBase: 9.99, tarifaPorDistancia: 0.3, tiempoEstimado: "2-3 días" },
        ];

        const opts = opciones[t];
        if (!opts || (tipo === "programada" && i !== proveedoresLogisticos.length - 1)) continue;

        const existingOpc = await prisma.opcionLogistica.findFirst({
          where: { negocioId: negocio.id, proveedorId: prov.id, tipo: opts.tipo },
        });

        if (!existingOpc) {
          await prisma.opcionLogistica.create({
            data: {
              id: opcId,
              negocioId: negocio.id,
              proveedorId: prov.id,
              nombre: opts.nombre,
              tipo: opts.tipo,
              tarifaBase: opts.tarifaBase,
              tarifaPorDistancia: opts.tarifaPorDistancia,
              tiempoEstimado: opts.tiempoEstimado,
            },
          });
          console.log(`    Opción logística: ${opts.nombre} (${prov.nombre})`);
        }
      }
    }
  }
}

async function seedTokensReset() {
  console.log("→ Seed: Tokens de reset");

  const cliente1 = await prisma.user.findUnique({
    where: { email: "cliente1@test.com" },
    select: { id: true, email: true },
  });

  const cliente2 = await prisma.user.findUnique({
    where: { email: "cliente2@test.com" },
    select: { id: true, email: true },
  });

  if (cliente1 && cliente1.email) {
    const tokenPlano = generateResetToken();
    const tokenHash = hashToken(tokenPlano);
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.verificationToken.deleteMany({ where: { identifier: cliente1.email } });
    await prisma.verificationToken.create({
      data: { identifier: cliente1.email, token: tokenHash, expires },
    });
    console.log(`  Token válido: ${cliente1.email} (expira en 1h)`);
  }

  if (cliente2 && cliente2.email) {
    const tokenPlano = generateResetToken();
    const tokenHash = hashToken(tokenPlano);
    const expired = new Date(Date.now() - 60 * 60 * 1000);

    await prisma.verificationToken.deleteMany({ where: { identifier: cliente2.email } });
    await prisma.verificationToken.create({
      data: { identifier: cliente2.email, token: tokenHash, expires: expired },
    });
    console.log(`  Token expirado: ${cliente2.email} (expirado)`);
  }
}

async function seedSolicitudAlta() {
  console.log("→ Seed: Solicitud de alta");

  const existing = await prisma.solicitudAltaNegocio.count();
  if (existing > 0) {
    console.log("  Solicitudes ya existen, saltando");
    return;
  }

  const cliente = await prisma.user.findFirst({
    where: { email: "cliente3@test.com" },
    select: { id: true },
  });

  if (!cliente) {
    console.log("  ERROR: No se encontró cliente para solicitud");
    return;
  }

  const area = await prisma.area.findFirst({
    where: { slug: "comida-restaurantes" },
    select: { id: true },
  });

  if (!area) {
    console.log("  ERROR: No se encontró área para solicitud");
    return;
  }

  await prisma.solicitudAltaNegocio.create({
    data: {
      id: "seed-solicitud-1",
      userId: cliente.id,
      nombreNegocio: "Confitería La Esquina",
      descripcion: "Confitería con productos caseros y café de especialidad",
      areaId: area.id,
      provincia: "Pinar del Río",
      municipio: "Pinar del Río",
      telefono: "559-999888",
      emailContacto: "contacto@confiterialaesquina.com",
      direccion: "Calle Martí #456, Pinar del Río",
      estado: "PENDIENTE_APROBACION",
    },
  });

  await logSeed("SEED_SOLICITUD_CREADA", "seed-solicitud-1", {
    nombreNegocio: "Confitería La Esquina",
    emailSolicitante: "cliente3@test.com",
    provincia: "Pinar del Río",
    municipio: "Pinar del Río",
  });

  console.log("  Solicitud: Confitería La Esquina (PENDIENTE_APROBACION)");
}

async function seedDescuentos() {
  console.log("→ Seed: Promociones, cupones y combos");

  const negocio = await prisma.negocio.findFirst({
    where: { slug: "panaderia-la-espiga" },
    select: { id: true },
  });

  if (!negocio) {
    console.log("  ERROR: No se encontró negocio para descuentos");
    return;
  }

  // Promoción: 10% de descuento en Pan de higo y Pastelitos de guayaba
  const productosPromo = await prisma.producto.findMany({
    where: {
      negocioId: negocio.id,
      nombre: { in: ["Pan de higo", "Pastelitos de guayaba"] },
    },
    select: { id: true },
  });

  const promoIds = productosPromo.map((p) => p.id);

  await prisma.promocion.upsert({
    where: { id: "seed-promo-10pct" },
    update: {
      productoIds: JSON.stringify(promoIds),
    },
    create: {
      id: "seed-promo-10pct",
      negocioId: negocio.id,
      nombre: "10% dcto Panadería",
      descripcion: "10% de descuento en pan de higo y pastelitos de guayaba",
      tipo: "PORCENTAJE",
      valor: new Prisma.Decimal(10),
      estado: "ACTIVA",
      productoIds: JSON.stringify(promoIds),
      fechaInicio: new Date(),
      fechaFin: addDays(new Date(), 30),
      usosMaximos: 1000,
      usosActuales: 0,
    },
  });
  console.log("  Promoción: 10% dcto Panadería");

  // Cupón: 5$ de descuento en compras > 50$
  await prisma.cupon.upsert({
    where: { codigo: "BIENVENIDO10" },
    update: {},
    create: {
      id: "seed-cupon-bienvenido10",
      codigo: "BIENVENIDO10",
      descripcion: "$10 de descuento en tu primera compra sobre $50",
      tipo: "MONTO_FIJO",
      valor: new Prisma.Decimal(10),
      negocioId: negocio.id,
      montoMinimo: new Prisma.Decimal(50),
      estado: "ACTIVO",
      fechaInicio: new Date(),
      fechaFin: addDays(new Date(), 90),
      usosMaximos: 500,
      usosActuales: 0,
      unaVezPorUsuario: true,
      primeraCompra: true,
    },
  });
  console.log("  Cupón: BIENVENIDO10 ($10 dcto primera compra)");

  // Combo: Pack de 3 productos por 5$ (valor original: 8.0)
  if (productosPromo.length >= 2) {
    const comboProductos = await prisma.producto.findMany({
      where: {
        negocioId: negocio.id,
        nombre: { in: ["Croissant", "Galletas María", "Jugo de naranja natural"] },
      },
      select: { id: true },
    });

    const comboItems = comboProductos.map((p) => ({
      productoId: p.id,
      cantidad: 1,
    }));

    if (comboItems.length === 3) {
      await prisma.combo.upsert({
        where: { id: "seed-combo-pack-panaderia" },
        update: {
          items: {
            deleteMany: {},
            create: comboItems,
          },
        },
        create: {
          id: "seed-combo-pack-panaderia",
          negocioId: negocio.id,
          nombre: "Pack Desayuno",
          descripcion: "Croissant + Galletas María + Jugo de naranja",
          precio: new Prisma.Decimal(5.0),
          activo: true,
          fechaInicio: new Date(),
          fechaFin: addDays(new Date(), 30),
          usosMaximos: 500,
          usosActuales: 0,
          items: {
            create: comboItems,
          },
        },
      });
      console.log("  Combo: Pack Desayuno ($5 por 3 productos)");
    }
  }
}

async function seedNotificaciones() {
  console.log("→ Seed: Notificaciones");

  const TODOS_TIPOS = [
    "PEDIDO_CREADO", "PEDIDO_ESTADO_CAMBIADO", "PEDIDO_ASIGNADO_LOGISTICA",
    "RESERVA_CREADA", "RESERVA_CANCELADA",
    "PAGO_COMPROBANTE_SUBIDO", "PAGO_CONFIRMADO", "PAGO_RECHAZADO", "PAGO_REEMBOLSADO",
    "CODIGO_ENTREGA_REGENERADO",
    "SOLICITUD_ALTA_CREADA", "SOLICITUD_ALTA_APROBADA", "SOLICITUD_ALTA_RECHAZADA",
    "DISPONIBILIDAD_AGOTADA", "STOCK_BAJO",
    "TRANSPORTE_CONTRATADO",
    "CUPON_PROXIMO_A_EXPIRAR", "PROMOCION_AGOTADA",
    "BIENVENIDA", "PASSWORD_CAMBIADO", "LOGIN_NUEVO_DISPOSITIVO",
  ] as const;

  // Usuarios de referencia (deben existir tras seedUsuariosBase + seedAdminGenerico)
  const usuariosRef = await prisma.user.findMany({
    where: {
      email: { in: ["admin@mi-pyme.local", "cliente1@test.com", "cliente2@test.com", "cliente3@test.com"] },
    },
    select: { id: true, email: true, rol: true },
  });

  const emailAUsuario = new Map(usuariosRef.map((u) => [u.email, u]));

  // Crear preferencias por defecto para usuarios base (todas activas
  // excepto LOGIN_NUEVO_DISPOSITIVO que es opt-in).
  for (const u of usuariosRef) {
    for (const tipo of TODOS_TIPOS) {
      await prisma.preferenciaNotificacion.upsert({
        where: { userId_tipo: { userId: u.id, tipo: tipo as typeof TODOS_TIPOS[number] } },
        update: {},
        create: {
          userId: u.id,
          tipo: tipo as typeof TODOS_TIPOS[number],
          inApp: true,
          email: tipo !== "LOGIN_NUEVO_DISPOSITIVO",
        },
      });
    }
    await logSeed("SEED_PREFERENCIAS_NOTIFICACION", u.id, {
      cantidadTipos: TODOS_TIPOS.length,
    });
  }
  console.log("  Preferencias creadas para usuarios base");

  // Crear notificaciones de ejemplo para el cliente1
  const cliente1 = emailAUsuario.get("cliente1@test.com");
  if (cliente1) {
    const ahora = new Date();
    const ejemplos = [
      {
        tipo: "PEDIDO_ESTADO_CAMBIADO" as const,
        titulo: "Tu pedido #PED-001 cambió de estado",
        mensaje: "Tu pedido está en camino para ser entregado.",
        enlace: "/pedidos",
      },
      {
        tipo: "PAGO_CONFIRMADO" as const,
        titulo: "Pago confirmado",
        mensaje: "Tu pago de 100 CUP ha sido confirmado exitosamente.",
        enlace: "/pagos",
      },
      {
        tipo: "BIENVENIDA" as const,
        titulo: "¡Bienvenido a Mi-Pyme!",
        mensaje: "Gracias por registrarte. Explora nuestro catálogo.",
        enlace: "/catalogo",
      },
    ];

    for (let i = 0; i < ejemplos.length; i++) {
      const e = ejemplos[i];
      await prisma.notificacion.upsert({
        where: { id: `seed-notif-${cliente1.id}-${i}` },
        update: { titulo: e.titulo, mensaje: e.mensaje },
        create: {
          id: `seed-notif-${cliente1.id}-${i}`,
          userId: cliente1.id,
          tipo: e.tipo,
          estado: i === 0 ? "NO_LEIDA" : "LEIDA",
          titulo: e.titulo,
          mensaje: e.mensaje,
          enlace: e.enlace,
          leidaEn: i > 0 ? new Date(ahora.getTime() - 86400000) : undefined,
        },
      });
    }
    await logSeed("SEED_NOTIFICACIONES_EJEMPLO", cliente1.id, {
      cantidad: ejemplos.length,
    });
    console.log("  Notificaciones de ejemplo creadas para cliente1@test.com");
  }

  // Crear notificación de ejemplo para el admin
  const admin = emailAUsuario.get("admin@mi-pyme.local");
  if (admin) {
    await prisma.notificacion.upsert({
      where: { id: "seed-notif-admin-solicitud" },
      update: { titulo: "Nueva solicitud de alta", mensaje: "Hay una nueva solicitud pendiente." },
      create: {
        id: "seed-notif-admin-solicitud",
        userId: admin.id,
        tipo: "SOLICITUD_ALTA_CREADA",
        estado: "NO_LEIDA",
        titulo: "Nueva solicitud de alta",
        mensaje: "Hay una nueva solicitud de alta de negocio pendiente de aprobación.",
        enlace: "/admin/solicitudes",
      },
    });
    await logSeed("SEED_NOTIFICACION_EJEMPLO_ADMIN", admin.id, {});
    console.log("  Notificación de ejemplo creada para admin@mi-pyme.local");
  }
}

async function main() {
  console.log("=== Mi-Pyme Seed (idempotente) ===\n");

  await seedAdminGenerico();
  console.log("");

  await seedUsuariosBase();
  console.log("");

  await seedUsuariosAuthTest();
  console.log("");

  await seedAreasYSubareas();
  console.log("");

  await seedProveedoresLogisticos();
  console.log("");

  await seedNegociosYDatos();
  console.log("");

  await seedTokensReset();
  console.log("");

  await seedSolicitudAlta();
  console.log("");

  await seedDescuentos();
  console.log("");

  await seedNotificaciones();
  console.log("");

  const counts = await prisma.$transaction([
    prisma.user.count(),
    prisma.negocio.count(),
    prisma.producto.count(),
    prisma.servicio.count(),
    prisma.inventario.count(),
    prisma.disponibilidadProducto.count(),
    prisma.area.count(),
    prisma.subarea.count(),
    prisma.proveedorLogistico.count(),
    prisma.opcionLogistica.count(),
    prisma.horarioNegocio.count(),
    prisma.solicitudAltaNegocio.count(),
    prisma.verificationToken.count(),
    prisma.promocion.count(),
    prisma.cupon.count(),
    prisma.combo.count(),
    prisma.notificacion.count(),
    prisma.preferenciaNotificacion.count(),
    prisma.auditLog.count(),
  ]);

  console.log("=== Resumen final ===");
  console.log(`  Usuarios:              ${counts[0]}`);
  console.log(`  Negocios:              ${counts[1]}`);
  console.log(`  Productos:             ${counts[2]}`);
  console.log(`  Servicios:             ${counts[3]}`);
  console.log(`  Inventario:            ${counts[4]}`);
  console.log(`  Disponibilidad:        ${counts[5]}`);
  console.log(`  Áreas:                 ${counts[6]}`);
  console.log(`  Subáreas:              ${counts[7]}`);
  console.log(`  Proveedores:           ${counts[8]}`);
  console.log(`  Opciones logísticas:   ${counts[9]}`);
  console.log(`  Horarios negocio:      ${counts[10]}`);
  console.log(`  Solicitudes alta:      ${counts[11]}`);
  console.log(`  Tokens de reset:       ${counts[12]}`);
  console.log(`  Promociones:           ${counts[13]}`);
  console.log(`  Cupones:               ${counts[14]}`);
  console.log(`  Combos:                ${counts[15]}`);
  console.log(`  Notificaciones:        ${counts[16]}`);
  console.log(`  Preferencias notif.:   ${counts[17]}`);
  console.log(`  Audit logs:            ${counts[18]}`);

  console.log("\nSeed completado.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
