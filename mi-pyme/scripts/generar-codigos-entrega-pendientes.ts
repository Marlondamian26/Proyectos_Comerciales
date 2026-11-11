/**
 * Script: generar-codigos-entrega-pendientes.ts
 *
 * Genera códigos de entrega retroactivos para pagos EFECTIVO_CONTRA_ENTREGA
 * que no tengan código (creados antes de la funcionalidad).
 *
 * Ejecutar: npx tsx scripts/generar-codigos-entrega-pendientes.ts
 */
import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CODIGO_LONGITUD = 6;
const CODIGO_DIAS_EXPIRACION = 7;

function generarCodigoPlano(): string {
  return crypto
    .getRandomValues(new Uint32Array(1))[0]
    .toString()
    .slice(-CODIGO_LONGITUD)
    .padStart(CODIGO_LONGITUD, "0");
}

async function main() {
  console.log("Iniciando generación retroactiva de códigos de entrega...");

  const pagosSinCodigo = await prisma.pago.findMany({
    where: {
      metodo: "EFECTIVO_CONTRA_ENTREGA",
      codigoEntregaHash: null,
      estado: "PENDIENTE",
    },
    select: { id: true, pedidoId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  if (pagosSinCodigo.length === 0) {
    console.log("No hay pagos EFECTIVO_CONTRA_ENTREGA pendientes sin código de entrega.");
    return;
  }

  console.log(`Encontrados ${pagosSinCodigo.length} pago(s) sin código de entrega.`);

  let generados = 0;
  for (const pago of pagosSinCodigo) {
    const codigoPlano = generarCodigoPlano();
    const codigoHash = await bcrypt.hash(codigoPlano, 12);

    const ahora = new Date();
    const expiraEn = new Date(ahora.getTime() + CODIGO_DIAS_EXPIRACION * 24 * 60 * 60 * 1000);

    await prisma.pago.update({
      where: { id: pago.id },
      data: {
        codigoEntregaHash: codigoHash,
        codigoEntregaExpira: expiraEn,
        codigoEntregaRegeneraciones: 0,
        codigoEntregaIntentos: 0,
        codigoEntregaBloqueado: false,
      },
    });

    generados++;
    console.log(`  → Pago ${pago.id} (pedido ${pago.pedidoId}): código generado`);
  }

  console.log(`Generación completada: ${generados} código(s) de entrega creados.`);
}

main()
  .catch((e) => {
    console.error("Error en generación de códigos de entrega:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
