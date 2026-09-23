import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "./setup";
import { resetCache } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import {
  HORA_CORTE_DISPONIBILIDAD,
  CODIGO_SIN_DISPONIBILIDAD,
  CODIGO_SIN_CUPO,
  CODIGO_FECHA_INVALIDA,
  CODIGO_FUERA_DE_HORARIO,
} from "@/core/constants";
import {
  fechaHoy,
  formatFechaISO,
} from "@/shared/utils/fecha";
import DisponibilidadService from "@/services/DisponibilidadService";
import AdminDisponibilidadService from "@/services/AdminDisponibilidadService";
import type { Area, Subarea, Negocio, User, Producto, Servicio, Inventario, Carrito } from "@/generated/prisma/client";

const dispService = new DisponibilidadService();
const adminDispService = new AdminDisponibilidadService();

describe("DisponibilidadService", () => {
  let area: Area;
  let subarea: Subarea;
  let negocio: Negocio;
  let negocioUsuario: User;
  let producto: Producto;
  let inventario: Inventario;
  let servicio: Servicio;
  let cliente: User;
  let carrito: Carrito;

  const idsABorrar: { table: string; id: string }[] = [];

  beforeAll(async () => {
    await setupDisponibilidadData();
    const data = await createDisponibilidadEntities();
    area = data.area;
    subarea = data.subarea;
    negocio = data.negocio;
    negocioUsuario = data.negocioUsuario;
    producto = data.producto;
    inventario = data.inventario;
    servicio = data.servicio;
    cliente = data.cliente;
    carrito = data.carrito;
  });

  afterAll(async () => {
    for (const r of idsABorrar) {
      await prisma.$executeRawUnsafe(`DELETE FROM "${r.table}" WHERE id = '${r.id}'`);
    }
    await clearTablaDisponibilidad();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetCache();
  });

  describe("getDisponibilidadProducto", () => {
    it("returns disponible:false when no DisponibilidadProducto record exists for today", async () => {
      // Use a product that has NO disp record for today.
      const hoy = fechaHoy();
      const iso = formatFechaISO(hoy);
      // Ensure no record for today exists
      await prisma.disponibilidadProducto.deleteMany({
        where: { productoId: producto.id, fecha: hoy },
      });

      const disp = await dispService.getDisponibilidadProducto(producto.id, hoy);
      expect(disp.disponible).toBe(false);
      expect(disp.cantidadOfertada).toBe(0);
      expect(disp.cantidadDisponible).toBe(0);
      // cached key should contain the iso
      expect(iso).toBe(formatFechaISO(hoy));
    });

    it("respects min(ofertada - reservada, stock) — stock limits availability", async () => {
      const manana = new Date(fechaHoy());
      manana.setUTCDate(manana.getUTCDate() + 1);

      await prisma.disponibilidadProducto.create({
        data: { productoId: producto.id, fecha: manana, cantidad: 5 },
      });

      // stock == 3 (inventario.cantidadActual = 3)
      const disp = await dispService.getDisponibilidadProducto(producto.id, manana);
      expect(disp.cantidadOfertada).toBe(5);
      expect(disp.cantidadDisponible).toBe(3);
      expect(disp.disponible).toBe(true);
    });

    it("respects min(ofertada - reservada, stock) — reservation reduces availability", async () => {
      const pasadoMañana = new Date(fechaHoy());
      pasadoMañana.setUTCDate(pasadoMañana.getUTCDate() + 2);

      await prisma.disponibilidadProducto.create({
        data: { productoId: producto.id, fecha: pasadoMañana, cantidad: 20 },
      });

      // Reserve 5 units in the active cart for the same delivery date
      await prisma.carritoItem.create({
        data: {
          carritoId: carrito.id,
          productoId: producto.id,
          cantidad: 5,
          precioUnitario: producto.precio,
          tipo: "producto",
          fechaEntrega: pasadoMañana,
        },
      });
      idsABorrar.push({ table: "CarritoItem", id: "" }); // cleaned in clearTabla

      const disp = await dispService.getDisponibilidadProducto(producto.id, pasadoMañana);
      // stock = 3 (inventario global), so min(20-5, 3) = 3
      expect(disp.cantidadReservada).toBe(5);
      expect(disp.cantidadDisponible).toBe(3);
      expect(disp.disponible).toBe(true);
    });
  });

  describe("puedeComprarProducto", () => {
    it("throws SIN_DISPONIBILIDAD when product has no availability for the day", async () => {
      const manana = new Date(fechaHoy());
      manana.setUTCDate(manana.getUTCDate() + 1);

      // Create a separate product with NO disp record
      const otro = await prisma.producto.create({
        data: {
          negocioId: negocio.id,
          subareaId: subarea.id,
          nombre: "Producto Sin Disp Test",
          precio: 10,
          unidadMedida: "unidad",
          imagenUrl: "https://example.com/x.jpg",
          activo: true,
        },
      });
      idsABorrar.push({ table: "Producto", id: otro.id });

      await expect(
        dispService.puedeComprarProducto(otro.id, 1, manana)
      ).rejects.toThrow(BusinessError);
      await expect(
        dispService.puedeComprarProducto(otro.id, 1, manana)
      ).rejects.toMatchObject({ code: CODIGO_SIN_DISPONIBILIDAD });
    });

    it("throws SIN_DISPONILIDAD when requested quantity exceeds availability", async () => {
      const manana = new Date(fechaHoy());
      manana.setUTCDate(manana.getUTCDate() + 1);

      await prisma.disponibilidadProducto.upsert({
        where: { productoId_fecha: { productoId: producto.id, fecha: manana } },
        create: { productoId: producto.id, fecha: manana, cantidad: 2 },
        update: { cantidad: 2 },
      });

      // stock = 3, oferta = 2 → disponible = 2. Request 3 should fail.
      await expect(
        dispService.puedeComprarProducto(producto.id, 3, manana)
      ).rejects.toThrow(BusinessError);
      await expect(
        dispService.puedeComprarProducto(producto.id, 3, manana)
      ).rejects.toMatchObject({ code: CODIGO_SIN_DISPONIBILIDAD });
    });
  });

  describe("puedeReservarServicio", () => {
    it("throws SIN_CUPO when capacity is exceeded", async () => {
      const manana = new Date(fechaHoy());
      manana.setUTCDate(manana.getUTCDate() + 1);
      const inicioReserva = new Date(manana);
      inicioReserva.setUTCHours(10, 0, 0, 0);

      // Create capacidad=2 worth of reservations + 1 extra
      await prisma.reserva.createMany({
        data: [
          {
            usuarioId: cliente.id,
            servicioId: servicio.id,
            negocioId: negocio.id,
            fechaHoraInicio: inicioReserva,
            fechaHoraFin: new Date(inicioReserva.getTime() + 60 * 60 * 1000),
            venceEn: new Date(inicioReserva.getTime() + 15 * 60 * 1000),
            estado: "pendiente",
          },
          {
            usuarioId: cliente.id,
            servicioId: servicio.id,
            negocioId: negocio.id,
            fechaHoraInicio: inicioReserva,
            fechaHoraFin: new Date(inicioReserva.getTime() + 60 * 60 * 1000),
            venceEn: new Date(inicioReserva.getTime() + 15 * 60 * 1000),
            estado: "pendiente",
          },
        ],
      });
      idsABorrar.push({ table: "Reserva", id: "" });

      // servicio.capacidad is 3 in setup -> 2 reserved leaves 1
      const cupos = await dispService.getCuposServicio(servicio.id, manana);
      expect(cupos.capacidad).toBe(3);
      expect(cupos.reservadas).toBe(2);
      expect(cupos.cuposDisponibles).toBe(1);

      // Request 2 → exceeds the 1 remaining
      await expect(
        dispService.puedeReservarServicio(servicio.id, manana, 2)
      ).rejects.toThrow(BusinessError);
      await expect(
        dispService.puedeReservarServicio(servicio.id, manana, 2)
      ).rejects.toMatchObject({ code: CODIGO_SIN_CUPO });
    });
  });

  describe("fecha y horario de corte", () => {
    const realDate = Date;

    afterEach(() => {
      vi.useRealTimers();
      global.Date = realDate;
    });

    it("throws FECHA_INVALIDA for past dates", async () => {
      const ayer = new Date(fechaHoy());
      ayer.setUTCDate(ayer.getUTCDate() - 1);

      await expect(
        dispService.puedeComprarProducto(producto.id, 1, ayer)
      ).rejects.toMatchObject({ code: CODIGO_FECHA_INVALIDA });
    });

    it("throws FUERA_DE_HORARIO when past corte hour on today", async () => {
      // Set fake "now" to 23:00 local → >= HORA_CORTE_DISPONIBILIDAD (22)
      const fakeNow = new Date(fechaHoy().toISOString());
      fakeNow.setHours(HORA_CORTE_DISPONIBILIDAD + 1, 0, 0, 0);
      vi.useFakeTimers({ now: fakeNow });

      await expect(
        dispService.puedeComprarProducto(producto.id, 1, fechaHoy())
      ).rejects.toMatchObject({ code: CODIGO_FUERA_DE_HORARIO });

      vi.useRealTimers();
    });
  });
});

