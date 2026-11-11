/**
 * Script de migración de datos para el Panel de Autogestión del Negocio (Fase 1 — Punto 3).
 *
 * - Asigna estado: ACTIVO a todos los negocios existentes.
 * - Crea HorarioNegocio por defecto (L-V 8-18, S 8-13, D cerrado).
 * - Loguea cuántos negocios se migraron.
 *
 * Ejecutar como parte del seed o manualmente:
 *   npx tsx scripts/migrar-negocios-estado.ts
 */
import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient();

const DIAS = [
  { diaSemana: 1, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 2, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 3, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 4, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 5, horaApertura: "08:00", horaCierre: "18:00", cerrado: false },
  { diaSemana: 6, horaApertura: "08:00", horaCierre: "13:00", cerrado: false },
  { diaSemana: 0, horaApertura: "00:00", horaCierre: "00:00", cerrado: true },
];

async function main() {
  const negocios = await prisma.negocio.findMany({
    where: { activo: true },
    select: { id: true, estado: true, _count: { select: { horarios: true } } },
  });

  let migrados = 0;
  let horariosCreados = 0;

  for (const negocio of negocios) {
    if (negocio.estado !== "ACTIVO") {
      await prisma.negocio.update({
        where: { id: negocio.id },
        data: { estado: "ACTIVO", aprobadoEn: new Date() },
      });
      migrados++;
    }

    if (negocio._count.horarios === 0) {
      await prisma.horarioNegocio.createMany({
        data: DIAS.map((d) => ({
          negocioId: negocio.id,
          diaSemana: d.diaSemana,
          horaApertura: d.horaApertura,
          horaCierre: d.horaCierre,
          cerrado: d.cerrado,
        })),
      });
      horariosCreados += 7;
    }
  }

  console.log(`Migración completada: ${migrados} negocio(s) → ACTIVO, ${horariosCreados} horarios creados`);
}

main()
  .catch((e) => {
    console.error("Error en migración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
