import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma, cleanupTestData } from "./setup";
import { Rol, Area, Subarea, Negocio, Producto, Servicio, Inventario, OpcionLogistica, ProveedorLogistico, User } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";

import { DashboardNegocioService } from "@/services/DashboardNegocioService";
import { LogisticaNegocioService } from "@/services/LogisticaNegocioService";
import { SolicitudAltaService } from "@/services/SolicitudAltaService";
import { CatalogService } from "@/services/CatalogService";
import { assertPertenencia } from "@/services/utils/permisos";
import { BusinessError } from "@/shared/types";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe("Panel Negocio Services", () => {
  let testData: {
    user: User;
    negocio: Negocio;
    area: Area;
    subarea: Subarea;
    producto: Producto;
    servicio: Servicio;
    inventario: Inventario;
    proveedor: ProveedorLogistico;
    opcion: OpcionLogistica;
  };

  const dashboardService = new DashboardNegocioService();
  const logisticaService = new LogisticaNegocioService();
  const solicitudService = new SolicitudAltaService();
  const catalogoService = new CatalogService();

  beforeAll(async () => {
    await prisma.$executeRawUnsafe(`DELETE FROM "OpcionLogistica"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "ProveedorLogistico"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "FacturaItem"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Factura"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "PedidoItem"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Pedido"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Reserva"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "CarritoItem"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Carrito"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "DisponibilidadProducto"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Inventario"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Servicio"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Producto"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "NegocioSubarea"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Negocio"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "SolicitudAltaNegocio"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "User"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Area"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "Subarea"`);

    const area = await prisma.area.create({
      data: { nombre: "Servicios", slug: "servicios", activo: true },
    });

    const subarea = await prisma.subarea.create({
      data: { nombre: "Belleza", slug: "belleza", activo: true },
    });

    const password = await bcrypt.hash("password123", 10);
    const user = await prisma.user.create({
      data: {
        email: "negocio@test.com",
        password,
        nombre: "Negocio Test",
        rol: Rol.NEGOCIO,
      },
    });

    const negocio = await prisma.negocio.create({
      data: {
        nombre: "Spa Premium",
        slug: "spa-premium-test",
        activo: true,
        estado: "ACTIVO",
        userId: user.id,
        areaId: area.id,
        provincia: "Buenos Aires",
        municipio: "CABA",
        telefono: "12345678",
        emailContacto: "negocio@test.com",
        permiteReservas: true,
        permiteEnvio: true,
        aprobadoPorId: user.id,
        aprobadoEn: new Date(),
      },
    });

    await prisma.negocioSubarea.create({
      data: { negocioId: negocio.id, subareaId: subarea.id },
    });

    const producto = await prisma.producto.create({
      data: {
        negocioId: negocio.id,
        subareaId: subarea.id,
        nombre: "Kit de Belleza",
        descripcion: "Kit completo",
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

    const proveedor = await prisma.proveedorLogistico.create({
      data: {
        usuarioId: user.id,
        nombre: "Envíos Express",
        zonaCobertura: "Capital Federal",
        alcanceNacional: false,
        contacto: "contacto@envios.com",
      },
    });

    const opcion = await prisma.opcionLogistica.create({
      data: {
        negocioId: negocio.id,
        proveedorId: proveedor.id,
        nombre: "Envío domicilio",
        tipo: "envio",
        tarifaBase: 500,
        tarifaPorDistancia: 50,
        tiempoEstimado: "24-48 horas",
      },
    });

    testData = { user, negocio, area, subarea, producto, servicio, inventario, proveedor, opcion };
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(`DELETE FROM "OpcionLogistica"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "ProveedorLogistico"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "SolicitudAltaNegocio"`);
    await cleanupTestData();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DashboardNegocioService", () => {
    it("should return resumen con datos correctos", async () => {
      const resumen = await dashboardService.getResumen(
        testData.negocio.id,
        testData.user.id,
        undefined,
        Rol.NEGOCIO
      );

      expect(resumen).toBeDefined();
      expect(resumen.negocio.id).toBe(testData.negocio.id);
      expect(resumen.negocio.nombre).toBe("Spa Premium");
      expect(typeof resumen.pedidosPendientes).toBe("number");
      expect(typeof resumen.ventasPeriodo).toBe("number");
      expect(typeof resumen.stockBajo).toBe("number");
      expect(typeof resumen.disponibleHoyCount).toBe("number");
      expect(typeof resumen.reservasProximas).toBe("number");
    });

    it("should throw BusinessError for non-owner accessing negocio", async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: "other@test.com",
          password: "pass",
          nombre: "Other User",
          rol: Rol.CLIENTE,
        },
      });

      try {
        await dashboardService.getResumen(testData.negocio.id, otherUser.id, undefined, Rol.CLIENTE);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(BusinessError);
        expect((err as BusinessError).code).toBe("NO_AUTORIZADO");
      }

      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it("should listar pedidos (vacío si no hay)", async () => {
      const pedidos = await dashboardService.listarPedidos(
        testData.negocio.id,
        testData.user.id,
        Rol.NEGOCIO
      );
      expect(Array.isArray(pedidos)).toBe(true);
    });

    it("should listar reservas (vacío si no hay)", async () => {
      const reservas = await dashboardService.listarReservas(
        testData.negocio.id,
        testData.user.id,
        Rol.NEGOCIO
      );
      expect(Array.isArray(reservas)).toBe(true);
    });

    it("should allow ADMIN to access any negocio", async () => {
      const admin = await prisma.user.create({
        data: {
          email: "admin@test.com",
          password: "pass",
          nombre: "Admin User",
          rol: Rol.ADMIN,
        },
      });

      const resumen = await dashboardService.getResumen(
        testData.negocio.id,
        admin.id,
        undefined,
        Rol.ADMIN
      );

      expect(resumen.negocio.id).toBe(testData.negocio.id);

      await prisma.user.delete({ where: { id: admin.id } });
    });
  });

  describe("LogisticaNegocioService", () => {
    it("should list OpcionesDeNegocio", async () => {
      const opciones = await logisticaService.listOpcionesDeNegocio(
        testData.negocio.id,
        testData.user.id,
        Rol.NEGOCIO
      );

      expect(Array.isArray(opciones)).toBe(true);
      expect(opciones.length).toBe(1);
      expect((opciones[0] as { nombre: string }).nombre).toBe("Envío domicilio");
      expect((opciones[0] as unknown as { proveedor: { nombre: string } }).proveedor.nombre).toBe("Envíos Express");
    });

    it("should list ProveedoresDisponibles excluyendo los ya usados", async () => {
      const proveedores = await logisticaService.listProveedoresDisponibles(
        testData.negocio.id,
        testData.user.id,
        Rol.NEGOCIO
      );

      expect(Array.isArray(proveedores)).toBe(true);
      expect(proveedores).toHaveLength(0);
    });

    it("should crearOpcion with a new proveedor", async () => {
      const proveedor2 = await prisma.proveedorLogistico.create({
        data: {
          usuarioId: testData.user.id,
          nombre: "Rapidísimo",
          zonaCobertura: "Nacional",
          alcanceNacional: true,
          contacto: "contacto@rapidisimo.com",
        },
      });

      const opc = await logisticaService.crearOpcion(
        testData.negocio.id,
        {
          proveedorId: proveedor2.id,
          nombre: "Envío exprés",
          tipo: "express",
          tarifaBase: 800,
          tarifaPorDistancia: 80,
          tiempoEstimado: "12 horas",
        },
        testData.user.id,
        Rol.NEGOCIO
      );

      expect(opc.nombre).toBe("Envío exprés");
      expect(opc.tipo).toBe("express");

      await prisma.opcionLogistica.delete({ where: { id: opc.id } });
      await prisma.proveedorLogistico.delete({ where: { id: proveedor2.id } });
    });

    it("should eliminarOpcion", async () => {
      const proveedor3 = await prisma.proveedorLogistico.create({
        data: {
          usuarioId: testData.user.id,
          nombre: "Test Envíos",
          zonaCobertura: "Nacional",
          alcanceNacional: true,
          contacto: "test@envios.com",
        },
      });

      const opc = await logisticaService.crearOpcion(
        testData.negocio.id,
        {
          proveedorId: proveedor3.id,
          nombre: "Envío test",
          tipo: "envio",
          tarifaBase: 100,
          tarifaPorDistancia: 10,
          tiempoEstimado: "48 horas",
        },
        testData.user.id,
        Rol.NEGOCIO
      );

      await logisticaService.eliminarOpcion(opc.id, testData.user.id, Rol.NEGOCIO);

      const found = await prisma.opcionLogistica.findUnique({ where: { id: opc.id } });
      expect(found).toBeNull();

      await prisma.proveedorLogistico.delete({ where: { id: proveedor3.id } });
    });
  });

  describe("SolicitudAltaService", () => {
    it("should crearSolicitud for a new user", async () => {
      const clienteUser = await prisma.user.create({
        data: {
          email: "cliente-solicitud@test.com",
          password: "pass",
          nombre: "Cliente Test",
          rol: Rol.CLIENTE,
        },
      });

      const sol = await solicitudService.crearSolicitud(clienteUser.id, {
        nombreNegocio: "Nuevo Negocio",
        descripcion: "Un negocio nuevo",
        areaId: testData.area.id,
        subareaIds: [testData.subarea.id],
        provincia: "Buenos Aires",
        municipio: "La Plata",
        telefono: "87654321",
        emailContacto: "nuevo@test.com",
        direccion: "Calle 123",
      });

      expect(sol.nombreNegocio).toBe("Nuevo Negocio");
      expect(sol.estado).toBe("PENDIENTE_APROBACION");

      await prisma.user.delete({ where: { id: clienteUser.id } });
    });

    it("should not allow duplicate pending solicitud", async () => {
      const clienteUser = await prisma.user.create({
        data: {
          email: "cliente-dup@test.com",
          password: "pass",
          nombre: "Cliente Dup",
          rol: Rol.CLIENTE,
        },
      });

      await solicitudService.crearSolicitud(clienteUser.id, {
        nombreNegocio: "Negocio Uno",
        telefono: "11111111",
        emailContacto: "uno@test.com",
      });

      try {
        await solicitudService.crearSolicitud(clienteUser.id, {
          nombreNegocio: "Negocio Dos",
          telefono: "22222222",
          emailContacto: "dos@test.com",
        });
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(BusinessError);
        expect((err as BusinessError).code).toBe("CONFLICTO");
      }

      await prisma.user.delete({ where: { id: clienteUser.id } });
    });

    it("should getSolicitud for propietario and admin", async () => {
      const clienteUser = await prisma.user.create({
        data: {
          email: "cliente-get@test.com",
          password: "pass",
          nombre: "Cliente Get",
          rol: Rol.CLIENTE,
        },
      });

      const sol = await solicitudService.crearSolicitud(clienteUser.id, {
        nombreNegocio: "Negocio Get",
        telefono: "33333333",
        emailContacto: "get@test.com",
      });

      const fetched = await solicitudService.getSolicitud(sol.id, clienteUser.id, Rol.CLIENTE);
      expect(fetched).not.toBeNull();
      expect(fetched!.nombreNegocio).toBe("Negocio Get");

      try {
        const otherUser = await prisma.user.create({
          data: {
            email: "other-get@test.com",
            password: "pass",
            nombre: "Other Get",
            rol: Rol.CLIENTE,
          },
        });
        await solicitudService.getSolicitud(sol.id, otherUser.id, Rol.CLIENTE);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(BusinessError);
        expect((err as BusinessError).code).toBe("NO_AUTORIZADO");
      }

      await prisma.user.delete({ where: { id: clienteUser.id } });
    });
  });

  describe("CatalogService", () => {
    it("should crearProducto", async () => {
      const producto = await catalogoService.crearProducto(testData.negocio.id, {
        nombre: "Producto Test",
        descripcion: "Test",
        precio: 99.99,
        unidadMedida: "unidad",
        imagenUrl: "https://example.com/test.jpg",
        subareaId: testData.subarea.id,
      }, testData.user.id, Rol.NEGOCIO);

      expect(producto.nombre).toBe("Producto Test");
      expect(producto.precio).toBe(99.99);

      await prisma.producto.delete({ where: { id: producto.id } });
    });

    it("should actualizarProducto", async () => {
      const producto = await prisma.producto.create({
        data: {
          negocioId: testData.negocio.id,
          subareaId: testData.subarea.id,
          nombre: "Producto Update",
          precio: 50,
          unidadMedida: "unidad",
          imagenUrl: "https://example.com/u.jpg",
        },
      });

      const updated = await catalogoService.actualizarProducto(producto.id, {
        nombre: "Producto Actualizado",
        precio: 75,
        activo: false,
      }, testData.user.id, Rol.NEGOCIO);

      expect(updated.nombre).toBe("Producto Actualizado");
      expect(updated.precio).toBe(75);

      await prisma.producto.delete({ where: { id: producto.id } });
    });

    it("should eliminarProducto", async () => {
      const producto = await prisma.producto.create({
        data: {
          negocioId: testData.negocio.id,
          subareaId: testData.subarea.id,
          nombre: "Producto Delete",
          precio: 50,
          unidadMedida: "unidad",
          imagenUrl: "https://example.com/d.jpg",
        },
      });

      await catalogoService.eliminarProducto(producto.id, testData.user.id, Rol.NEGOCIO);

      const found = await prisma.producto.findUnique({ where: { id: producto.id } });
      expect(found).toBeNull();
    });

    it("should listarInventarioDeNegocio", async () => {
      const inv = await catalogoService.listarInventarioDeNegocio(testData.negocio.id, testData.user.id, Rol.NEGOCIO);
      expect(Array.isArray(inv)).toBe(true);
      expect(inv.length).toBeGreaterThanOrEqual(1);
    });

    it("should actualizarInventario", async () => {
      const updated = await catalogoService.actualizarInventario(testData.producto.id, {
        cantidadActual: 50,
        puntoReorden: 5,
        ubicacion: "Almacén B",
      }, testData.user.id, Rol.NEGOCIO);

      expect(updated.cantidadActual).toBe(50);
      expect(updated.puntoReorden).toBe(5);
    });
  });

  describe("assertPertenencia", () => {
    it("should pass for propietario", async () => {
      await expect(
        assertPertenencia(testData.user.id, testData.negocio.id, Rol.NEGOCIO)
      ).resolves.not.toThrow();
    });

    it("should pass for ADMIN", async () => {
      const admin = await prisma.user.create({
        data: {
          email: "admin-perm@test.com",
          password: "pass",
          nombre: "Admin Perm",
          rol: Rol.ADMIN,
        },
      });

      await expect(
        assertPertenencia(admin.id, testData.negocio.id, Rol.ADMIN)
      ).resolves.not.toThrow();

      await prisma.user.delete({ where: { id: admin.id } });
    });

    it("should throw for foreign user", async () => {
      const foreign = await prisma.user.create({
        data: {
          email: "foreign@test.com",
          password: "pass",
          nombre: "Foreign",
          rol: Rol.CLIENTE,
        },
      });

      try {
        await assertPertenencia(foreign.id, testData.negocio.id, Rol.CLIENTE);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(BusinessError);
      }

      await prisma.user.delete({ where: { id: foreign.id } });
    });
  });
});
