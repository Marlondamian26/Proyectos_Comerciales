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
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";
import bcrypt from "bcryptjs";

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL ?? "";
  const connectionString = rawUrl
    .replace(/[?&]sslmode=verify-full/, "")
    .replace(/[?&]sslmode=require/, "");
  const adapter = new PrismaPg({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
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

interface AreaDef {
  slug: string;
  nombre: string;
  subareas: { slug: string; nombre: string }[];
}

interface ProvinciaDef {
  slug: string;
  nombre: string;
}

interface MunicipioDef {
  slug: string;
  nombre: string;
  provinciaSlug: string;
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
  prefijoFactura: string;
  permiteReservas: boolean;
  permiteEnvio: boolean;
  productos: ProductoDef[];
  servicios: ServicioDef[];
}

const PROVINCIAS: ProvinciaDef[] = [
  { slug: "pinar-del-rio", nombre: "Pinar del Río" },
  { slug: "artemisa", nombre: "Artemisa" },
  { slug: "la-habana", nombre: "La Habana" },
  { slug: "mayabeque", nombre: "Mayabeque" },
  { slug: "matanzas", nombre: "Matanzas" },
  { slug: "villa-clara", nombre: "Villa Clara" },
  { slug: "cienfuegos", nombre: "Cienfuegos" },
  { slug: "santos-spiritus", nombre: "Sancti Spíritus" },
  { slug: "ciego-de-avila", nombre: "Ciego de Ávila" },
  { slug: "camaguey", nombre: "Camagüey" },
  { slug: "las-tunas", nombre: "Las Tunas" },
  { slug: "granma", nombre: "Granma" },
  { slug: "holguin", nombre: "Holguín" },
  { slug: "santiago-de-cuba", nombre: "Santiago de Cuba" },
  { slug: "guantanamo", nombre: "Guantánamo" },
  { slug: "isla-juventud", nombre: "Isla de la Juventud" },
];

const MUNICIPIOS: MunicipioDef[] = [
  { slug: "pinar-del-rio", nombre: "Pinar del Río", provinciaSlug: "pinar-del-rio" },
  { slug: "consolacion-del-sur", nombre: "Consolación del Sur", provinciaSlug: "pinar-del-rio" },
  { slug: "guane", nombre: "Guane", provinciaSlug: "pinar-del-rio" },
  { slug: "la-palma", nombre: "La Palma", provinciaSlug: "pinar-del-rio" },
  { slug: "los-palacios", nombre: "Los Palacios", provinciaSlug: "pinar-del-rio" },
  { slug: "mantua", nombre: "Mantua", provinciaSlug: "pinar-del-rio" },
  { slug: "minas-de-matahambre", nombre: "Minas de Matahambre", provinciaSlug: "pinar-del-rio" },
  { slug: "san-juan-y-martinez", nombre: "San Juan y Martínez", provinciaSlug: "pinar-del-rio" },
  { slug: "san-luis", nombre: "San Luis", provinciaSlug: "pinar-del-rio" },
  { slug: "sandino", nombre: "Sandino", provinciaSlug: "pinar-del-rio" },
  { slug: "vinales", nombre: "Viñales", provinciaSlug: "pinar-del-rio" },
  { slug: "plaza-de-la-revolucion", nombre: "Plaza de la Revolución", provinciaSlug: "la-habana" },
  { slug: "vedado", nombre: "Vedado", provinciaSlug: "la-habana" },
  { slug: "centro-habana", nombre: "Centro Habana", provinciaSlug: "la-habana" },
  { slug: "habana-vieja", nombre: "Habana Vieja", provinciaSlug: "la-habana" },
  { slug: "marianao", nombre: "Marianao", provinciaSlug: "la-habana" },
  { slug: "cerro", nombre: "Cerro", provinciaSlug: "la-habana" },
  { slug: "diez-de-octubre", nombre: "Diez de Octubre", provinciaSlug: "la-habana" },
  { slug: "playa", nombre: "Playa", provinciaSlug: "la-habana" },
];

const AREAS: AreaDef[] = [
  {
    slug: "aseo-limpieza",
    nombre: "Aseo y Limpieza",
    subareas: [
      { slug: "detergentes", nombre: "Detergentes" },
      { slug: "jabones", nombre: "Jabones" },
      { slug: "desinfectantes", nombre: "Desinfectantes" },
      { slug: "articulos-limpieza", nombre: "Artículos de limpieza" },
      { slug: "ambientadores", nombre: "Ambientadores" },
    ],
  },
  {
    slug: "alimentos",
    nombre: "Alimentos",
    subareas: [
      { slug: "carnicos", nombre: "Cárnicos" },
      { slug: "bebidas", nombre: "Bebidas" },
      { slug: "lacteos", nombre: "Lácteos" },
      { slug: "granos", nombre: "Granos y cereales" },
      { slug: "vegetales-frutas", nombre: "Vegetales y frutas" },
      { slug: "panaderia-reposteria", nombre: "Panadería y repostería" },
      { slug: "dulces-conservas", nombre: "Dulces y conservas" },
      { slug: "condimentos", nombre: "Condimentos" },
    ],
  },
  {
    slug: "electrodomesticos",
    nombre: "Electrodomésticos",
    subareas: [
      { slug: "linea-blanca", nombre: "Línea blanca" },
      { slug: "pequenos-electrodomesticos", nombre: "Pequeños electrodomésticos" },
      { slug: "accesorios-repuestos", nombre: "Accesorios y repuestos" },
      { slug: "climatizacion", nombre: "Climatización" },
    ],
  },
  {
    slug: "salud-belleza",
    nombre: "Salud y Belleza",
    subareas: [
      { slug: "medicamentos", nombre: "Medicamentos" },
      { slug: "cosmeticos", nombre: "Cosméticos" },
      { slug: "cuidado-personal", nombre: "Cuidado personal" },
      { slug: "peluqueria", nombre: "Peluquería" },
      { slug: "barberia", nombre: "Barbería" },
      { slug: "estetica", nombre: "Estética" },
      { slug: "spa", nombre: "Spa" },
    ],
  },
  {
    slug: "comida-restaurantes",
    nombre: "Comida y Restaurantes",
    subareas: [
      { slug: "comida-criolla", nombre: "Comida criolla" },
      { slug: "comida-rapida", nombre: "Comida rápida" },
      { slug: "pizzeria", nombre: "Pizzería" },
      { slug: "cafeteria", nombre: "Cafetería" },
      { slug: "reposteria", nombre: "Repostería" },
      { slug: "comida-internacional", nombre: "Comida internacional" },
      { slug: "parrillada", nombre: "Parrillada" },
    ],
  },
  {
    slug: "servicios-profesionales",
    nombre: "Servicios Profesionales",
    subareas: [
      { slug: "reparaciones", nombre: "Reparaciones" },
      { slug: "electricidad", nombre: "Electricidad" },
      { slug: "plomeria", nombre: "Plomería" },
      { slug: "carpinteria", nombre: "Carpintería" },
      { slug: "pintura", nombre: "Pintura" },
      { slug: "albanileria", nombre: "Albañilería" },
      { slug: "servicios-legales", nombre: "Servicios legales" },
      { slug: "contabilidad", nombre: "Contabilidad" },
    ],
  },
  {
    slug: "tecnologia",
    nombre: "Tecnología",
    subareas: [
      { slug: "telefonia", nombre: "Telefonía" },
      { slug: "informatica", nombre: "Informática" },
      { slug: "accesorios", nombre: "Accesorios" },
      { slug: "reparacion-equipos", nombre: "Reparación de equipos" },
      { slug: "servicios-digitales", nombre: "Servicios digitales" },
    ],
  },
  {
    slug: "textil-moda",
    nombre: "Textil y Moda",
    subareas: [
      { slug: "ropa-mujer", nombre: "Ropa de mujer" },
      { slug: "ropa-hombre", nombre: "Ropa de hombre" },
      { slug: "ropa-infantil", nombre: "Ropa infantil" },
      { slug: "calzado", nombre: "Calzado" },
      { slug: "accesorios", nombre: "Accesorios" },
      { slug: "confeccion", nombre: "Confección" },
    ],
  },
  {
    slug: "transporte",
    nombre: "Transporte",
    subareas: [
      { slug: "envio-paquetes", nombre: "Envío de paquetes" },
      { slug: "mudanzas", nombre: "Mudanzas" },
      { slug: "traslado-muebles", nombre: "Traslado de muebles" },
      { slug: "transporte-personas", nombre: "Transporte de personas" },
      { slug: "transporte-carga", nombre: "Transporte de carga" },
    ],
  },
];

function horarioBloqueador(): Record<string, string[]> {
  return {};
}

function horarioServicioGeneral(): Record<string, string[]> {
  return {
    lunes: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
    martes: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
    miercoles: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
    jueves: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
    viernes: ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
  };
}

const NEGOCIOS: NegocioDef[] = [
  {
    slug: "pizzeria-bella-napoli",
    nombre: "Pizzería Bella Napoli",
    descripcion: "Pizzería artesanal con auténtica pizza napolitana en el corazón de Pinar del Río",
    emailPropietario: "negocio.pizzeria@test.com",
    usernamePropietario: "pizzeria",
    nombrePropietario: "David Rodríguez",
    areaSlug: "comida-restaurantes",
    subareaSlug: "pizzeria",
    municipio: "Pinar del Río",
    provincia: "Pinar del Río",
    telefono: "559-100200",
    emailContacto: "contacto@pizzeriabellanapoli.com",
    direccionCompleta: "Av. Martí #301, Pinar del Río",
    nit: "PZN-0001-001",
    regimenFiscal: "GENERAL",
    tasaIVA: 10,
    prefijoFactura: "PR",
    permiteReservas: true,
    permiteEnvio: true,
    productos: [
      { nombre: "Pizza Margarita", descripcion: "Pizza clásica con mozzarella, tomate y albahaca", precio: 8, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Pizza Pepperoni", descripcion: "Pizza con pepperoni y mozzarella fundida", precio: 10, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Pizza Napolitana", descripcion: "Pizza con tomate, aceitunas y orégano", precio: 9, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Pizza Hawaiana", descripcion: "Pizza con jamón y piña", precio: 11, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Pan de ajo", descripcion: "Pan de ajo recién horneado con mantequilla", precio: 3, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Refresco lata", descripcion: "Refresco gaseoso de 330ml", precio: 2, unidadMedida: "lata", tratamientoIVA: "GRAVADO" },
      { nombre: "Cerveza", descripcion: "Cerveza bien fría de 330ml", precio: 3, unidadMedida: "botella", tratamientoIVA: "GRAVADO" },
      { nombre: "Agua", descripcion: "Agua mineral de 500ml", precio: 1, unidadMedida: "botella", tratamientoIVA: "GRAVADO" },
    ],
    servicios: [
      {
        nombre: "Reserva de mesa",
        descripcion: " reserva de mesa para grupos de hasta 6 personas",
        duracionMinutos: 30,
        capacidad: 6,
        precio: 0,
        horariosDisponibles: horarioServicioGeneral(),
        tratamientoIVA: "NO_SUJETO",
      },
      {
        nombre: "Servicio a domicilio",
        descripcion: "Entrega de pedidos a domicilio en Pinar del Río y alrededores",
        duracionMinutos: 45,
        capacidad: 10,
        precio: 0,
        horariosDisponibles: horarioServicioGeneral(),
        tratamientoIVA: "NO_SUJETO",
      },
    ],
  },
  {
    slug: "panaderia-la-espiga",
    nombre: "Panadería La Espiga",
    descripcion: "Panadería artesanal con productos frescos hechos en Pinar del Río",
    emailPropietario: "negocio.panaderia@test.com",
    usernamePropietario: "panaderia",
    nombrePropietario: "María González",
    areaSlug: "alimentos",
    subareaSlug: "panaderia-reposteria",
    municipio: "Pinar del Río",
    provincia: "Pinar del Río",
    telefono: "559-123456",
    emailContacto: "contacto@panaderialaespiga.com",
    direccionCompleta: "Calle 20 de julio #123, Pinar del Río",
    nit: "PLE-0002-001",
    regimenFiscal: "GENERAL",
    tasaIVA: 10,
    prefijoFactura: "PR",
    permiteReservas: false,
    permiteEnvio: true,
    productos: [
      { nombre: "Pan de molde", descripcion: "Pan de molde integral recién horneado", precio: 2, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Pan de agua", descripcion: "Pan de agua tradicional cubano", precio: 1, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Croissant", descripcion: "Croissant hojaldrado recién horneado", precio: 1.5, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Pastel de chocolate", descripcion: "Pastel húmedo con cobertura de chocolate negro", precio: 15, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Flan", descripcion: "Flan casero con caramelo", precio: 5, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Galletas", descripcion: "Galletas crujientes de mantequilla", precio: 3, unidadMedida: "paquete", tratamientoIVA: "GRAVADO" },
      { nombre: "Bizcocho", descripcion: "Bizcocho de vainilla con glaseado", precio: 12, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Bollo de guayaba", descripcion: "Bollo dulce con guayaba", precio: 2.5, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
    ],
    servicios: [
      {
        nombre: "Encargo de pasteles personalizados",
        descripcion: "Personalización de pasteles para eventos especiales",
        duracionMinutos: 60,
        capacidad: 5,
        precio: 25,
        horariosDisponibles: {
          lunes: ["09:00", "10:00", "11:00"],
          martes: ["09:00", "10:00", "11:00"],
          miercoles: ["09:00", "10:00", "11:00"],
          jueves: ["09:00", "10:00", "11:00"],
          viernes: ["09:00", "10:00", "11:00"],
        },
        tratamientoIVA: "GRAVADO",
      },
    ],
  },
  {
    slug: "ferreteria-el-tornillo",
    nombre: "Ferretería El Tornillo",
    descripcion: "Ferretería y artículos de limpieza para el hogar y oficina",
    emailPropietario: "negocio.ferreteria@test.com",
    usernamePropietario: "ferreteria",
    nombrePropietario: "Jorge Luis Pérez",
    areaSlug: "aseo-limpieza",
    subareaSlug: "articulos-limpieza",
    municipio: "Pinar del Río",
    provincia: "Pinar del Río",
    telefono: "559-234567",
    emailContacto: "contacto@ferreteriaeltornillo.com",
    direccionCompleta: "Calle Industria #45, Pinar del Río",
    nit: "FEL-0003-001",
    regimenFiscal: "GENERAL",
    tasaIVA: 10,
    prefijoFactura: "PR",
    permiteReservas: false,
    permiteEnvio: true,
    productos: [
      { nombre: "Detergente", descripcion: "Detergente líquido multiusos 1L", precio: 3, unidadMedida: "botella", tratamientoIVA: "GRAVADO" },
      { nombre: "Jabón de baño", descripcion: "Jabón de baño sólido con aroma a limón", precio: 1.5, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Cloro", descripcion: "Cloro hipoclorito al 5% 1L", precio: 2, unidadMedida: "botella", tratamientoIVA: "GRAVADO" },
      { nombre: "Escoba", descripcion: "Escoba de cerdas duras para pisos", precio: 5, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Trapeador", descripcion: "Trapeador de microfibra con mango", precio: 4, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Ambientador", descripcion: "Ambientador de spray con aroma a lavanda", precio: 3, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Papel higiénico", descripcion: "Rollo de papel higiénico doble capa", precio: 2, unidadMedida: "paquete", tratamientoIVA: "GRAVADO" },
      { nombre: "Guantes de látex", descripcion: "Guantes de látex talla única", precio: 1.5, unidadMedida: "par", tratamientoIVA: "GRAVADO" },
    ],
    servicios: [],
  },
  {
    slug: "salon-belleza-estrella",
    nombre: "Salón de Belleza Estrella",
    descripcion: "Salón de belleza y peluquería con servicios profesionales en Pinar del Río",
    emailPropietario: "negocio.salon@test.com",
    usernamePropietario: "salon",
    nombrePropietario: "Carmen Díaz",
    areaSlug: "salud-belleza",
    subareaSlug: "peluqueria",
    municipio: "Pinar del Río",
    provincia: "Pinar del Río",
    telefono: "559-345678",
    emailContacto: "contacto@salonestrella.com",
    direccionCompleta: "Calle Obispo #220, Pinar del Río",
    nit: "SBE-0004-001",
    regimenFiscal: "GENERAL",
    tasaIVA: 10,
    prefijoFactura: "PR",
    permiteReservas: true,
    permiteEnvio: false,
    productos: [
      { nombre: "Champú profesional", descripcion: "Champú para todo tipo de cabello 400ml", precio: 8, unidadMedida: "botella", tratamientoIVA: "GRAVADO" },
      { nombre: "Crema facial", descripcion: "Crema hidratante facial con antioxidantes", precio: 12, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Esmalte de uñas", descripcion: "Esmalte de uñas color rojo clásico", precio: 5, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
    ],
    servicios: [
      { nombre: "Corte de cabello", descripcion: "Corte de cabello con lavado, secado y peinado", duracionMinutos: 45, capacidad: 1, precio: 10, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO" },
      { nombre: "Peinado", descripcion: "Peinado con secado y estilo profesional", duracionMinutos: 30, capacidad: 1, precio: 15, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO" },
      { nombre: "Tinte", descripcion: "Aplicación de tinte capilar con protección total", duracionMinutos: 90, capacidad: 1, precio: 25, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO" },
      { nombre: "Manicure", descripcion: "Servicio completo de manicure con esmalte", duracionMinutos: 40, capacidad: 1, precio: 12, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO" },
      { nombre: "Pedicure", descripcion: "Servicio completo de pedicure con esmalte", duracionMinutos: 50, capacidad: 1, precio: 15, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO" },
      { nombre: "Maquillaje", descripcion: "Maquillaje profesional para eventos", duracionMinutos: 60, capacidad: 1, precio: 20, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO" },
      { nombre: "Tratamiento facial", descripcion: "Tratamiento facial completo con mascarilla y mascarilla", duracionMinutos: 60, capacidad: 1, precio: 30, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO" },
    ],
  },
  {
    slug: "bodega-la-esquina",
    nombre: "Bodega La Esquina",
    descripcion: "Bodega de productos básicos y consumibles en Viñales",
    emailPropietario: "negocio.bodega@test.com",
    usernamePropietario: "bodega",
    nombrePropietario: "Raúl Martínez",
    areaSlug: "alimentos",
    subareaSlug: "granos",
    municipio: "Viñales",
    provincia: "Pinar del Río",
    telefono: "559-456789",
    emailContacto: "contacto@bodegalaesquina.com",
    direccionCompleta: "Calle Principal #23, Viñales",
    nit: "BLE-0005-001",
    regimenFiscal: "SIMPLIFICADO",
    tasaIVA: 0,
    prefijoFactura: "PR",
    permiteReservas: false,
    permiteEnvio: true,
    productos: [
      { nombre: "Arroz", descripcion: "Arroz blanco de grano largo 1kg", precio: 2, unidadMedida: "kg", tratamientoIVA: "GRAVADO" },
      { nombre: "Frijoles", descripcion: "Frijoles negros de gran calidad 1kg", precio: 2.5, unidadMedida: "kg", tratamientoIVA: "GRAVADO" },
      { nombre: "Aceite", descripcion: "Aceite de soja vegetal 1L", precio: 4, unidadMedida: "botella", tratamientoIVA: "GRAVADO" },
      { nombre: "Azúcar", descripcion: "Azúcar morena refinada 1kg", precio: 1.5, unidadMedida: "kg", tratamientoIVA: "GRAVADO" },
      { nombre: "Café", descripcion: "Café molido oscuro 250g", precio: 8, unidadMedida: "paquete", tratamientoIVA: "GRAVADO" },
      { nombre: "Huevos", descripcion: "Docena de huevos frescos de gallina", precio: 3, unidadMedida: "docena", tratamientoIVA: "GRAVADO" },
      { nombre: "Leche en polvo", descripcion: "Leche en polvo descremada 500g", precio: 6, unidadMedida: "paquete", tratamientoIVA: "GRAVADO" },
      { nombre: "Pasta de dientes", descripcion: "Pasta de dientes blanqueador 100ml", precio: 1.5, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
    ],
    servicios: [],
  },
  {
    slug: "electrodomesticos-el-rayo",
    nombre: "Electrodomésticos El Rayo",
    descripcion: "Tienda de electrodomésticos y reparaciones en Pinar del Río",
    emailPropietario: "negocio.electro@test.com",
    usernamePropietario: "electro",
    nombrePropietario: "Andrés López",
    areaSlug: "electrodomesticos",
    subareaSlug: "linea-blanca",
    municipio: "Pinar del Río",
    provincia: "Pinar del Río",
    telefono: "559-567890",
    emailContacto: "contacto@electrodomesticoselrayo.com",
    direccionCompleta: "Av. Revolución #88, Pinar del Río",
    nit: "EER-0006-001",
    regimenFiscal: "GENERAL",
    tasaIVA: 10,
    prefijoFactura: "PR",
    permiteReservas: false,
    permiteEnvio: true,
    productos: [
      { nombre: "Ventilador", descripcion: "Ventilador de techo de 40 pulgadas", precio: 35, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Plancha", descripcion: "Plancha eléctrica de 220V con termostato", precio: 25, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Licuadora", descripcion: "Licuadora de vaso con 3 velocidades", precio: 40, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Radio", descripcion: "Radio portátil con Bluetooth y USB", precio: 30, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Bombillo LED", descripcion: "Bombillo LED 9W equivalente a 60W", precio: 2, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Extensión eléctrica", descripcion: "Extensión de 6 tomas con protección", precio: 5, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
    ],
    servicios: [
      {
        nombre: "Reparación de electrodomésticos",
        descripcion: "Servicio de reparación de electrodomésticos menores",
        duracionMinutos: 60,
        capacidad: 3,
        precio: 15,
        horariosDisponibles: horarioServicioGeneral(),
        tratamientoIVA: "GRAVADO",
      },
    ],
  },
  {
    slug: "farmacia-san-rafael",
    nombre: "Farmacia San Rafael",
    descripcion: "Farmacia de abastecimiento con medicamentos y productos de salud",
    emailPropietario: "negocio.farmacia@test.com",
    usernamePropietario: "farmacia",
    nombrePropietario: "Dra. Isabel Ruiz",
    areaSlug: "salud-belleza",
    subareaSlug: "medicamentos",
    municipio: "Pinar del Río",
    provincia: "Pinar del Río",
    telefono: "559-678901",
    emailContacto: "contacto@farmaciasanrafael.com",
    direccionCompleta: "Calle Real #145, Pinar del Río",
    nit: "FSR-0007-001",
    regimenFiscal: "EXENTO",
    tasaIVA: 0,
    prefijoFactura: "PR",
    permiteReservas: false,
    permiteEnvio: true,
    productos: [
      { nombre: "Paracetamol", descripcion: "Pastillas de paracetamol 500mg x 20", precio: 2, unidadMedida: "paquete", tratamientoIVA: "EXENTO" },
      { nombre: "Ibuprofeno", descripcion: "Pastillas de ibuprofeno 400mg x 20", precio: 3, unidadMedida: "paquete", tratamientoIVA: "EXENTO" },
      { nombre: "Vitamina C", descripcion: "Comprimidos de vitamina C 500mg x 30", precio: 5, unidadMedida: "paquete", tratamientoIVA: "EXENTO" },
      { nombre: "Alcohol", descripcion: "Alcohol etílico al 70% 500ml", precio: 2, unidadMedida: "botella", tratamientoIVA: "EXENTO" },
      { nombre: "Gasas", descripcion: "Gasas estériles de 10x10cm x 10", precio: 1, unidadMedida: "paquete", tratamientoIVA: "EXENTO" },
      { nombre: "Termómetro", descripcion: "Termómetro digital de uso clínico", precio: 8, unidadMedida: "unidad", tratamientoIVA: "EXENTO" },
    ],
    servicios: [],
  },
  {
    slug: "taller-el-mecanico",
    nombre: "Taller El Mecánico",
    descripcion: "Taller mecánico de confianza en Consolación del Sur",
    emailPropietario: "negocio.taller@test.com",
    usernamePropietario: "taller",
    nombrePropietario: "Luis Fernández",
    areaSlug: "servicios-profesionales",
    subareaSlug: "reparaciones",
    municipio: "Consolación del Sur",
    provincia: "Pinar del Río",
    telefono: "559-789012",
    emailContacto: "contacto@tallereilmecanico.com",
    direccionCompleta: "Calle Progreso #77, Consolación del Sur",
    nit: "TEM-0008-001",
    regimenFiscal: "GENERAL",
    tasaIVA: 10,
    prefijoFactura: "PR",
    permiteReservas: true,
    permiteEnvio: false,
    productos: [
      { nombre: "Aceite de motor", descripcion: "Aceite de motor 10W40 1L", precio: 15, unidadMedida: "botella", tratamientoIVA: "GRAVADO" },
      { nombre: "Filtros", descripcion: "Filtros de aceite para motores estándar", precio: 10, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Bujías", descripcion: "Bujías de encendido estándar x4", precio: 5, unidadMedida: "paquete", tratamientoIVA: "GRAVADO" },
    ],
    servicios: [
      { nombre: "Cambio de aceite", descripcion: "Servicio completo de cambio de aceite y filtro", duracionMinutos: 30, capacidad: 2, precio: 20, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO" },
      { nombre: "Reparación de frenos", descripcion: "Servicio de inspección y reparación de frenos", duracionMinutos: 90, capacidad: 1, precio: 40, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO" },
      { nombre: "Alineación", descripcion: "Servicio de alineación y balanceo de ruedas", duracionMinutos: 45, capacidad: 1, precio: 25, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO" },
      { nombre: "Diagnóstico", descripcion: "Diagnóstico completo del vehículo", duracionMinutos: 60, capacidad: 1, precio: 15, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO" },
      { nombre: "Reparación de motor", descripcion: "Reparación completa del motor vehicular", duracionMinutos: 240, capacidad: 1, precio: 100, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO" },
    ],
  },
  {
    slug: "boutique-maria",
    nombre: "Boutique María",
    descripcion: "Boutique de ropa y moda femenina en Pinar del Río",
    emailPropietario: "negocio.boutique@test.com",
    usernamePropietario: "boutique",
    nombrePropietario: "Sandra Morales",
    areaSlug: "textil-moda",
    subareaSlug: "ropa-mujer",
    municipio: "Pinar del Río",
    provincia: "Pinar del Río",
    telefono: "559-890123",
    emailContacto: "contacto@boutiquemaria.com",
    direccionCompleta: "Calle Martí #110, Pinar del Río",
    nit: "BMA-0009-001",
    regimenFiscal: "GENERAL",
    tasaIVA: 10,
    prefijoFactura: "PR",
    permiteReservas: false,
    permiteEnvio: true,
    productos: [
      { nombre: "Blusa", descripcion: "Blusa de lino con estampado floral", precio: 15, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Pantalón", descripcion: "Pantalón de tela recto de algodón", precio: 25, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Vestido", descripcion: "Vestido de verano con cinturón", precio: 35, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Falda", descripcion: "Falda de lino con cintura alta", precio: 20, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Zapatos", descripcion: "Zapatos de tacón bajo cuero sintético", precio: 40, unidadMedida: "par", tratamientoIVA: "GRAVADO" },
      { nombre: "Bolso", descripcion: "Bolso de mano con asa larga", precio: 30, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Collar", descripcion: "Collar de plata con dije", precio: 10, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Bufanda", descripcion: "Bufanda de seda con bordado", precio: 12, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
    ],
    servicios: [],
  },
  {
    slug: "tecnocell-cuba",
    nombre: "TecnoCell Cuba",
    descripcion: "Tienda de tecnología y accesorios electrónicos en Pinar del Río",
    emailPropietario: "negocio.tech@test.com",
    usernamePropietario: "tecnocell",
    nombrePropietario: "Roberto Díaz",
    areaSlug: "tecnologia",
    subareaSlug: "telefonia",
    municipio: "Pinar del Río",
    provincia: "Pinar del Río",
    telefono: "559-901234",
    emailContacto: "contacto@tecnocellcuba.com",
    direccionCompleta: "Av. Cents. #345, Pinar del Río",
    nit: "TCC-0010-001",
    regimenFiscal: "GENERAL",
    tasaIVA: 10,
    prefijoFactura: "PR",
    permiteReservas: false,
    permiteEnvio: true,
    productos: [
      { nombre: "Funda de celular", descripcion: "Funda de silicona flexible transparente", precio: 5, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Protector de pantalla", descripcion: "Protector de pantalla de vidrio templado", precio: 8, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Audífonos", descripcion: "Audífonos inalámbricos con micrófono", precio: 15, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Cable USB", descripcion: "Cable USB-C a USB-A de 1.5m", precio: 6, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Cargador", descripcion: "Cargador rápido USB-C 20W", precio: 12, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Power bank", descripcion: "Power bank 10000mAh con USB-C", precio: 25, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
    ],
    servicios: [
      {
        nombre: "Reparación de celulares",
        descripcion: "Servicio de reparación de smartphones y tablets",
        duracionMinutos: 60,
        capacidad: 3,
        precio: 30,
        horariosDisponibles: horarioServicioGeneral(),
        tratamientoIVA: "GRAVADO",
      },
      {
        nombre: "Liberación",
        descripcion: "Servicio de liberación de dispositivos móviles",
        duracionMinutos: 30,
        capacidad: 5,
        precio: 25,
        horariosDisponibles: horarioServicioGeneral(),
        tratamientoIVA: "GRAVADO",
      },
    ],
  },
  {
    slug: "cafeteria-el-cafetal",
    nombre: "Cafetería El Cafetal",
    descripcion: "Cafetería con café de especialidad y productos frescos en Pinar del Río",
    emailPropietario: "negocio.cafeteria@test.com",
    usernamePropietario: "cafeteria",
    nombrePropietario: "Elena Vásquez",
    areaSlug: "comida-restaurantes",
    subareaSlug: "cafeteria",
    municipio: "Pinar del Río",
    provincia: "Pinar del Río",
    telefono: "559-111222",
    emailContacto: "contacto@cafeteriaelcafetal.com",
    direccionCompleta: "Calle Independencia #88, Pinar del Río",
    nit: "CEC-0011-001",
    regimenFiscal: "GENERAL",
    tasaIVA: 10,
    prefijoFactura: "PR",
    permiteReservas: true,
    permiteEnvio: true,
    productos: [
      { nombre: "Café expreso", descripcion: "Café espresso recién molido y preparado", precio: 1.5, unidadMedida: "taza", tratamientoIVA: "GRAVADO" },
      { nombre: "Capuchino", descripcion: "Café espresso con leche vaporizada y espuma", precio: 3, unidadMedida: "taza", tratamientoIVA: "GRAVADO" },
      { nombre: "Latte", descripcion: "Café espresso con leche vaporizada y espuma ligera", precio: 3.5, unidadMedida: "taza", tratamientoIVA: "GRAVADO" },
      { nombre: "Croissant", descripcion: "Croissant hojaldrado recién horneado", precio: 2, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Sandwich", descripcion: "Sándwich de pollo y vegetales", precio: 5, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Jugo natural", descripcion: "Jugo natural de frutas locales", precio: 3, unidadMedida: "botella", tratamientoIVA: "GRAVADO" },
      { nombre: "Tostada francesa", descripcion: "Tostada de pan con canela y huevo", precio: 2.5, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
    ],
    servicios: [
      {
        nombre: "Reserva de mesa",
        descripcion: "Reserva de mesa para café y productos frescos",
        duracionMinutos: 15,
        capacidad: 4,
        precio: 0,
        horariosDisponibles: horarioServicioGeneral(),
        tratamientoIVA: "NO_SUJETO",
      },
    ],
  },
  {
    slug: "muebleria-el-roble",
    nombre: "Mueblería El Roble",
    descripcion: "Mueblería artesanal con muebles de madera en La Habana",
    emailPropietario: "negocio.muebles@test.com",
    usernamePropietario: "muebles",
    nombrePropietario: "Frank Gómez",
    areaSlug: "servicios-profesionales",
    subareaSlug: "carpinteria",
    municipio: "Vedado",
    provincia: "La Habana",
    telefono: "559-222333",
    emailContacto: "contacto@muebleriaelroble.com",
    direccionCompleta: "Calle 23 #401, Vedado, La Habana",
    nit: "MER-0012-001",
    regimenFiscal: "GENERAL",
    tasaIVA: 10,
    prefijoFactura: "LH",
    permiteReservas: false,
    permiteEnvio: true,
    productos: [
      { nombre: "Silla de madera", descripcion: "Silla de madera de roble con tapizado", precio: 50, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Mesa de comedor", descripcion: "Mesa de comedor de madera para 6 personas", precio: 200, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Cama individual", descripcion: "Cama individual de madera con colchón", precio: 150, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Armario", descripcion: "Armario de madera con 3 puertas", precio: 300, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
      { nombre: "Estante", descripcion: "Estante de madera de 2 niveles", precio: 80, unidadMedida: "unidad", tratamientoIVA: "GRAVADO" },
    ],
    servicios: [
      { nombre: "Reparación de muebles", descripcion: "Servicio de reparación y restauración de muebles de madera", duracionMinutos: 120, capacidad: 2, precio: 30, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO" },
      { nombre: "Fabricación a medida", descripcion: "Fabricación de muebles personalizados según diseño", duracionMinutos: 1440, capacidad: 1, precio: 0, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO" },
    ],
  },
];

const PROVEEDORES: ProveedorDef[] = [
  { slug: "envios-rapidos-pr", nombre: "Envíos Rápidos PR", zonaCobertura: "Pinar del Río", alcanceNacional: false, contacto: "contacto@enviosrapidospr.com" },
  { slug: "moto-express", nombre: "Moto Express", zonaCobertura: "La Habana", alcanceNacional: false, contacto: "contacto@motoexpress.cu" },
  { slug: "transcuba-nacional", nombre: "TransCuba Nacional", zonaCobertura: "Cuba", alcanceNacional: true, contacto: "contacto@transcubanacional.cu" },
];

const TRANSPORTE_SERVICIOS: ServicioDef[] = [
  { nombre: "Envío de paquete Pinar → Viñales", descripcion: "Servicio de envío de paquetes de Pinar del Río a Viñales", duracionMinutos: 120, capacidad: 1, precio: 5.99, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO", tipo: "TRANSPORTE", tipoTransporte: "ENVIO_PAQUETE", pesoMaximo: 5, origenBase: "Pinar del Río", destinoBase: "Viñales" },
  { nombre: "Mudanza local Pinar del Río", descripcion: "Servicio de mudanza local en Pinar del Río", duracionMinutos: 240, capacidad: 1, precio: 50, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO", tipo: "TRANSPORTE", tipoTransporte: "MUDANZA", pesoMaximo: 500, origenBase: "Pinar del Río", destinoBase: "Pinar del Río" },
  { nombre: "Traslado de mueble", descripcion: "Servicio de traslado de muebles dentro de la ciudad", duracionMinutos: 60, capacidad: 1, precio: 15, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO", tipo: "TRANSPORTE", tipoTransporte: "TRASLADO_MUEBLE", pesoMaximo: 100, origenBase: "Pinar del Río", destinoBase: "Pinar del Río" },
  { nombre: "Transporte de personas (hasta 4)", descripcion: "Servicio de transporte de personas hasta 4 pasajeros", duracionMinutos: 30, capacidad: 4, precio: 20, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO", tipo: "TRANSPORTE", tipoTransporte: "TRANSPORTE_PERSONAS", origenBase: "Pinar del Río", destinoBase: "Pinar del Río" },
  { nombre: "Transporte de carga Habana → Pinar", descripcion: "Servicio de transporte de carga entre La Habana y Pinar del Río", duracionMinutos: 300, capacidad: 1, precio: 80, horariosDisponibles: horarioServicioGeneral(), tratamientoIVA: "GRAVADO", tipo: "TRANSPORTE", tipoTransporte: "TRANSPORTE_CARGA", pesoMaximo: 500, origenBase: "La Habana", destinoBase: "Pinar del Río", alcanceNacional: true },
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

function generateCodigoEntrega(semilla: string): { codigo: string; hash: string } {
  const hash = crypto.createHash("sha256").update(semilla).digest("hex").substring(0, 6);
  const codigo = String(parseInt(hash, 16) % 900000 + 100000);
  const hashFinal = hashToken(codigo);
  return { codigo, hash: hashFinal };
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function logSeed(
  eventType: string,
  targetId: string | null,
  meta: Record<string, unknown>
) {
  const auditId = `seed-audit-log-${eventType}-${targetId ?? "null"}`;
  await prisma.auditLog.upsert({
    where: { id: auditId },
    update: { meta: meta as Prisma.InputJsonValue },
    create: {
      id: auditId,
      eventType,
      targetId,
      meta: meta as Prisma.InputJsonValue,
      timestamp: SEED_DATE,
    },
  });
}

async function upsertUsuario(
  email: string,
  username: string | null,
  data: Omit<Prisma.UserCreateInput, "email" | "username"> & {
    provincia?: string | null;
    municipio?: string | null;
  }
) {
  return prisma.user.upsert({
    where: { email },
    update: {
      ...data,
      ...(username ? { username } : {}),
      emailVerified: data.emailVerified ?? new Date(),
    },
    create: {
      email,
      ...(username ? { username } : {}),
      ...data,
      emailVerified: data.emailVerified ?? new Date(),
    },
  });
}

async function seedProvincias() {
  console.log("→ Seed: Provincias y municipios");

  const provinciaMap = new Map<string, string>();
  const municipioMap = new Map<string, string>();

  for (const provDef of PROVINCIAS) {
    const prov = await prisma.provincia.upsert({
      where: { slug: provDef.slug },
      update: { nombre: provDef.nombre, activo: true },
      create: { slug: provDef.slug, nombre: provDef.nombre },
    });
    provinciaMap.set(provDef.nombre, prov.id);
    provinciaMap.set(provDef.slug, prov.id);
  }

  for (const muniDef of MUNICIPIOS) {
    const provId = provinciaMap.get(muniDef.provinciaSlug)!;
    const muni = await prisma.municipio.upsert({
      where: { slug: muniDef.slug },
      update: { nombre: muniDef.nombre, provinciaId: provId, activo: true },
      create: { slug: muniDef.slug, nombre: muniDef.nombre, provinciaId: provId },
    });
    municipioMap.set(muniDef.nombre, muni.id);
    municipioMap.set(muniDef.slug, muni.id);
  }

  console.log(`  ${provinciaMap.size / 2} provincias, ${municipioMap.size / 2} municipios creados`);
  return { provinciaMap, municipioMap };
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
      const area = await prisma.area.findUniqueOrThrow({ where: { slug: areaDef.slug } });
      await prisma.subarea.upsert({
        where: { slug: subareaSlug },
        update: { nombre: sa.nombre, activo: true, areaId: area.id },
        create: { slug: subareaSlug, nombre: sa.nombre, area: { connect: { slug: areaDef.slug } } },
      });
      subareaCount++;
    }

    console.log(`  Área: ${areaDef.nombre} (${areaDef.subareas.length} subáreas)`);
  }

  console.log(`  Total: ${areaCount} áreas, ${subareaCount} subáreas`);
  return { areaCount, subareaCount };
}

async function seedAdmins() {
  console.log("→ Seed: Administradores");

  const adminCount = await prisma.user.count({
    where: { rol: "ADMIN", isActive: true, deletedAt: null },
  });

  if (adminCount === 0) {
    const hashedPassword = await hashPassword(GENERIC_ADMIN_PASSWORD);
    await prisma.user.upsert({
      where: { email: GENERIC_ADMIN_EMAIL },
      update: {
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
        emailVerified: new Date(),
      },
      create: {
        email: GENERIC_ADMIN_EMAIL,
        username: "admin",
        password: hashedPassword,
        nombre: GENERIC_ADMIN_NAME,
        rol: "ADMIN",
        isGenericAdmin: true,
        mustChangePassword: true,
        isActive: true,
        emailVerified: new Date(),
      },
    });
    console.log(`  Admin genérico creado: ${GENERIC_ADMIN_EMAIL}`);
    await logSeed("GENERIC_ADMIN_CREATED", null, { email: GENERIC_ADMIN_EMAIL });
  } else {
    await prisma.user.upsert({
      where: { email: GENERIC_ADMIN_EMAIL },
      update: {
        username: "admin",
        nombre: GENERIC_ADMIN_NAME,
        rol: "ADMIN",
        isGenericAdmin: true,
        mustChangePassword: true,
        isActive: true,
        deletedAt: null,
        deletedBy: null,
        deletedReason: null,
      },
      create: {
        email: GENERIC_ADMIN_EMAIL,
        username: "admin",
        password: await hashPassword(GENERIC_ADMIN_PASSWORD),
        nombre: GENERIC_ADMIN_NAME,
        rol: "ADMIN",
        isGenericAdmin: true,
        mustChangePassword: true,
        isActive: true,
        emailVerified: new Date(),
      },
    });
    console.log(`  Admin genérico reactivado: ${GENERIC_ADMIN_EMAIL}`);
  }

  await upsertUsuario(
    "admin2@test.com",
    "admin2",
    {
      nombre: "Ana Ruiz",
      rol: "ADMIN",
      password: await hashPassword(TEST_PASSWORD),
      isGenericAdmin: false,
      mustChangePassword: false,
      isActive: true,
    }
  );
  console.log("  Admin: admin2@test.com");

  const admins = await prisma.user.findMany({
    where: { email: { in: [GENERIC_ADMIN_EMAIL, "admin2@test.com"] } },
    select: { id: true, email: true },
  });
  return admins;
}

async function seedClientes() {
  console.log("→ Seed: Clientes");

  const clientesData = [
    { email: "cliente1@test.com", username: "cliente1", nombre: "Ana María Rodríguez", provincia: "Pinar del Río", municipio: "Pinar del Río" },
    { email: "cliente2@test.com", username: "cliente2", nombre: "Carlos Pérez Gómez", provincia: "Pinar del Río", municipio: "Viñales" },
    { email: "cliente3@test.com", username: "cliente3", nombre: "Luis Fernández Díaz", provincia: "Pinar del Río", municipio: "Consolación del Sur" },
    { email: "cliente4@test.com", username: "cliente4", nombre: "María López Sánchez", provincia: "La Habana", municipio: "Vedado" },
    { email: "cliente5@test.com", username: "cliente5", nombre: "José Martínez Ruiz", provincia: "La Habana", municipio: "Centro Habana" },
  ];

  const clienteIds: { id: string; email: string; nombre: string }[] = [];

  for (const c of clientesData) {
    const user = await upsertUsuario(c.email, c.username, {
      nombre: c.nombre,
      rol: "CLIENTE",
      password: await hashPassword(CLIENTE_PASSWORD),
      isActive: true,
      provincia: c.provincia,
      municipio: c.municipio,
    });
    clienteIds.push({ id: user.id, email: c.email, nombre: c.nombre });
    console.log(`  Cliente: ${c.email} (${c.nombre})`);
  }

  return clienteIds;
}

async function seedUsuariosLogistica() {
  console.log("→ Seed: Usuarios LOGISTICA");

  const logisticaData = [
    { email: "logistica1@test.com", username: "logistica1", nombre: "Reparto Rápido Pinar", provincia: "Pinar del Río", municipio: "Pinar del Río" },
    { email: "logistica2@test.com", username: "logistica2", nombre: "Moto Express Habana", provincia: "La Habana", municipio: "Vedado" },
    { email: "logistica3@test.com", username: "logistica3", nombre: "TransCuba Nacional", provincia: "La Habana", municipio: "Plaza de la Revolución" },
  ];

  const logisticaIds: { id: string; email: string; nombre: string }[] = [];

  for (const l of logisticaData) {
    const user = await upsertUsuario(l.email, l.username, {
      nombre: l.nombre,
      rol: "LOGISTICA",
      password: await hashPassword(LOGISTICA_PASSWORD),
      isActive: true,
      provincia: l.provincia,
      municipio: l.municipio,
    });
    logisticaIds.push({ id: user.id, email: l.email, nombre: l.nombre });
    console.log(`  LOGISTICA: ${l.email} (${l.nombre})`);
  }

  return logisticaIds;
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
    }
  );
  console.log("  locked@test.com (failedLoginAttempts: 3, lockedUntil: +1h)");
}

async function seedNegocios(admins: { id: string; email: string }[]) {
  console.log("→ Seed: Negocios, productos, servicios, inventario, disponibilidad");

  const admin = admins.find((a) => a.email === GENERIC_ADMIN_EMAIL);
  const negocioData: Record<
    string,
    {
      id: string;
      userId: string;
      areaId: string;
      subareaId: string;
      tasaIVA: number;
      regimenFiscal: string;
      prefijoFactura: string;
      productos: Map<string, { id: string; precio: number; tratamientoIVA: string }>;
      servicios: Map<string, { id: string; precio: number; tratamientoIVA: string; tipo: string | null }>;
      opcionesLogisticas: Map<string, string>;
    }
  > = {};

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

    const subareaSlug = `${negocioDef.areaSlug}-${negocioDef.subareaSlug}`;
    const subarea = await prisma.subarea.findUniqueOrThrow({
      where: { slug: subareaSlug },
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
        aprobadoEn: SEED_DATE,
        regimenFiscal: negocioDef.regimenFiscal as Prisma.RegimenFiscal,
        tasaIVA: negocioDef.tasaIVA,
        modoPrecio: "IVA_INCLUIDO" as Prisma.ModoPrecio,
        nit: negocioDef.nit,
        direccionFiscal: negocioDef.direccionCompleta,
        telefonoFiscal: negocioDef.telefono,
        emailFiscal: negocioDef.emailContacto,
        prefijoFactura: negocioDef.prefijoFactura,
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
        aprobadoEn: SEED_DATE,
        regimenFiscal: negocioDef.regimenFiscal as Prisma.RegimenFiscal,
        tasaIVA: negocioDef.tasaIVA,
        modoPrecio: "IVA_INCLUIDO" as Prisma.ModoPrecio,
        nit: negocioDef.nit,
        direccionFiscal: negocioDef.direccionCompleta,
        telefonoFiscal: negocioDef.telefono,
        emailFiscal: negocioDef.emailContacto,
        prefijoFactura: negocioDef.prefijoFactura,
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

    const productoMap = new Map<string, { id: string; precio: number; tratamientoIVA: string }>();
    const servicioMap = new Map<string, { id: string; precio: number; tratamientoIVA: string; tipo: string | null }>();

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

      productoMap.set(prodDef.nombre.toLowerCase(), {
        id: producto.id,
        precio: prodDef.precio,
        tratamientoIVA: prodDef.tratamientoIVA,
      });

      // Inventario
      const inventarioExistente = await prisma.inventario.findFirst({
        where: { productoId: producto.id },
      });
      const stock = 20 + i * 10;
      const puntoReorden = 5 + (i % 3) * 5;
      if (inventarioExistente) {
        await prisma.inventario.update({
          where: { id: inventarioExistente.id },
          data: {
            cantidadActual: stock,
            puntoReorden,
            ubicacion: "Almacén principal",
          },
        });
      } else {
        await prisma.inventario.create({
          data: {
            productoId: producto.id,
            cantidadActual: stock,
            puntoReorden,
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

      console.log(`    Producto: ${prodDef.nombre} (${prodDef.precio}$)`);
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
          horariosDisponibles: servDef.horariosDisponibles as Prisma.InputJsonValue,
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
          horariosDisponibles: servDef.horariosDisponibles as Prisma.InputJsonValue,
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

      servicioMap.set(servDef.nombre.toLowerCase(), {
        id: servId,
        precio: servDef.precio ?? 0,
        tratamientoIVA: servDef.tratamientoIVA,
        tipo: servDef.tipo ?? null,
      });

      console.log(`    Servicio: ${servDef.nombre}`);
    }

    negocioData[negocioDef.slug] = {
      id: negocio.id,
      userId: propietario.id,
      areaId: area.id,
      subareaId: subarea.id,
      tasaIVA: negocioDef.tasaIVA,
      regimenFiscal: negocioDef.regimenFiscal,
      prefijoFactura: negocioDef.prefijoFactura,
      productos: productoMap,
      servicios: servicioMap,
      opcionesLogisticas: new Map(),
    };
  }

  return negocioData;
}

async function seedProveedoresLogisticos(logisticaUsers: { id: string; email: string; nombre: string }[]) {
  console.log("→ Seed: Proveedores logísticos");

  const logisticaMap = new Map(logisticaUsers.map((l) => [l.email, l]));

  for (const provDef of PROVEEDORES) {
    const proveedorId = `seed-prov-${provDef.slug}`;
    let logisticaEmail = "";
    if (provDef.slug === "envios-rapidos-pr") logisticaEmail = "logistica1@test.com";
    else if (provDef.slug === "moto-express") logisticaEmail = "logistica2@test.com";
    else if (provDef.slug === "transcuba-nacional") logisticaEmail = "logistica3@test.com";

    const logisticaUser = logisticaMap.get(logisticaEmail);

    const proveedor = await prisma.proveedorLogistico.upsert({
      where: { id: proveedorId },
      update: {
        nombre: provDef.nombre,
        zonaCobertura: provDef.zonaCobertura,
        alcanceNacional: provDef.alcanceNacional,
        contacto: provDef.contacto,
        activo: true,
        ...(logisticaUser ? { usuarioId: logisticaUser.id } : {}),
      },
      create: {
        id: proveedorId,
        usuarioId: logisticaUser?.id ?? "",
        nombre: provDef.nombre,
        zonaCobertura: provDef.zonaCobertura,
        alcanceNacional: provDef.alcanceNacional,
        contacto: provDef.contacto,
      },
    });
    console.log(`  Proveedor: ${proveedor.nombre} (${proveedor.zonaCobertura})`);
  }

  const proveedorIds = await prisma.proveedorLogistico.findMany({
    where: { id: { startsWith: "seed-prov-" } },
    select: { id: true },
  });
  const proveedorSlugMap = new Map<string, string>();
  for (const prov of PROVEEDORES) {
    const provId = `seed-prov-${prov.slug}`;
    proveedorSlugMap.set(prov.slug, provId);
  }
  return proveedorSlugMap;
}

async function seedOpcionesLogisticas(
  negocioData: Record<string, {
    id: string;
    opcionesLogisticas: Map<string, string>;
  }>
) {
  console.log("→ Seed: Opciones logísticas");

  const proveedores = await prisma.proveedorLogistico.findMany({
    where: { activo: true },
    select: { id: true, nombre: true },
  });

  for (const [slug, nd] of Object.entries(negocioData)) {
    for (const prov of proveedores) {
      const tipos = ["ESTANDAR", "EXPRESS"];
      for (const tipo of tipos) {
        const opcId = `seed-opc-${slug}-${prov.id}-${tipo}`;
        const existingOpc = await prisma.opcionLogistica.findFirst({
          where: { negocioId: nd.id, proveedorId: prov.id, tipo },
        });

        if (!existingOpc) {
          const nombre = tipo === "ESTANDAR" ? "Envío estándar" : "Envío exprés";
          const tarifaBase = tipo === "ESTANDAR" ? 3.0 : 6.0;
          const tiempoEstimado = tipo === "ESTANDAR" ? "24-48 horas" : "12 horas";

          const opcion = await prisma.opcionLogistica.create({
            data: {
              id: opcId,
              negocioId: nd.id,
              proveedorId: prov.id,
              nombre,
              tipo,
              tarifaBase,
              tarifaPorDistancia: tipo === "ESTANDAR" ? 0.5 : 1.0,
              tiempoEstimado,
            },
          });
          nd.opcionesLogisticas.set(tipo, opcion.id);
          console.log(`    Opción logística: ${nombre} (${prov.nombre}) para ${slug}`);
        } else {
          nd.opcionesLogisticas.set(tipo, existingOpc.id);
        }
      }
    }
  }
}

async function seedServiciosTransporte(negocioData: Record<string, any>) {
  console.log("→ Seed: Servicios de transporte");

  const muebleriaId = negocioData["muebleria-el-roble"]?.id;
  if (!muebleriaId) {
    console.log("  ERROR: No se encontró Mueblería El Roble");
    return;
  }

  const subareaTransporte = await prisma.subarea.findFirst({
    where: { slug: "transporte-envio-paquetes" },
    select: { id: true },
  });

  if (!subareaTransporte) {
    console.log("  ERROR: No se encontró subárea de transporte");
    return;
  }

  const transporteSubareas = await prisma.subarea.findMany({
    where: { slug: { startsWith: "transporte-" } },
    select: { id: true, slug: true },
  });
  const subareaMap = new Map(transporteSubareas.map((s) => [s.slug, s.id]));

  const transporteDefs = [
    { slug: "envio-paquete", nombre: "Envío de paquete Pinar → Viñales", subareaSlug: "transporte-envio-paquetes", desc: "Servicio de envío de paquetes de Pinar del Río a Viñales", duracion: 120, capacidad: 1, precio: 5.99, tipoTransporte: "ENVIO_PAQUETE", pesoMax: 5, origen: "Pinar del Río", destino: "Viñales", nacional: false },
    { slug: "mudanza-local", nombre: "Mudanza local Pinar del Río", subareaSlug: "transporte-mudanzas", desc: "Servicio de mudanza local en Pinar del Río", duracion: 240, capacidad: 1, precio: 50, tipoTransporte: "MUDANZA", pesoMax: 500, origen: "Pinar del Río", destino: "Pinar del Río", nacional: false },
    { slug: "traslado-mueble", nombre: "Traslado de mueble", subareaSlug: "transporte-traslado-muebles", desc: "Servicio de traslado de muebles dentro de la ciudad", duracion: 60, capacidad: 1, precio: 15, tipoTransporte: "TRASLADO_MUEBLE", pesoMax: 100, origen: "Pinar del Río", destino: "Pinar del Río", nacional: false },
    { slug: "transporte-personas", nombre: "Transporte de personas (hasta 4)", subareaSlug: "transporte-transporte-personas", desc: "Servicio de transporte de personas hasta 4 pasajeros", duracion: 30, capacidad: 4, precio: 20, tipoTransporte: "TRANSPORTE_PERSONAS", origen: "Pinar del Río", destino: "Pinar del Río", nacional: false },
    { slug: "transporte-carga", nombre: "Transporte de carga Habana → Pinar", subareaSlug: "transporte-transporte-carga", desc: "Servicio de transporte de carga entre La Habana y Pinar del Río", duracion: 300, capacidad: 1, precio: 80, tipoTransporte: "OTRO" as Prisma.TipoTransporte, pesoMax: 500, origen: "La Habana", destino: "Pinar del Río", nacional: true },
  ];

  for (let i = 0; i < transporteDefs.length; i++) {
    const td = transporteDefs[i];
    const servId = `seed-serv-transporte-${td.slug}`;
    const sid = subareaMap.get(td.subareaSlug);

    const servicio = await prisma.servicio.upsert({
      where: { id: servId },
      update: {
        nombre: td.nombre,
        descripcion: td.desc,
        duracionMinutos: td.duracion,
        capacidad: td.capacidad,
        precio: td.precio,
        horariosDisponibles: horarioServicioGeneral() as Prisma.InputJsonValue,
        tratamientoIVA: "GRAVADO" as Prisma.TratamientoIVA,
        tipo: "TRANSPORTE" as Prisma.TipoServicio,
        tipoTransporte: td.tipoTransporte as Prisma.TipoTransporte,
        pesoMaximo: td.pesoMax != null ? new Prisma.Decimal(td.pesoMax) : undefined,
        origenBase: td.origen,
        destinoBase: td.destino,
        alcanceNacional: td.nacional,
      },
      create: {
        id: servId,
        negocioId: muebleriaId,
        subareaId: sid ?? subareaTransporte.id,
        nombre: td.nombre,
        descripcion: td.desc,
        duracionMinutos: td.duracion,
        capacidad: td.capacidad,
        precio: td.precio,
        horariosDisponibles: horarioServicioGeneral() as Prisma.InputJsonValue,
        imagenUrl: `https://placehold.co/64x64/png?text=Transporte`,
        tratamientoIVA: "GRAVADO" as Prisma.TratamientoIVA,
        tipo: "TRANSPORTE" as Prisma.TipoServicio,
        tipoTransporte: td.tipoTransporte as Prisma.TipoTransporte,
        pesoMaximo: td.pesoMax != null ? new Prisma.Decimal(td.pesoMax) : undefined,
        origenBase: td.origen,
        destinoBase: td.destino,
        alcanceNacional: td.nacional,
      },
    });

    console.log(`  Servicio de transporte: ${td.nombre} (${td.precio}$)`);

    negocioData["muebleria-el-roble"]?.servicios?.set(td.nombre.toLowerCase(), {
      id: servId,
      precio: td.precio,
      tratamientoIVA: "GRAVADO",
      tipo: "TRANSPORTE",
    });
  }
}

async function seedPromociones(negocioData: Record<string, any>) {
  console.log("→ Seed: Promociones");

  const promociones = [
    {
      id: "seed-promo-pizzeria-15pct",
      slug: "pizzeria-bella-napoli",
      nombre: "15% dcto en Pizzería",
      descripcion: "15% de descuento en productos de la subárea Pizzería",
      tipo: "PORCENTAJE" as Prisma.TipoDescuento,
      valor: 15,
      productoIds: negocioData["pizzeria-bella-napoli"]?.productos ?
        Array.from(negocioData["pizzeria-bella-napoli"].productos.values()).map((p: any) => p.id) : [],
      servicioIds: [],
      subareaIds: [],
      montoMinimo: null,
    },
    {
      id: "seed-promo-panaderia-2x1",
      slug: "panaderia-la-espiga",
      nombre: "2x1 en Pan de molde",
      descripcion: "Lleva 2 panes de molde por el precio de 1",
      tipo: "DOS_POR_UNO" as Prisma.TipoDescuento,
      valor: null,
      productoIds: negocioData["panaderia-la-espiga"]?.productos
        ? Array.from(negocioData["panaderia-la-espiga"].productos.entries())
            .filter(([k]) => k.includes("pan de molde"))
            .map(([, v]: any) => v.id) : [],
      servicioIds: [],
      subareaIds: [],
      montoMinimo: null,
    },
    {
      id: "seed-promo-salon-20pct",
      slug: "salon-belleza-estrella",
      nombre: "20% dcto Peluquería",
      descripcion: "20% de descuento en servicios de peluquería",
      tipo: "PORCENTAJE" as Prisma.TipoDescuento,
      valor: 20,
      productoIds: [],
      servicioIds: negocioData["salon-belleza-estrella"]?.servicios
        ? Array.from(negocioData["salon-belleza-estrella"].servicios.values()).map((s: any) => s.id) : [],
      subareaIds: [],
      montoMinimo: null,
    },
    {
      id: "seed-promo-boutique-10usd",
      slug: "boutique-maria",
      nombre: "$10 dcto Boutique",
      descripcion: "Descuento fijo de $10 en compras mínimas de $50",
      tipo: "MONTO_FIJO" as Prisma.TipoDescuento,
      valor: 10,
      productoIds: [],
      servicioIds: [],
      subareaIds: [],
      montoMinimo: 50,
    },
    {
      id: "seed-promo-tech-10pct",
      slug: "tecnocell-cuba",
      nombre: "10% dcto Accesorios",
      descripcion: "10% de descuento en productos de accesorios",
      tipo: "PORCENTAJE" as Prisma.TipoDescuento,
      valor: 10,
      productoIds: negocioData["tecnocell-cuba"]?.productos
        ? Array.from(negocioData["tecnocell-cuba"].productos.entries())
            .filter(([k]) => k.includes("funda") || k.includes("audífonos") || k.includes("cable") || k.includes("cargador") || k.includes("power bank") || k.includes("protector"))
            .map(([, v]: any) => v.id) : [],
      servicioIds: [],
      subareaIds: [],
      montoMinimo: null,
    },
    {
      id: "seed-promo-cafeteria-envio",
      slug: "cafeteria-el-cafetal",
      nombre: "Envío Gratis Cafetería",
      descripcion: "Envío gratis en compras mínimas de $20",
      tipo: "ENVIO_GRATIS" as Prisma.TipoDescuento,
      valor: null,
      productoIds: [],
      servicioIds: [],
      subareaIds: [],
      montoMinimo: 20,
    },
  ];

  for (const promo of promociones) {
    const negocioSlug = promo.slug;
    const negocio = negocioData[negocioSlug];
    if (!negocio) {
      console.log(`  Saltando promoción: negocio ${negocioSlug} no encontrado`);
      continue;
    }

    await prisma.promocion.upsert({
      where: { id: promo.id },
      update: {
        negocioId: negocio.id,
        nombre: promo.nombre,
        descripcion: promo.descripcion,
        tipo: promo.tipo,
        valor: promo.valor != null ? new Prisma.Decimal(promo.valor) : undefined,
        productoIds: JSON.stringify(promo.productoIds),
        servicioIds: JSON.stringify(promo.servicioIds),
        subareaIds: JSON.stringify(promo.subareaIds),
        montoMinimo: promo.montoMinimo != null ? new Prisma.Decimal(promo.montoMinimo) : undefined,
        fechaInicio: SEED_DATE,
        fechaFin: addDays(new Date(), 90),
        usosMaximos: 1000,
        usosActuales: 0,
        estado: "ACTIVA",
      },
      create: {
        id: promo.id,
        negocioId: negocio.id,
        nombre: promo.nombre,
        descripcion: promo.descripcion,
        tipo: promo.tipo,
        valor: promo.valor != null ? new Prisma.Decimal(promo.valor) : undefined,
        productoIds: JSON.stringify(promo.productoIds),
        servicioIds: JSON.stringify(promo.servicioIds),
        subareaIds: JSON.stringify(promo.subareaIds),
        montoMinimo: promo.montoMinimo != null ? new Prisma.Decimal(promo.montoMinimo) : undefined,
        fechaInicio: SEED_DATE,
        fechaFin: addDays(new Date(), 90),
        usosMaximos: 1000,
        usosActuales: 0,
        estado: "ACTIVA",
      },
    });
    console.log(`  Promoción: ${promo.nombre}`);
  }
}

async function seedCupones(negocioData: Record<string, any>) {
  console.log("→ Seed: Cupones");

  const cupones = [
    { id: "seed-cupon-bienvenida10", codigo: "BIENVENIDA10", nombre: "10% bienvenida", descripcion: "10% de descuento en tu primera compra (mínimo $15)", tipo: "PORCENTAJE" as Prisma.TipoDescuento, valor: 10, negocioSlug: null, montoMinimo: 15, unaVezPorUsuario: true, primeraCompra: true },
    { id: "seed-cupon-pinar2026", codigo: "PINAR2026", nombre: "$5 Pinar 2026", descripcion: "$5 de descuento (mínimo $30)", tipo: "MONTO_FIJO" as Prisma.TipoDescuento, valor: 5, negocioSlug: null, montoMinimo: 30, unaVezPorUsuario: false, primeraCompra: false },
    { id: "seed-cupon-pizza20", codigo: "PIZZA20", nombre: "20% Pizza", descripcion: "20% de descuento en Pizzería Bella Napoli", tipo: "PORCENTAJE" as Prisma.TipoDescuento, valor: 20, negocioSlug: "pizzeria-bella-napoli", montoMinimo: null, unaVezPorUsuario: false, primeraCompra: false },
    { id: "seed-cupon-belleza15", codigo: "BELLEZA15", nombre: "15% Belleza", descripcion: "15% de descuento en Salón de Belleza Estrella", tipo: "PORCENTAJE" as Prisma.TipoDescuento, valor: 15, negocioSlug: "salon-belleza-estrella", montoMinimo: null, unaVezPorUsuario: true, primeraCompra: false },
    { id: "seed-cupon-enviogratis", codigo: "ENVIOGRATIS", nombre: "Envío gratis", descripcion: "Envío gratis en compras mínimas de $25", tipo: "ENVIO_GRATIS" as Prisma.TipoDescuento, valor: null, negocioSlug: null, montoMinimo: 25, unaVozPorUsuario: false, primeraCompra: false },
  ];

  for (const c of cupones) {
    const negocioId = c.negocioSlug ? negocioData[c.negocioSlug]?.id : null;
    const data = {
      id: c.id,
      descripcion: c.descripcion,
      tipo: c.tipo,
      valor: c.valor != null ? new Prisma.Decimal(c.valor) : undefined,
      montoMinimo: c.montoMinimo != null ? new Prisma.Decimal(c.montoMinimo) : undefined,
      estado: "ACTIVO" as Prisma.EstadoCupon,
      fechaInicio: SEED_DATE,
      fechaFin: addDays(new Date(), 90),
      usosMaximos: c.codigo === "BIENVENIDA10" || c.codigo === "BELLEZA15" ? 1000 : 100,
      usosActuales: 0,
      unaVezPorUsuario: c.unaVezPorUsuario,
      primeraCompra: c.primeraCompra,
    };

    const createData: any = { ...data, codigo: c.codigo };
    if (negocioId) {
      createData.negocio = { connect: { id: negocioId } };
    }

    await prisma.cupon.upsert({
      where: { codigo: c.codigo },
      update: data,
      create: createData,
    });
    console.log(`  Cupón: ${c.codigo}`);
  }
}

async function seedCombos(negocioData: Record<string, any>) {
  console.log("→ Seed: Combos");

  const combos = [
    {
      id: "seed-combo-cena-italiana",
      nombre: "Combo Cena Italiana",
      descripcion: "Pizza Margarita + Refresco + Pan de ajo",
      slug: "pizzeria-bella-napoli",
      precio: 18,
      negocioId: negocioData["pizzeria-bella-napoli"]?.id ?? null,
      items: [
        { nombre: "pizza margarita", tipo: "producto" },
        { nombre: "refresco lata", tipo: "producto" },
        { nombre: "pan de ajo", tipo: "producto" },
      ],
    },
    {
      id: "seed-combo-desayuno-cubano",
      nombre: "Combo Desayuno Cubano",
      descripcion: "Café expreso + Croissant + Jugo natural",
      slug: "cafeteria-el-cafetal",
      precio: 8,
      negocioId: negocioData["cafeteria-el-cafetal"]?.id ?? null,
      items: [
        { nombre: "café expreso", tipo: "producto" },
        { nombre: "croissant", tipo: "producto" },
        { nombre: "jugo natural", tipo: "producto" },
      ],
    },
    {
      id: "seed-combo-bienestar",
      nombre: "Combo Bienestar",
      descripcion: "Corte de cabello + Manicure + Tratamiento facial",
      slug: "salon-belleza-estrella",
      precio: 40,
      negocioId: negocioData["salon-belleza-estrella"]?.id ?? null,
      items: [
        { nombre: "corte de cabello", tipo: "servicio" },
        { nombre: "manicure", tipo: "servicio" },
        { nombre: "tratamiento facial", tipo: "servicio" },
      ],
    },
    {
      id: "seed-combo-multi-negocio",
      nombre: "Combo Multi-negocio",
      descripcion: "Pizza Margarita + Refresco + Pastel de chocolate",
      slug: null,
      precio: 25,
      negocioId: null,
      items: [
        { nombre: "pizza margarita", tipo: "producto", negocioSlug: "pizzeria-bella-napoli" },
        { nombre: "refresco lata", tipo: "producto", negocioSlug: "pizzeria-bella-napoli" },
        { nombre: "pastel de chocolate", tipo: "producto", negocioSlug: "panaderia-la-espiga" },
      ],
    },
  ];

  for (const combo of combos) {
    const comboItems: { productoId?: string; servicioId?: string; cantidad: number }[] = [];
    for (const item of combo.items) {
      if (item.tipo === "producto") {
        const biz = item.negocioSlug ?? combo.slug;
        const prod = negocioData[biz]?.productos?.get(item.nombre);
        if (prod) {
          comboItems.push({ productoId: prod.id, cantidad: 1 });
        }
      } else if (item.tipo === "servicio") {
        const serv = negocioData[combo.slug]?.servicios?.get(item.nombre);
        if (serv) {
          comboItems.push({ servicioId: serv.id, cantidad: 1 });
        }
      }
    }

    await prisma.combo.upsert({
      where: { id: combo.id },
      update: {
        nombre: combo.nombre,
        descripcion: combo.descripcion,
        precio: new Prisma.Decimal(combo.precio),
        activo: true,
        fechaInicio: SEED_DATE,
        fechaFin: addDays(new Date(), 90),
        usosMaximos: 500,
        usosActuales: 0,
        items: {
          deleteMany: {},
          create: comboItems,
        },
      },
      create: {
        id: combo.id,
        negocioId: combo.negocioId,
        nombre: combo.nombre,
        descripcion: combo.descripcion,
        precio: new Prisma.Decimal(combo.precio),
        activo: true,
        fechaInicio: SEED_DATE,
        fechaFin: addDays(new Date(), 90),
        usosMaximos: 500,
        usosActuales: 0,
        items: {
          create: comboItems,
        },
      },
    });
    console.log(`  Combo: ${combo.nombre} (${comboItems.length} items)`);
  }
}

function calcularItemTotales(precio: number, cantidad: number, tasaIVA: number, tratamientoIVA: string) {
  const subtotal = new Prisma.Decimal(precio).mul(cantidad);

  let baseImponible: Prisma.Decimal;
  let montoIVA: Prisma.Decimal;

  if (tratamientoIVA === "EXENTO" || tratamientoIVA === "NO_SUJETO" || tasaIVA === 0) {
    baseImponible = subtotal;
    montoIVA = new Prisma.Decimal(0);
  } else {
    const divisor = new Prisma.Decimal(1 + tasaIVA / 100);
    baseImponible = subtotal.div(divisor);
    montoIVA = subtotal.minus(baseImponible);
  }

  const precioUnitarioBase = baseImponible.div(cantidad);
  const precioUnitarioConIVA = subtotal.div(cantidad);

  return {
    subtotal: subtotal.toDecimalPlaces(2),
    baseImponible: baseImponible.toDecimalPlaces(2),
    montoIVA: montoIVA.toDecimalPlaces(2),
    precioUnitario: new Prisma.Decimal(precio).toDecimalPlaces(2),
    precioUnitarioBase: precioUnitarioBase.toDecimalPlaces(2),
    precioUnitarioConIVA: precioUnitarioConIVA.toDecimalPlaces(2),
    tasaIVA: new Prisma.Decimal(tasaIVA),
  };
}

const FUTURE_DATE = new Date("2025-02-15T10:00:00Z");

interface PedidoItemDef {
  negocioSlug: string;
  nombre: string;
  tipo: "producto" | "servicio";
  cantidad: number;
}

interface PedidoDemo {
  id: string;
  clienteEmail: string;
  negocioSlug: string;
  tipo: "producto" | "servicio" | "mixto";
  tipoEntrega: "DOMICILIO" | "RECOGIDA_TIENDA";
  estado: string;
  estadoPago: string;
  items: PedidoItemDef[];
  costoEnvio: number;
  direccionEntrega?: string;
  fechaEntrega?: Date;
  notas?: string;
  negocioIdsExtra?: string[];
}

const PEDIDOS_DE_EJEMPLO: PedidoDemo[] = [
  {
    id: "seed-pedido-1",
    clienteEmail: "cliente1@test.com",
    negocioSlug: "pizzeria-bella-napoli",
    tipo: "producto",
    tipoEntrega: "DOMICILIO",
    estado: "pendiente",
    estadoPago: "PENDIENTE",
    items: [
      { negocioSlug: "pizzeria-bella-napoli", nombre: "pizza margarita", tipo: "producto", cantidad: 1 },
      { negocioSlug: "pizzeria-bella-napoli", nombre: "refresco lata", tipo: "producto", cantidad: 2 },
    ],
    costoEnvio: 3.0,
    direccionEntrega: "Calle Real #145, Pinar del Río",
    fechaEntrega: new Date("2025-01-15T18:00:00Z"),
  },
  {
    id: "seed-pedido-2",
    clienteEmail: "cliente1@test.com",
    negocioSlug: "cafeteria-el-cafetal",
    tipo: "producto",
    tipoEntrega: "RECOGIDA_TIENDA",
    estado: "procesando",
    estadoPago: "PENDIENTE",
    items: [
      { negocioSlug: "cafeteria-el-cafetal", nombre: "café expreso", tipo: "producto", cantidad: 2 },
      { negocioSlug: "cafeteria-el-cafetal", nombre: "croissant", tipo: "producto", cantidad: 1 },
    ],
    costoEnvio: 0,
  },
  {
    id: "seed-pedido-3",
    clienteEmail: "cliente1@test.com",
    negocioSlug: "salon-belleza-estrella",
    tipo: "servicio",
    tipoEntrega: "RECOGIDA_TIENDA",
    estado: "completado",
    estadoPago: "COMPLETADO",
    items: [
      { negocioSlug: "salon-belleza-estrella", nombre: "corte de cabello", tipo: "servicio", cantidad: 1 },
    ],
    costoEnvio: 0,
    notas: "Pedido completado y pagado",
  },
  {
    id: "seed-pedido-4",
    clienteEmail: "cliente2@test.com",
    negocioSlug: "electrodomesticos-el-rayo",
    tipo: "producto",
    tipoEntrega: "DOMICILIO",
    estado: "enviado",
    estadoPago: "COMPLETADO",
    items: [
      { negocioSlug: "electrodomesticos-el-rayo", nombre: "ventilador", tipo: "producto", cantidad: 1 },
      { negocioSlug: "electrodomesticos-el-rayo", nombre: "bombillo led", tipo: "producto", cantidad: 3 },
    ],
    costoEnvio: 5.0,
    direccionEntrega: "Calle Pinar #12, Pinar del Río",
    notas: "Enviado por TransCuba",
  },
  {
    id: "seed-pedido-5",
    clienteEmail: "cliente2@test.com",
    negocioSlug: "panaderia-la-espiga",
    tipo: "producto",
    tipoEntrega: "RECOGIDA_TIENDA",
    estado: "completado",
    estadoPago: "COMPLETADO",
    items: [
      { negocioSlug: "panaderia-la-espiga", nombre: "pan de molde", tipo: "producto", cantidad: 2 },
      { negocioSlug: "panaderia-la-espiga", nombre: "croissant", tipo: "producto", cantidad: 3 },
    ],
    costoEnvio: 0,
  },
  {
    id: "seed-pedido-6",
    clienteEmail: "cliente3@test.com",
    negocioSlug: "taller-el-mecanico",
    tipo: "servicio",
    tipoEntrega: "RECOGIDA_TIENDA",
    estado: "pendiente",
    estadoPago: "PENDIENTE",
    items: [
      { negocioSlug: "taller-el-mecanico", nombre: "cambio de aceite", tipo: "servicio", cantidad: 1 },
    ],
    costoEnvio: 0,
  },
  {
    id: "seed-pedido-7",
    clienteEmail: "cliente3@test.com",
    negocioSlug: "boutique-maria",
    tipo: "producto",
    tipoEntrega: "DOMICILIO",
    estado: "cancelado",
    estadoPago: "CANCELADO",
    items: [
      { negocioSlug: "boutique-maria", nombre: "blusa", tipo: "producto", cantidad: 1 },
      { negocioSlug: "boutique-maria", nombre: "pantalón", tipo: "producto", cantidad: 1 },
    ],
    costoEnvio: 5.0,
    direccionEntrega: "Calle Sol #45, Pinar del Río",
    notas: "Cancelado por el cliente",
  },
  {
    id: "seed-pedido-8",
    clienteEmail: "cliente4@test.com",
    negocioSlug: "pizzeria-bella-napoli",
    tipo: "mixto",
    tipoEntrega: "DOMICILIO",
    estado: "completado",
    estadoPago: "COMPLETADO",
    items: [
      { negocioSlug: "pizzeria-bella-napoli", nombre: "pizza hawaiana", tipo: "producto", cantidad: 1 },
      { negocioSlug: "cafeteria-el-cafetal", nombre: "latte", tipo: "producto", cantidad: 2 },
      { negocioSlug: "panaderia-la-espiga", nombre: "pastel de chocolate", tipo: "producto", cantidad: 1 },
    ],
    costoEnvio: 6.0,
    direccionEntrega: "Calle 23 #401, Vedado, La Habana",
    negocioIdsExtra: ["cafeteria-el-cafetal", "panaderia-la-espiga"],
    notas: "Pedido multi-negocio",
  },
  {
    id: "seed-pedido-9",
    clienteEmail: "cliente4@test.com",
    negocioSlug: "tecnocell-cuba",
    tipo: "mixto",
    tipoEntrega: "DOMICILIO",
    estado: "pendiente",
    estadoPago: "PENDIENTE",
    items: [
      { negocioSlug: "tecnocell-cuba", nombre: "cargador", tipo: "producto", cantidad: 1 },
      { negocioSlug: "electrodomesticos-el-rayo", nombre: "bombillo led", tipo: "producto", cantidad: 3 },
    ],
    costoEnvio: 5.0,
    direccionEntrega: "Calle Malecón #88, Vedado, La Habana",
    negocioIdsExtra: ["electrodomesticos-el-rayo"],
  },
  {
    id: "seed-pedido-10",
    clienteEmail: "cliente5@test.com",
    negocioSlug: "muebleria-el-roble",
    tipo: "producto",
    tipoEntrega: "DOMICILIO",
    estado: "completado",
    estadoPago: "COMPLETADO",
    items: [
      { negocioSlug: "muebleria-el-roble", nombre: "estante", tipo: "producto", cantidad: 2 },
      { negocioSlug: "muebleria-el-roble", nombre: "silla de madera", tipo: "producto", cantidad: 1 },
    ],
    costoEnvio: 80.0,
    direccionEntrega: "Calle Oeste #22, Centro Habana, La Habana",
    notas: "Entrega programada",
  },
];

async function seedPedidosDeEjemplo(
  clientes: { id: string; email: string }[],
  negocioData: Record<string, any>
) {
  console.log("→ Seed: Pedidos de ejemplo");

  const clienteMap = new Map(clientes.map((c) => [c.email, c.id]));
  const pedidosCreados: { id: string; negocioId: string; negocioSlug: string; items: any[]; total: number; estadoPago: string; estado: string }[] = [];

  for (const pedidoDemo of PEDIDOS_DE_EJEMPLO) {
    const clienteId = clienteMap.get(pedidoDemo.clienteEmail);
    if (!clienteId) {
      console.log(`  ERROR: Cliente ${pedidoDemo.clienteEmail} no encontrado`);
      continue;
    }

    const negocio = negocioData[pedidoDemo.negocioSlug];
    if (!negocio) {
      console.log(`  ERROR: Negocio ${pedidoDemo.negocioSlug} no encontrado`);
      continue;
    }

    const negocioIdsSet = new Set<string>([negocio.id]);
    if (pedidoDemo.negocioIdsExtra) {
      for (const slug of pedidoDemo.negocioIdsExtra) {
        if (negocioData[slug]) {
          negocioIdsSet.add(negocioData[slug].id);
        }
      }
    }
    const negocioIds = Array.from(negocioIdsSet);

    const pedidoItems: any[] = [];
    let subtotalTotal = 0;

    for (const item of pedidoDemo.items) {
      const itemNegocio = negocioData[item.negocioSlug];
      let entityId: string | undefined;
      let entityPrecio = 0;
      let entityTratamientoIVA: string = "GRAVADO";

      if (item.tipo === "producto") {
        const prod = itemNegocio?.productos?.get(item.nombre);
        if (prod) {
          entityId = prod.id;
          entityPrecio = prod.precio;
          entityTratamientoIVA = prod.tratamientoIVA;
        } else {
          console.log(`  ADVERTENCIA: Producto "${item.nombre}" no encontrado en ${item.negocioSlug}`);
          continue;
        }
      } else {
        const serv = itemNegocio?.servicios?.get(item.nombre);
        if (serv) {
          entityId = serv.id;
          entityPrecio = serv.precio;
          entityTratamientoIVA = serv.tratamientoIVA;
        } else {
          console.log(`  ADVERTENCIA: Servicio "${item.nombre}" no encontrado en ${item.negocioSlug}`);
          continue;
        }
      }

      const totales = calcularItemTotales(
        entityPrecio,
        item.cantidad,
        negocio.tasaIVA,
        entityTratamientoIVA
      );

      const itemCreate: any = {
        productoId: item.tipo === "producto" ? entityId : undefined,
        servicioId: item.tipo === "servicio" ? entityId : undefined,
        cantidad: item.cantidad,
        precioUnitario: totales.precioUnitario,
        precioUnitarioBase: totales.precioUnitarioBase,
        precioUnitarioConIVA: totales.precioUnitarioConIVA,
        tasaIVA: totales.tasaIVA,
        tratamientoIVA: entityTratamientoIVA as Prisma.TratamientoIVA,
        baseImponible: totales.baseImponible,
        montoIVA: totales.montoIVA,
        subtotal: totales.subtotal,
        negocioId: itemNegocio.id,
        fechaEntrega: undefined,
        metadata: undefined,
      };
      pedidoItems.push(itemCreate);
      subtotalTotal += Number(totales.subtotal);
    }

    const total = Number(new Prisma.Decimal(subtotalTotal + pedidoDemo.costoEnvio).toFixed(2));
    const baseImponibleTotal = Number(new Prisma.Decimal(subtotalTotal).div(1 + negocio.tasaIVA / 100).toFixed(2));
    const montoIVATotal = Number(new Prisma.Decimal(total).minus(baseImponibleTotal).toFixed(2));

    const pedido = await prisma.pedido.upsert({
      where: { id: pedidoDemo.id },
      update: {
        estado: pedidoDemo.estado,
        tipoEntrega: pedidoDemo.tipoEntrega,
        costoEnvio: pedidoDemo.costoEnvio,
        direccionEntrega: pedidoDemo.direccionEntrega ?? null,
        fechaEntrega: pedidoDemo.fechaEntrega ?? undefined,
        estadoPago: pedidoDemo.estadoPago,
        total: total,
        baseImponibleTotal: baseImponibleTotal,
        montoIVATotal: montoIVATotal,
        totalConIVA: total,
        modoPrecio: "IVA_INCLUIDO" as Prisma.ModoPrecio,
        regimenFiscalNegocio: negocio.regimenFiscal as Prisma.RegimenFiscal,
        tasaIVANegocio: negocio.tasaIVA,
        notas: pedidoDemo.notas ?? null,
        negocioIds: JSON.stringify(negocioIds),
        descuentoTotal: 0,
        items: {
          deleteMany: {},
          create: pedidoItems,
        },
      },
      create: {
        id: pedidoDemo.id,
        usuarioId: clienteId,
        negocioId: negocio.id,
        total: total,
        baseImponibleTotal: baseImponibleTotal,
        montoIVATotal: montoIVATotal,
        totalConIVA: total,
        modoPrecio: "IVA_INCLUIDO" as Prisma.ModoPrecio,
        regimenFiscalNegocio: negocio.regimenFiscal as Prisma.RegimenFiscal,
        tasaIVANegocio: negocio.tasaIVA,
        estado: pedidoDemo.estado,
        tipo: pedidoDemo.tipo,
        tipoEntrega: pedidoDemo.tipoEntrega,
        negocioIds: JSON.stringify(negocioIds),
        costoEnvio: pedidoDemo.costoEnvio,
        direccionEntrega: pedidoDemo.direccionEntrega ?? null,
        fechaEntrega: pedidoDemo.fechaEntrega ?? undefined,
        notas: pedidoDemo.notas ?? null,
        estadoPago: pedidoDemo.estadoPago,
        descuentoTotal: 0,
        items: {
          create: pedidoItems,
        },
      },
    });

    pedidosCreados.push({
      id: pedido.id,
      negocioId: negocio.id,
      negocioSlug: pedidoDemo.negocioSlug,
      items: pedidoItems,
      total,
      estadoPago: pedidoDemo.estadoPago,
      estado: pedidoDemo.estado,
    });
    console.log(`  Pedido: ${pedidoDemo.id} (${pedidoDemo.estado}, ${pedidoDemo.tipoEntrega})`);
  }

  return pedidosCreados;
}

const RESERVAS_DE_EJEMPLO = [
  { id: "seed-reserva-1", clienteEmail: "cliente1@test.com", negocioSlug: "salon-belleza-estrella", servicioNombre: "corte de cabello", fechaHoraInicio: new Date("2025-01-20T10:00:00Z"), estado: "pendiente" },
  { id: "seed-reserva-2", clienteEmail: "cliente1@test.com", negocioSlug: "salon-belleza-estrella", servicioNombre: "manicure", fechaHoraInicio: new Date("2025-01-22T14:00:00Z"), estado: "confirmada" },
  { id: "seed-reserva-3", clienteEmail: "cliente2@test.com", negocioSlug: "taller-el-mecanico", servicioNombre: "cambio de aceite", fechaHoraInicio: new Date("2025-01-25T09:00:00Z"), estado: "pendiente" },
  { id: "seed-reserva-4", clienteEmail: "cliente3@test.com", negocioSlug: "cafeteria-el-cafetal", servicioNombre: "reserva de mesa", fechaHoraInicio: new Date("2025-01-18T11:00:00Z"), estado: "confirmada" },
  { id: "seed-reserva-5", clienteEmail: "cliente5@test.com", negocioSlug: "muebleria-el-roble", servicioNombre: "envío de paquete pinar → viñales", fechaHoraInicio: new Date("2025-01-30T08:00:00Z"), estado: "confirmada" },
];

async function seedReservasDeEjemplo(
  clientes: { id: string; email: string }[],
  negocioData: Record<string, any>
) {
  console.log("→ Seed: Reservas de ejemplo");

  const clienteMap = new Map(clientes.map((c) => [c.email, c.id]));

  for (const r of RESERVAS_DE_EJEMPLO) {
    const clienteId = clienteMap.get(r.clienteEmail);
    if (!clienteId) {
      console.log(`  ERROR: Cliente ${r.clienteEmail} no encontrado`);
      continue;
    }

    const negocio = negocioData[r.negocioSlug];
    if (!negocio) {
      console.log(`  ERROR: Negocio ${r.negocioSlug} no encontrado`);
      continue;
    }

    let servicioId: string | undefined;
    const lowerName = r.servicioNombre.toLowerCase();
    const fromMap = negocio.servicios?.get(lowerName);
    if (fromMap) {
      servicioId = typeof fromMap === "object" ? fromMap.id : fromMap;
    } else {
      const servicio = await prisma.servicio.findFirst({
        where: {
          negocioId: negocio.id,
          nombre: { equals: r.servicioNombre, mode: "insensitive" as Prisma.QueryMode },
        },
        select: { id: true },
      });
      servicioId = servicio?.id;
    }

    if (!servicioId) {
      console.log(`  ERROR: Servicio "${r.servicioNombre}" no encontrado en ${r.negocioSlug}`);
      continue;
    }

    const servDuracion = await prisma.servicio.findUniqueOrThrow({
      where: { id: servicioId },
      select: { duracionMinutos: true },
    });
    const fechaFin = new Date(r.fechaHoraInicio.getTime() + servDuracion.duracionMinutos * 60 * 1000);
    const venceEn = new Date(r.fechaHoraInicio.getTime() - 5 * 60 * 1000);

    await prisma.reserva.upsert({
      where: { id: r.id },
      update: {
        estado: r.estado,
        fechaHoraInicio: r.fechaHoraInicio,
        fechaHoraFin: fechaFin,
        venceEn,
      },
      create: {
        id: r.id,
        usuarioId: clienteId,
        servicioId: servicioId,
        negocioId: negocio.id,
        fechaHoraInicio: r.fechaHoraInicio,
        fechaHoraFin: fechaFin,
        venceEn,
        estado: r.estado,
        metadata: {},
      },
    });
    console.log(`  Reserva: ${r.id} (${r.estado}) - ${r.servicioNombre}`);
  }
}

async function seedPagosDeEjemplo(pedidosCreados: any[]) {
  console.log("→ Seed: Pagos de ejemplo");

  const pagos = [
    { id: "seed-pago-1", pedidoId: "seed-pedido-1", metodo: "TRANSFERENCIA_BANCARIA" as Prisma.MetodoPago, estado: "COMPLETADO" as Prisma.EstadoPago, idTransferencia: "TXN-001-ABC", monto: 15.0 },
    { id: "seed-pago-2", pedidoId: "seed-pedido-2", metodo: "EFECTIVO_CONTRA_ENTREGA" as Prisma.MetodoPago, estado: "PENDIENTE" as Prisma.EstadoPago, codigoEntrega: generateCodigoEntrega("seed-pago-2"), monto: 6.5 },
    { id: "seed-pago-3", pedidoId: "seed-pedido-3", metodo: "TRANSFERENCIA_BANCARIA" as Prisma.MetodoPago, estado: "COMPLETADO" as Prisma.EstadoPago, idTransferencia: "TXN-003-XYZ", monto: 10 },
    { id: "seed-pago-4", pedidoId: "seed-pedido-4", metodo: "PAGO_MOVIL" as Prisma.MetodoPago, estado: "COMPLETADO" as Prisma.EstadoPago, idTransferencia: "PM-004-789", entidadPago: "Banco Metropolitano", monto: 55.0 },
    { id: "seed-pago-5", pedidoId: "seed-pedido-5", metodo: "EFECTIVO_CONTRA_ENTREGA" as Prisma.MetodoPago, estado: "COMPLETADO" as Prisma.EstadoPago, codigoEntrega: generateCodigoEntrega("seed-pago-5"), monto: 9.0 },
    { id: "seed-pago-6", pedidoId: "seed-pedido-6", metodo: "TRANSFERENCIA_BANCARIA" as Prisma.MetodoPago, estado: "PENDIENTE" as Prisma.EstadoPago, idTransferencia: "TXN-006-DEF", monto: 20 },
    { id: "seed-pago-7", pedidoId: "seed-pedido-7", metodo: "TARJETA" as Prisma.MetodoPago, estado: "CANCELADO" as Prisma.EstadoPago, monto: 75.0 },
    { id: "seed-pago-8", pedidoId: "seed-pedido-8", metodo: "EFECTIVO_CONTRA_ENTREGA" as Prisma.MetodoPago, estado: "COMPLETADO" as Prisma.EstadoPago, codigoEntrega: generateCodigoEntrega("seed-pago-8"), monto: 27.0 },
    { id: "seed-pago-9", pedidoId: "seed-pedido-9", metodo: "PAGO_MOVIL" as Prisma.MetodoPago, estado: "PENDIENTE" as Prisma.EstadoPago, idTransferencia: "PM-009-123", entidadPago: "Banco Popular", monto: 8.0 },
    { id: "seed-pago-10", pedidoId: "seed-pedido-10", metodo: "TARJETA" as Prisma.MetodoPago, estado: "COMPLETADO" as Prisma.EstadoPago, monto: 120.0 },
  ];

  for (const p of pagos) {
    const data: any = {
      id: p.id,
      pedidoId: p.pedidoId,
      metodo: p.metodo,
      estado: p.estado,
      monto: new Prisma.Decimal(p.monto),
      moneda: "CUP",
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
    };

    if (p.idTransferencia) {
      data.idTransferencia = p.idTransferencia;
    }
    if (p.entidadPago) {
      data.entidadPago = p.entidadPago;
    }
    if (p.codigoEntrega) {
      data.codigoEntregaHash = p.codigoEntrega.hash;
      data.codigoEntregaExpira = addDays(new Date(), 2);
      data.codigoEntregaIntentos = 0;
    }

    await prisma.pago.upsert({
      where: { id: p.id },
      update: data,
      create: data,
    });
    console.log(`  Pago: ${p.id} (${p.metodo}, ${p.estado})`);
  }
}

const FACTURAS_DE_EJEMPLO = [
  { id: "seed-factura-1", pedidoId: "seed-pedido-3", prefijo: "PR", consecutivo: 1 },
  { id: "seed-factura-2", pedidoId: "seed-pedido-4", prefijo: "PR", consecutivo: 2 },
  { id: "seed-factura-3", pedidoId: "seed-pedido-5", prefijo: "PR", consecutivo: 3 },
  { id: "seed-factura-4", pedidoId: "seed-pedido-8", prefijo: "PR", consecutivo: 4 },
  { id: "seed-factura-5", pedidoId: "seed-pedido-10", prefijo: "PR", consecutivo: 5 },
];

async function seedFacturasDeEjemplo() {
  console.log("→ Seed: Facturas de ejemplo");

  for (const f of FACTURAS_DE_EJEMPLO) {
    const pedido = await prisma.pedido.findUniqueOrThrow({
      where: { id: f.pedidoId },
      include: { items: true, negocio: { select: { nit: true, direccionFiscal: true, telefonoFiscal: true, emailFiscal: true } }, usuario: { select: { id: true, nombre: true } } },
    });

    let subtotal = 0;
    let impuestos = 0;
    const facturaItems: Prisma.FacturaItemCreateInput[] = [];

    for (const item of pedido.items) {
      subtotal += Number(item.subtotal);
      impuestos += Number(item.montoIVA);
      facturaItems.push({
        productoId: item.productoId ?? undefined,
        servicioId: item.servicioId ?? undefined,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        precioUnitarioBase: item.precioUnitarioBase,
        precioUnitarioConIVA: item.precioUnitarioConIVA,
        tasaIVA: item.tasaIVA,
        tratamientoIVA: item.tratamientoIVA,
        baseImponible: item.baseImponible,
        montoIVA: item.montoIVA,
        subtotal: item.subtotal,
      });
    }

    const total = subtotal;
    const numero = `${f.prefijo}-2026-${String(f.consecutivo).padStart(6, "0")}`;

    await prisma.factura.upsert({
      where: { id: f.id },
      update: {
        numero,
        usuarioId: pedido.usuarioId,
        negocioId: pedido.negocioId,
        nitEmisor: pedido.negocio?.nit ?? null,
        nitReceptor: null,
        subtotal: new Prisma.Decimal(subtotal),
        impuestos: new Prisma.Decimal(impuestos),
        total: new Prisma.Decimal(total),
        baseImponible: new Prisma.Decimal(subtotal - impuestos),
        montoIVA: new Prisma.Decimal(impuestos),
        estado: "emitida",
        items: {
          deleteMany: {},
          create: facturaItems,
        },
      },
      create: {
        id: f.id,
        pedidoId: f.pedidoId,
        usuarioId: pedido.usuarioId,
        negocioId: pedido.negocioId,
        numero,
        nitEmisor: pedido.negocio?.nit ?? null,
        nitReceptor: null,
        subtotal: new Prisma.Decimal(subtotal),
        impuestos: new Prisma.Decimal(impuestos),
        total: new Prisma.Decimal(total),
        baseImponible: new Prisma.Decimal(subtotal - impuestos),
        montoIVA: new Prisma.Decimal(impuestos),
        estado: "emitida",
        items: {
          create: facturaItems,
        },
      },
    });

    await prisma.negocio.update({
      where: { id: pedido.negocioId },
      data: { numeroFacturaConsecutivo: { increment: 1 } },
    });

    console.log(`  Factura: ${numero} (pedido ${f.pedidoId})`);
  }
}

async function seedNotificaciones(
  clientes: { id: string; email: string }[],
  negocioData: Record<string, any>,
  admins: { id: string; email: string }[]
) {
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

  const allUserIds: { id: string; email: string; rol: string }[] = [];
  allUserIds.push(...admins);
  allUserIds.push(...clientes.map((c) => ({ id: c.id, email: c.email, rol: "CLIENTE" })));

  for (const negocioDef of NEGOCIOS) {
    const user = await prisma.user.findUnique({
      where: { email: negocioDef.emailPropietario },
      select: { id: true, email: true, rol: true },
    });
    if (user) allUserIds.push({ id: user.id, email: user.email, rol: user.rol });
  }

  for (const l of ["logistica1@test.com", "logistica2@test.com", "logistica3@test.com"]) {
    const user = await prisma.user.findUnique({
      where: { email: l },
      select: { id: true, email: true, rol: true },
    });
    if (user) allUserIds.push({ id: user.id, email: user.email, rol: user.rol });
  }

  for (const u of allUserIds) {
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
  }
  console.log(`  Preferencias creadas para ${allUserIds.length} usuarios`);

  const ahora = new Date();

  const cliente1 = clientes.find((c) => c.email === "cliente1@test.com");
  const cliente2 = clientes.find((c) => c.email === "cliente2@test.com");
  const cliente3 = clientes.find((c) => c.email === "cliente3@test.com");
  const cliente4 = clientes.find((c) => c.email === "cliente4@test.com");
  const admin = admins.find((a) => a.email === GENERIC_ADMIN_EMAIL);
  const negocioPizzeria = negocioData["pizzeria-bella-napoli"];
  const negocioSalon = negocioData["salon-belleza-estrella"];
  const negocioCafeteria = negocioData["cafeteria-el-cafetal"];

  const ejemplos: { id: string; userId: string | null; tipo: string; titulo: string; mensaje: string; enlace: string }[] = [];

  if (cliente1) {
    ejemplos.push(
      { id: "seed-notif-1", userId: cliente1.id, tipo: "PEDIDO_CREADO", titulo: "Pedido creado", mensaje: "Tu pedido #PED-1 ha sido creado exitosamente.", enlace: "/pedidos" },
      { id: "seed-notif-2", userId: cliente1.id, tipo: "PEDIDO_ESTADO_CAMBIADO", titulo: "Pedido procesando", mensaje: "Tu pedido está siendo preparado.", enlace: "/pedidos" },
      { id: "seed-notif-3", userId: cliente1.id, tipo: "PAGO_CONFIRMADO", titulo: "Pago confirmado", mensaje: "Tu pago ha sido confirmado.", enlace: "/pagos" },
      { id: "seed-notif-4", userId: cliente1.id, tipo: "BIENVENIDA", titulo: "¡Bienvenido!", mensaje: "Gracias por unirte a Mi-Pyme.", enlace: "/catalogo" },
    );
  }
  if (cliente2) {
    ejemplos.push(
      { id: "seed-notif-5", userId: cliente2.id, tipo: "PAGO_RECHAZADO", titulo: "Pago rechazado", mensaje: "Tu pago fue rechazado. Inténtalo nuevamente.", enlace: "/pagos" },
      { id: "seed-notif-6", userId: cliente2.id, tipo: "RESERVA_CREADA", titulo: "Reserva confirmada", mensaje: "Tu reserva ha sido creada.", enlace: "/reservas" },
    );
  }
  if (cliente3) {
    ejemplos.push(
      { id: "seed-notif-7", userId: cliente3.id, tipo: "RESERVA_CANCELADA", titulo: "Reserva cancelada", mensaje: "Tu reserva ha sido cancelada.", enlace: "/reservas" },
      { id: "seed-notif-8", userId: cliente3.id, tipo: "PEDIDO_ESTADO_CAMBIADO", titulo: "Pedido cancelado", mensaje: "Tu pedido ha sido cancelado.", enlace: "/pedidos" },
    );
  }
  if (cliente4) {
    ejemplos.push(
      { id: "seed-notif-9", userId: cliente4.id, tipo: "PEDIDO_ASIGNADO_LOGISTICA", titulo: "Pedido asignado", mensaje: "Tu pedido ha sido asignado a logística.", enlace: "/pedidos" },
      { id: "seed-notif-10", userId: cliente4.id, tipo: "CUPON_PROXIMO_A_EXPIRAR", titulo: "Cupón próximo a expirar", mensaje: "Tu cupón BIENVENIDA10 expira pronto.", enlace: "/cupones" },
    );
  }
  if (admin) {
    ejemplos.push(
      { id: "seed-notif-11", userId: admin.id, tipo: "SOLICITUD_ALTA_CREADA", titulo: "Nueva solicitud", mensaje: "Hay una nueva solicitud de alta pendiente.", enlace: "/admin/solicitudes" },
      { id: "seed-notif-12", userId: admin.id, tipo: "SOLICITUD_ALTA_APROBADA", titulo: "Solicitud aprobada", mensaje: "Una solicitud ha sido aprobada.", enlace: "/admin/solicitudes" },
    );
  }
  if (negocioPizzeria) {
    ejemplos.push(
      { id: "seed-notif-13", userId: negocioPizzeria.userId, tipo: "PEDIDO_CREADO", titulo: "Nuevo pedido", mensaje: "Has recibido un nuevo pedido.", enlace: "/negocio/pedidos" },
      { id: "seed-notif-14", userId: negocioPizzeria.userId, tipo: "PROMOCION_AGOTADA", titulo: "Promoción agotada", mensaje: "Tu promoción ha sido agotada.", enlace: "/negocio/promociones" },
      { id: "seed-notif-15", userId: negocioPizzeria.userId, tipo: "STOCK_BAJO", titulo: "Stock bajo", mensaje: "El stock de un producto está bajo.", enlace: "/negocio/inventario" },
    );
  }

  for (let i = 0; i < ejemplos.length; i++) {
    const e = ejemplos[i];
    const estado = i < 3 ? "NO_LEIDA" : (i % 2 === 0 ? "LEIDA" : "NO_LEIDA");
    await prisma.notificacion.upsert({
      where: { id: e.id },
      update: { titulo: e.titulo, mensaje: e.mensaje, estado: estado as Prisma.EstadoNotificacion },
      create: {
        id: e.id,
        userId: e.userId!,
        tipo: e.tipo as Prisma.TipoNotificacion,
        estado: estado as Prisma.EstadoNotificacion,
        titulo: e.titulo,
        mensaje: e.mensaje,
        enlace: e.enlace,
        metadata: {},
        leidaEn: estado === "LEIDA" ? new Date(ahora.getTime() - 86400000) : undefined,
      },
    });
    await logSeed("SEED_NOTIFICACION_EJEMPLO", e.userId, { tipo: e.tipo });
  }
  console.log(`  ${ejemplos.length} notificaciones de ejemplo creadas`);
}

async function seedAuditLogs() {
  console.log("→ Seed: Audit logs de ejemplo");

  const auditEvents = [
    { eventType: "USER_CREATED", targetId: "seed-neg-pizzeria-bella-napoli", meta: { email: "negocio.pizzeria@test.com", rol: "NEGOCIO" } },
    { eventType: "USER_UPDATED", targetId: "seed-neg-pizzeria-bella-napoli", meta: { field: "nombre", oldValue: null, newValue: "David Rodríguez" } },
    { eventType: "NEGOCIO_CREADO", targetId: "seed-neg-pizzeria-bella-napoli", meta: { nombre: "Pizzería Bella Napoli", area: "Comida y Restaurantes" } },
    { eventType: "NEGOCIO_APROBADO", targetId: "seed-neg-pizzeria-bella-napoli", meta: { aprobadoPor: GENERIC_ADMIN_EMAIL } },
    { eventType: "PRODUCTO_CREADO", targetId: "seed-prod-pizzeria-bella-napoli-0", meta: { nombre: "Pizza Margarita", negocio: "Pizzería Bella Napoli" } },
    { eventType: "PRODUCTO_ACTUALIZADO", targetId: "seed-prod-pizzeria-bella-napoli-0", meta: { field: "precio", oldValue: 7.5, newValue: 8.0 } },
    { eventType: "SERVICIO_CREADO", targetId: "seed-serv-pizzeria-bella-napoli-0", meta: { nombre: "Reserva de mesa", negocio: "Pizzería Bella Napoli" } },
    { eventType: "PEDIDO_CREADO", targetId: "seed-pedido-1", meta: { cliente: "cliente1@test.com", negocio: "Pizzería Bella Napoli", total: 13.0 } },
    { eventType: "PEDIDO_ESTADO_CAMBIADO", targetId: "seed-pedido-1", meta: { oldEstado: "pendiente", newEstado: "procesando" } },
    { eventType: "PEDIDO_CANCELADO", targetId: "seed-pedido-7", meta: { negocio: "Boutique María", motivo: "Cancelado por el cliente" } },
    { eventType: "PAGO_CONFIRMADO", targetId: "seed-pago-1", meta: { metodo: "TRANSFERENCIA_BANCARIA", monto: 15.0 } },
    { eventType: "PAGO_RECHAZADO", targetId: "seed-pago-6", meta: { metodo: "TRANSFERENCIA_BANCARIA", motivo: "Fondos insuficientes" } },
    { eventType: "PAGO_REEMBOLSADO", targetId: "seed-pago-7", meta: { metodo: "TARJETA", monto: 75.0 } },
    { eventType: "RESERVA_CREADA", targetId: "seed-reserva-1", meta: { cliente: "cliente1@test.com", servicio: "Corte de cabello" } },
    { eventType: "RESERVA_CANCELADA", targetId: "seed-reserva-2", meta: { cliente: "cliente1@test.com", motivo: "Cambio de agenda" } },
    { eventType: "SOLICITUD_ALTA_APROBADA", targetId: "seed-neg-pizzeria-bella-napoli", meta: { aprobadoPor: GENERIC_ADMIN_EMAIL } },
    { eventType: "INVENTARIO_ACTUALIZADO", targetId: "seed-prod-pizzeria-bella-napoli-0", meta: { cantidadAnterior: 20, cantidadNueva: 15 } },
    { eventType: "STOCK_BAJO", targetId: "seed-prod-salon-belleza-estrella-2", meta: { producto: "Esmalte de uñas", cantidadActual: 3 } },
    { eventType: "PROMOCION_CREADA", targetId: "seed-promo-pizzeria-15pct", meta: { negocio: "Pizzería Bella Napoli", tipo: "PORCENTAJE", valor: 15 } },
    { eventType: "CUPON_USADO", targetId: "seed-pedido-1", meta: { codigo: "BIENVENIDA10", descuento: 1.5 } },
  ];

  for (const evt of auditEvents) {
    await prisma.auditLog.upsert({
      where: { id: `seed-audit-${evt.eventType}` },
      update: { targetId: evt.targetId, meta: evt.meta as Prisma.InputJsonValue },
      create: {
        id: `seed-audit-${evt.eventType}`,
        eventType: evt.eventType,
        targetId: evt.targetId,
        meta: evt.meta as Prisma.InputJsonValue,
        timestamp: SEED_DATE,
      },
    });
  }
  console.log(`  ${auditEvents.length} audit logs de ejemplo creados`);
}

async function main() {
  console.log("🌱 Iniciando seed completo...\n");

  const { provinciaMap, municipioMap } = await seedProvincias();
  console.log("");

  await seedAreasYSubareas();
  console.log("");

  const admins = await seedAdmins();
  console.log("");

  const clientes = await seedClientes();
  console.log("");

  const logisticaUsers = await seedUsuariosLogistica();
  console.log("");

  await seedUsuariosAuthTest();
  console.log("");

  const negocioData = await seedNegocios(admins);
  console.log("");

  await seedProveedoresLogisticos(logisticaUsers);
  console.log("");

  await seedOpcionesLogisticas(negocioData);
  console.log("");

  await seedServiciosTransporte(negocioData);
  console.log("");

  await seedPromociones(negocioData);
  console.log("");

  await seedCupones(negocioData);
  console.log("");

  await seedCombos(negocioData);
  console.log("");

  const pedidosCreados = await seedPedidosDeEjemplo(clientes, negocioData);
  console.log("");

  await seedReservasDeEjemplo(clientes, negocioData);
  console.log("");

  await seedPagosDeEjemplo(pedidosCreados);
  console.log("");

  await seedFacturasDeEjemplo();
  console.log("");

  await seedNotificaciones(clientes, negocioData, admins);
  console.log("");

  await seedAuditLogs();
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
    prisma.promocion.count(),
    prisma.cupon.count(),
    prisma.combo.count(),
    prisma.pedido.count(),
    prisma.reserva.count(),
    prisma.pago.count(),
    prisma.factura.count(),
    prisma.notificacion.count(),
    prisma.preferenciaNotificacion.count(),
    prisma.auditLog.count(),
    prisma.provincia.count(),
    prisma.municipio.count(),
  ]);

  console.log("=== Resumen final ===");
  console.log(`  Provincias:           ${counts[21]}`);
  console.log(`  Municipios:           ${counts[22]}`);
  console.log(`  Áreas:                ${counts[6]}`);
  console.log(`  Subáreas:             ${counts[7]}`);
  console.log(`  Usuarios:             ${counts[0]}`);
  console.log(`  Negocios:             ${counts[1]}`);
  console.log(`  Productos:            ${counts[2]}`);
  console.log(`  Servicios:            ${counts[3]}`);
  console.log(`  Inventario:           ${counts[4]}`);
  console.log(`  Disponibilidad:       ${counts[5]}`);
  console.log(`  Proveedores:          ${counts[8]}`);
  console.log(`  Opciones logísticas:  ${counts[9]}`);
  console.log(`  Horarios negocio:     ${counts[10]}`);
  console.log(`  Promociones:          ${counts[11]}`);
  console.log(`  Cupones:              ${counts[12]}`);
  console.log(`  Combos:               ${counts[13]}`);
  console.log(`  Pedidos:              ${counts[14]}`);
  console.log(`  Reservas:             ${counts[15]}`);
  console.log(`  Pagos:                ${counts[16]}`);
  console.log(`  Facturas:             ${counts[17]}`);
  console.log(`  Notificaciones:       ${counts[18]}`);
  console.log(`  Preferencias notif.:  ${counts[19]}`);
  console.log(`  Audit logs:           ${counts[20]}`);
  console.log("");
  console.log("✅ Seed completo finalizado");
  console.log("📋 Credenciales de prueba:");
  console.log("   Admin:    admin@mi-pyme.local / 12345678 (cambiar password)");
  console.log("   Admin:    admin2@test.com / test1234");
  console.log("   Cliente:  cliente1@test.com / cliente123");
  console.log("   Cliente:  cliente2@test.com / cliente123");
  console.log("   Cliente:  cliente3@test.com / cliente123");
  console.log("   Cliente:  cliente4@test.com / cliente123");
  console.log("   Cliente:  cliente5@test.com / cliente123");
  console.log("   Negocio:  negocio.pizzeria@test.com / negocio123");
  console.log("   Negocio:  negocio.panaderia@test.com / negocio123");
  console.log("   Negocio:  negocio.salon@test.com / negocio123");
  console.log("   Negocio:  negocio.boutique@test.com / negocio123");
  console.log("   Negocio:  (12 negocios, todas con negocio123)");
  console.log("   Logística: logistica1@test.com / logistica123");
  console.log("   Logística: logistica2@test.com / logistica123");
  console.log("   Logística: logistica3@test.com / logistica123");
  console.log("   Test:     inactive@test.com / test1234 (inactivo)");
  console.log("   Test:     mustchange@test.com / test1234 (mustChangePassword)");
  console.log("   Test:     locked@test.com / test1234 (bloqueado)");
  console.log("");
  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
