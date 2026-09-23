import { PrismaClient } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const GENERIC_ADMIN_EMAIL = process.env.GENERIC_ADMIN_EMAIL || "admin@mi-pyme.local";
const GENERIC_ADMIN_PASSWORD = process.env.GENERIC_ADMIN_PASSWORD || "12345678";
const GENERIC_ADMIN_NAME = "Administrador Genérico";

const CODIGO_LONGITUD = 6;
const CODIGO_DIAS_EXPIRACION = 7;
const MONEDA_DEFECTO = "CUP";

async function generarCodigoEntrega() {
  const codigoPlano = crypto
    .getRandomValues(new Uint32Array(1))[0]
    .toString()
    .slice(-CODIGO_LONGITUD)
    .padStart(CODIGO_LONGITUD, "0");
  const codigoHash = await bcrypt.hash(codigoPlano, 12);
  return { codigoPlano, codigoHash };
}

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

  const negocios = await prisma.negocio.findMany({
    where: { activo: true, estado: "PENDIENTE_APROBACION" },
  });

  if (negocios.length > 0) {
    console.log(`Activating ${negocios.length} negocio(s) from PENDIENTE_APROBACION → ACTIVO`);
    await prisma.negocio.updateMany({
      where: { estado: "PENDIENTE_APROBACION" },
      data: { estado: "ACTIVO", aprobadoEn: new Date() },
    });
  }

  // Establecer datos fiscales por defecto en negocios activos sin nit
  const negociosSinFiscal = await prisma.negocio.findMany({
    where: {
      activo: true,
      estado: "ACTIVO",
      OR: [
        { nit: null },
        { nit: "" },
      ],
    },
    select: { id: true, nombre: true },
  });

  if (negociosSinFiscal.length > 0) {
    console.log(`Setting fiscal defaults for ${negociosSinFiscal.length} negocio(s)`);
    for (const negocio of negociosSinFiscal) {
      await prisma.negocio.update({
        where: { id: negocio.id },
        data: {
          regimenFiscal: "GENERAL",
          tasaIVA: 10,
          modoPrecio: "IVA_INCLUIDO",
          nit: "123456789",
          prefijoFactura: "PR",
          numeroFacturaConsecutivo: 1,
        },
      });
    }
  }

  // Variedad de tratamientos IVA en productos existentes (10% IVA cubano)
  const productosSinTratamiento = await prisma.producto.findMany({
    where: { tratamientoIVA: { notIn: ["GRAVADO", "EXENTO", "NO_SUJETO"] } },
    select: { id: true },
    take: 10,
  });

  if (productosSinTratamiento.length > 0) {
    const updates = productosSinTratamiento.map((p, i) => ({
      id: p.id,
      tratamiento: i % 3 === 0 ? "GRAVADO" : i % 3 === 1 ? "EXENTO" : "NO_SUJETO",
    }));

    for (const u of updates) {
      await prisma.producto.update({
        where: { id: u.id },
        data: { tratamientoIVA: u.tratamiento as any },
      });
    }
    console.log(`Assigned varied tratamientoIVA to ${productosSinTratamiento.length} product(s)`);
  }

  // Horarios por defecto (L-V 8-18, S 8-13, D cerrado) para negocios sin horarios
  const negociosSinHorarios = await prisma.negocio.findMany({
    where: { estado: "ACTIVO", horarios: { none: {} } },
  });

  for (const negocio of negociosSinHorarios) {
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

  if (negociosSinHorarios.length > 0) {
    console.log(`Added default horarios for ${negociosSinHorarios.length} negocio(s)`);
  }

  // Solicitudes de prueba en PENDIENTE_APROBACION
  const admin = await prisma.user.findFirst({ where: { rol: "ADMIN" } });
  if (admin) {
    const existingSolicitudes = await prisma.solicitudAltaNegocio.count();
    if (existingSolicitudes === 0) {
      const area = await prisma.area.findFirst();
      if (area) {
        const cliente = await prisma.user.findFirst({ where: { rol: "CLIENTE" } });
        if (cliente) {
          await prisma.solicitudAltaNegocio.createMany({
            data: [
              {
                userId: cliente.id,
                nombreNegocio: "Café del Barrio",
                descripcion: "Cafetería y pastelería artesanal",
                areaId: area.id,
                provincia: "Buenos Aires",
                municipio: "La Plata",
                telefono: "221-1234567",
                emailContacto: cliente.email,
                direccion: "Calle 123, La Plata",
              },
            ],
          });
          console.log("Created test solicitud de alta en PENDIENTE_APROBACION");
        }
      }
    }
  }

  // Pago de prueba para pedidos existentes (Fase 1 — Punto 5)
  const pedidosSinPago = await prisma.pedido.findMany({
    where: { pago: { is: null } },
    select: { id: true, total: true, estado: true, fechaCreacion: true },
  });

  // Detectar pagos existentes con referencia que parezca un ID de operación
  const pagosConReferenciaSospechosa = await prisma.pago.findMany({
    where: {
      referencia: { not: null },
      idTransferencia: null,
      metodo: { in: ["TRANSFERENCIA_BANCARIA", "PAGO_MOVIL"] },
    },
  });
  if (pagosConReferenciaSospechosa.length > 0) {
    console.log("ATENCIÓN: Pagos con referencia que podría ser un ID de operación (revisar manualmente):");
    for (const p of pagosConReferenciaSospechosa) {
      console.log(`  - Pago ${p.id}: referencia="${p.referencia}" (asignar idTransferencia manualmente)`);
    }
  }

  let pagosCreados = 0;
  let contadorTransferencia = 1;
  for (const pedido of pedidosSinPago) {
    const index = pagosCreados;
    const datosPago: any = {
      pedidoId: pedido.id,
      monto: pedido.total,
      moneda: "CUP",
    };

    if (index === 0) {
      datosPago.metodo = "TRANSFERENCIA_BANCARIA";
      datosPago.estado = pedido.estado === "completado" ? "COMPLETADO" : "EN_PROCESO";
      datosPago.idTransferencia = `TM-2026-${String(contadorTransferencia).padStart(6, "0")}`;
      datosPago.entidadPago = "Transfermovil";
      datosPago.fechaTransferencia = new Date(pedido.fechaCreacion.getTime() + 60000);
      datosPago.notasNegocio = "Pago asociado por seed";
      contadorTransferencia++;
    } else if (index === 1) {
      datosPago.metodo = "PAGO_MOVIL";
      datosPago.estado = pedido.estado === "completado" ? "COMPLETADO" : "EN_PROCESO";
      datosPago.idTransferencia = `EZ-2026-${String(contadorTransferencia).padStart(6, "0")}`;
      datosPago.entidadPago = "EnZona";
      datosPago.fechaTransferencia = new Date(pedido.fechaCreacion.getTime() + 60000);
      datosPago.notasNegocio = "Pago asociado por seed";
      contadorTransferencia++;
    } else if (index === 2 && pedido.estado === "completado") {
      datosPago.metodo = "PAGO_MOVIL";
      datosPago.estado = "REEMBOLSADO";
      datosPago.idTransferencia = `BPA-2026-${String(contadorTransferencia).padStart(6, "0")}`;
      datosPago.entidadPago = "BPA";
      datosPago.fechaTransferencia = new Date(pedido.fechaCreacion.getTime() + 60000);
      datosPago.idTransferenciaReembolso = `BPA-REF-2026-${String(contadorTransferencia).padStart(6, "0")}`;
      datosPago.fechaReembolso = new Date();
      datosPago.notasNegocio = "Pago asociado por seed (reembolsado)";
      contadorTransferencia++;
    } else {
      datosPago.metodo = "EFECTIVO_CONTRA_ENTREGA";
      datosPago.estado = pedido.estado === "completado" ? "COMPLETADO" : "PENDIENTE";
      datosPago.notasNegocio = "Pago asociado por seed";

      // Generar código de entrega para EFECTIVO_CONTRA_ENTREGA
    if (datosPago.metodo === "EFECTIVO_CONTRA_ENTREGA" && datosPago.estado === "PENDIENTE") {
      const { codigoPlano, codigoHash } = await generarCodigoEntrega();
      const ahora = new Date();
      const expiraEn = new Date(ahora.getTime() + CODIGO_DIAS_EXPIRACION * 24 * 60 * 60 * 1000);
      datosPago.codigoEntregaHash = codigoHash;
      datosPago.codigoEntregaExpira = expiraEn;
      datosPago.codigoEntregaRegeneraciones = 0;
      datosPago.codigoEntregaIntentos = 0;
      datosPago.codigoEntregaBloqueado = false;
      console.log(`  → Código generado para pedido ${pedido.id}: ${codigoPlano}`);
    }
    }

    await prisma.pago.create({ data: datosPago });
    pagosCreados++;
  }
  if (pagosCreados > 0) {
    console.log(`Created ${pagosCreados} pagos de ejemplo para pedidos existentes`);
  }

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