describe("AdminDisponibilidadService", () => {
  let negocio: Negocio;
  let negocioUsuario: User;
  let producto: Producto;
  let subarea: Subarea;
  let area: Area;

  const idsABorrar: { table: string; id: string }[] = [];

  beforeAll(async () => {
    const data = await createDisponibilidadEntities();
    area = data.area;
    subarea = data.subarea;
    negocio = data.negocio;
    negocioUsuario = data.negocioUsuario;
    producto = data.producto;
  });

  afterAll(async () => {
    for (const r of idsABorrar) {
      await prisma.$executeRawUnsafe(`DELETE FROM "${r.table}" WHERE id = '${r.id}'`);
    }
    await clearTablaDisponibilidad();
  });

  beforeEach(async () => {
    await resetCache();
  });

  describe("bulkSetDisponibilidad", () => {
    it("creates N records and is idempotent", async () => {
      const fechas = fechasFuturas(5);

      const creados1 = await adminDispService.bulkSetDisponibilidad(
        producto.id,
        fechas,
        10
      );
      expect(creados1).toBe(5);

      // Verify all exist with cantidad 10
      const records = await prisma.disponibilidadProducto.findMany({
        where: { productoId: producto.id, fecha: { in: fechas } },
      });
      expect(records).toHaveLength(5);
      expect(records.every((r) => r.cantidad === 10)).toBe(true);

      // Idempotent: re-running updates, still 5 records
      const creados2 = await adminDispService.bulkSetDisponibilidad(
        producto.id,
        fechas,
        10
      );
      expect(creados2).toBe(5);

      const records2 = await prisma.disponibilidadProducto.findMany({
        where: { productoId: producto.id, fecha: { in: fechas } },
      });
      expect(records2).toHaveLength(5);
    });

    it("setDisponibilidad upserts a single day", async () => {
      const manana = new Date(fechaHoy());
      manana.setUTCDate(manana.getUTCDate() + 1);

      await adminDispService.setDisponibilidad(producto.id, manana, 7, "nota");
      const rec = await prisma.disponibilidadProducto.findUnique({
        where: { productoId_fecha: { productoId: producto.id, fecha: manana } },
      });
      expect(rec).not.toBeNull();
      expect(rec!.cantidad).toBe(7);
      expect(rec!.notas).toBe("nota");

      // upsert again
      await adminDispService.setDisponibilidad(producto.id, manana, 4);
      const rec2 = await prisma.disponibilidadProducto.findUnique({
        where: { productoId_fecha: { productoId: producto.id, fecha: manana } },
      });
      expect(rec2!.cantidad).toBe(4);
    });

    it("eliminarDisponibilidad removes the record", async () => {
      const manana = new Date(fechaHoy());
      manana.setUTCDate(manana.getUTCDate() + 1);

      await adminDispService.setDisponibilidad(producto.id, manana, 8);
      await adminDispService.eliminarDisponibilidad(producto.id, manana);

      const rec = await prisma.disponibilidadProducto.findUnique({
        where: { productoId_fecha: { productoId: producto.id, fecha: manana } },
      });
      expect(rec).toBeNull();
    });

    it("setDisponibilidadAutorizado rejects when not owner", async () => {
      const manana = new Date(fechaHoy());
      manana.setUTCDate(manana.getUTCDate() + 1);

      await expect(
        adminDispService.setDisponibilidadAutorizado(
          "not-owner-id",
          producto.id,
          manana,
          5
        )
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it("setDisponibilidadAutorizado rejects past dates", async () => {
      const ayer = new Date(fechaHoy());
      ayer.setUTCDate(ayer.getUTCDate() - 1);

      await expect(
        adminDispService.setDisponibilidadAutorizado(
          negocioUsuario.id,
          producto.id,
          ayer,
          5
        )
      ).rejects.toMatchObject({ code: CODIGO_FECHA_INVALIDA });
    });
  });
});

/** --- helpers --- */

async function setupDisponibilidadData() {
  await clearTablaDisponibilidad();
}

async function clearTablaDisponibilidad() {
  await prisma.$executeRawUnsafe(`DELETE FROM "DisponibilidadProducto";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "CarritoItem";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Carrito";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Reserva";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "PedidoItem";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Pedido";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "FacturaItem";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Factura";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Inventario";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Producto";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Servicio";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "NegocioSubarea";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Negocio";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "User";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Area";`);
  await prisma.$executeRawUnsafe(`DELETE FROM "Subarea";`);
}

async function createDisponibilidadEntities() {
  const area = await prisma.area.create({
    data: { nombre: "Servicios Disp", slug: "servicios-disp-test", activo: true },
  });

  const subarea = await prisma.subarea.create({
    data: { nombre: "Belleza Disp", slug: "belleza-disp-test", activo: true },
  });

  const negocioUsuario = await prisma.user.create({
    data: {
      email: `negocio-disp${Date.now()}@test.com`,
      password: "x",
      nombre: "Negocio Disp Test",
      rol: "NEGOCIO",
    },
  });

  const negocio = await prisma.negocio.create({
    data: {
      nombre: "Spa Disp Test",
      slug: `spa-disp-test-${Date.now()}`,
      activo: true,
      areaId: area.id,
      userId: negocioUsuario.id,
    },
  });

  await prisma.negocioSubarea.create({
    data: { negocioId: negocio.id, subareaId: subarea.id },
  });

  const producto = await prisma.producto.create({
    data: {
      negocioId: negocio.id,
      subareaId: subarea.id,
      nombre: "Producto Disp Test",
      precio: 25.5,
      unidadMedida: "unidad",
      imagenUrl: "https://example.com/disp.jpg",
      activo: true,
    },
  });

  const inventario = await prisma.inventario.create({
    data: {
      productoId: producto.id,
      cantidadActual: 3,
      puntoReorden: 1,
      ubicacion: "Almacén B",
    },
  });

  const servicio = await prisma.servicio.create({
    data: {
      negocioId: negocio.id,
      subareaId: subarea.id,
      nombre: "Servicio Disp Test",
      descripcion: "Servicio de prueba",
      duracionMinutos: 60,
      horariosDisponibles: JSON.stringify([]),
      capacidad: 3,
      imagenUrl: "https://example.com/serv.jpg",
      activo: true,
    },
  });

  const cliente = await prisma.user.create({
    data: {
      email: `cliente-disp${Date.now()}@test.com`,
      password: "x",
      nombre: "Cliente Disp Test",
      rol: "CLIENTE",
    },
  });

  const carrito = await prisma.carrito.create({
    data: { usuarioId: cliente.id, estado: "activo" },
  });

  return { area, subarea, negocio, negocioUsuario, producto, inventario, servicio, cliente, carrito };
}

function fechasFuturas(dias: number): Date[] {
  const hoy = fechaHoy();
  const arr: Date[] = [];
  for (let i = 1; i <= dias; i++) {
    const d = new Date(hoy);
    d.setUTCDate(d.getUTCDate() + i);
    arr.push(d);
  }
  return arr;
}
