/**
 * Script de migración para B1: Eliminar autoregistro como NEGOCIO.
 *
 * Recorre todos los User con rol === "NEGOCIO" y los clasifica:
 * - Mantiene rol NEGOCIO si tienen un Negocio asociado (Negocio.userId === user.id) con estado ACTIVO.
 * - Degrada a CLIENTE si no tienen Negocio asociado.
 * - Degrada a CLIENTE si tienen Negocio en PENDIENTE_APROBACION o RECHAZADO.
 *
 * Registra cada migración en AuditLog con evento ROL_MIGRADO_AUTOREGISTRO.
 * Loguea un resumen al final.
 *
 * Ejecutar manualmente tras mergear:
 *   npx tsx scripts/migrar-negocios-autoregistrados.ts
 */
import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const negocioUsers = await prisma.user.findMany({
    where: { rol: "NEGOCIO" },
    select: {
      id: true,
      email: true,
      username: true,
      nombre: true,
    },
  });

  const negocioUserIds = negocioUsers.map((u) => u.id);

  const negocios = await prisma.negocio.findMany({
    where: {
      userId: { in: negocioUserIds },
    },
    select: {
      userId: true,
      estado: true,
    },
  });

  const negociosPorUsuario: Map<string, string[]> = new Map();
  for (const negocio of negocios) {
    if (negocio.userId) {
      const estados = negociosPorUsuario.get(negocio.userId) ?? [];
      estados.push(negocio.estado);
      negociosPorUsuario.set(negocio.userId, estados);
    }
  }

  let mantenidos = 0;
  let degradadosSinNegocio = 0;
  let degradadosPendientes = 0;

  for (const user of negocioUsers) {
    const estados = negociosPorUsuario.get(user.id);

    if (!estados || estados.length === 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { rol: "CLIENTE" },
      });
      await prisma.auditLog.create({
        data: {
          eventType: "ROL_MIGRADO_AUTOREGISTRO",
          actorId: null,
          targetId: user.id,
          meta: {
            email: user.email,
            username: user.username,
            rolAnterior: "NEGOCIO",
            rolNuevo: "CLIENTE",
            razon: "Sin negocio asociado",
          },
        },
      });
      degradadosSinNegocio++;
      continue;
    }

    const tieneActivo = estados.includes("ACTIVO");
    const tienePendienteORechazado = estados.some(
      (e) => e === "PENDIENTE_APROBACION" || e === "RECHAZADO"
    );

    if (tieneActivo) {
      await prisma.auditLog.create({
        data: {
          eventType: "ROL_MIGRADO_AUTOREGISTRO",
          actorId: null,
          targetId: user.id,
          meta: {
            email: user.email,
            username: user.username,
            rolAnterior: "NEGOCIO",
            rolNuevo: "NEGOCIO",
            razon: "Mantenido: tiene negocio activo asociado",
          },
        },
      });
      mantenidos++;
    } else if (tienePendienteORechazado) {
      await prisma.user.update({
        where: { id: user.id },
        data: { rol: "CLIENTE" },
      });
      await prisma.auditLog.create({
        data: {
          eventType: "ROL_MIGRADO_AUTOREGISTRO",
          actorId: null,
          targetId: user.id,
          meta: {
            email: user.email,
            username: user.username,
            rolAnterior: "NEGOCIO",
            rolNuevo: "CLIENTE",
            razon: "Degradado: negocio en estado pendiente/rechazado",
            estadosNegocio: estados,
          },
        },
      });
      degradadosPendientes++;
    }
  }

  console.log(
    `Migración B1 completada: ${mantenidos} mantenidos como NEGOCIO, ` +
      `${degradadosSinNegocio} degradados a CLIENTE (sin negocio), ` +
      `${degradadosPendientes} degradados a CLIENTE (pendiente/rechazado).`
  );
}

main()
  .catch((e) => {
    console.error("Error en migración B1:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
