/**
 * Script de migración de datos para el Pago (Fase 1 — Punto 5).
 *
 * Para pedidos existentes sin pago asociado, crea un Pago con:
 * - método EFECTIVO_CONTRA_ENTREGA por defecto.
 * - estado COMPLETADO si el pedido está completado, PENDIENTE si no.
 * - monto = total del pedido.
 *
 * Ejecutar como paso manual documentado:
 *   npx tsx scripts/migrar-pagos.ts
 */
import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const pedidosSinPago = await prisma.pedido.findMany({
    where: { pago: { is: null } },
    select: { id: true, total: true, estado: true },
  });

  let creados = 0;
  for (const pedido of pedidosSinPago) {
    await prisma.pago.create({
      data: {
        pedidoId: pedido.id,
        metodo: "EFECTIVO_CONTRA_ENTREGA",
        estado: pedido.estado === "completado" ? "COMPLETADO" : "PENDIENTE",
        monto: pedido.total,
        moneda: "CUP",
        notasNegocio: "Pago creado por migración de datos (Fase 1 — Punto 5)",
      },
    });
    creados++;
  }

  // Mantener sincronizado el estadoPago denormalizado en Pedido
  await prisma.pedido.updateMany({
    where: {
      estadoPago: "PENDIENTE",
      estado: "completado",
      pago: { estado: { not: "COMPLETADO" } },
    },
    data: { estadoPago: "COMPLETADO" },
  });

  console.log(`Migración completada: ${creados} pago(s) creados para pedidos sin pago`);
}

main()
  .catch((e) => {
    console.error("Error en migración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
