/**
 * Script de migración de datos para Checkout con Logística (Fase 1 — Punto 4).
 *
 * - Para cada Pedido sin negocioId, derivarlo del negocioId del primer PedidoItem.
 * - Si un pedido tiene items de varios negocios, dividirlo en varios pedidos
 *   (uno por negocio), moviendo los items correspondientes y creando un
 *   PedidoItem nuevo en el pedido dividido.
 * - Asignar tipoEntrega: DOMICILIO por defecto y costoEnvio: 0 si no hay datos.
 * - Loguea cuántos pedidos se dividieron.
 *
 * Ejecutar manualmente:
 *   npx tsx scripts/migrar-pedidos-negocio.ts
 */
import "dotenv/config";
import { PrismaClient, Prisma } from "@/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const pedidosSinNegocio = await prisma.pedido.findMany({
    where: { negocioId: "" as never },
    select: {
      id: true,
      usuarioId: true,
      items: {
        select: {
          id: true,
          negocioId: true,
        },
      },
    },
  });

  // También buscar pedidos con negocioId null (cuyel sea el caso)
  const pedidosNull = await prisma.pedido.findMany({
    where: { negocioId: null as never },
    select: {
      id: true,
      usuarioId: true,
      items: {
        select: {
          id: true,
          negocioId: true,
        },
      },
    },
  });

  const pedidosAProcesar = [...pedidosSinNegocio, ...pedidosNull];

  let divididos = 0;
  let asignados = 0;

  for (const pedido of pedidosAProcesar) {
    const negocioIds = Array.from(
      new Set(pedido.items.map((i) => i.negocioId))
    ).filter(Boolean);

    if (negocioIds.length === 0) {
      console.warn(`Pedido ${pedido.id}: no se pudo derivar negocioId. Saltando.`);
      continue;
    }

    if (negocioIds.length === 1) {
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: {
          negocioId: negocioIds[0]!,
          tipoEntrega: "DOMICILIO",
          costoEnvio: 0,
        },
      });
      asignados++;
    } else {
      // Dividir: crear un pedido por cada negocio adicional.
      const negocioPrincipal = negocioIds[0]!;
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: {
          negocioId: negocioPrincipal,
          tipoEntrega: "DOMICILIO",
          costoEnvio: 0,
        },
      });
      asignados++;

      for (let i = 1; i < negocioIds.length; i++) {
        const negocioId = negocioIds[i]!;
        const itemsDelNegocio = pedido.items.filter((it) => it.negocioId === negocioId);
        const nuevoPedido = await prisma.pedido.create({
          data: {
            usuarioId: pedido.usuarioId,
            negocioId: negocioId,
            total: 0,
            tipo: "producto",
            tipoEntrega: "DOMICILIO",
            costoEnvio: 0,
            negocioIds: JSON.stringify([negocioId]),
          },
        });

        for (const item of itemsDelNegocio) {
          await prisma.pedidoItem.update({
            where: { id: item.id },
            data: { pedidoId: nuevoPedido.id },
          });
        }

        // Mover items del negocio actual al nuevo pedido
        divididos++;
      }

      console.log(
        `Pedido ${pedido.id} dividido en ${negocioIds.length} pedidos (negocios: ${negocioIds.join(", ")})`
      );
    }
  }

  console.log(
    ` Migración completada: ${asignados} pedidos con negocioId asignado, ${divididos} pedidos divididos`
  );
}

main()
  .catch((e) => {
    console.error("Error en migración de pedidos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
