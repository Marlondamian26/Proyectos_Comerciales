#!/usr/bin/env node
/**
 * Script de verificación de imágenes del seed de Mi-Pyme.
 * Comprueba que todas las imagenUrl de Producto, Servicio y Negocio
 * sean URLs válidas y devuelvan HTTP 200.
 *
 * Uso:
 *   DATABASE_URL="postgresql://..." node scripts/verify-seed-images.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verificarImagen(url: string): Promise<{ status: number; ok: boolean }> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return { status: res.status, ok: res.ok };
  } catch (error) {
    return { status: 0, ok: false };
  }
}

async function main() {
  const [productos, servicios, negocios] = await Promise.all([
    prisma.producto.findMany({ select: { id: true, nombre: true, imagenUrl: true } }),
    prisma.servicio.findMany({ select: { id: true, nombre: true, imagenUrl: true } }),
    prisma.negocio.findMany({ select: { id: true, nombre: true, imagenUrl: true } }),
  ]);

  const todas = [
    ...productos.map((p) => ({ tipo: "Producto", ...p })),
    ...servicios.map((s) => ({ tipo: "Servicio", ...s })),
    ...negocios.map((n) => ({ tipo: "Negocio", ...n })),
  ];

  const resultados = [];
  for (const item of todas) {
    if (!item.imagenUrl) {
      resultados.push({ ...item, status: "SIN_IMAGEN", ok: false });
      continue;
    }
    const check = await verificarImagen(item.imagenUrl);
    resultados.push({ ...item, ...check });
  }

  const fallidas = resultados.filter((r) => !r.ok);
  const ok = resultados.length - fallidas.length;

  console.log(`\n Imágenes verificadas: ${resultados.length}`);
  console.log(`   OK: ${ok}`);
  console.log(`   Fallidas: ${fallidas.length}\n`);

  if (fallidas.length > 0) {
    console.table(
      fallidas.map((r) => ({
        Tipo: r.tipo,
        ID: r.id,
        Nombre: r.nombre,
        URL: r.imagenUrl,
        Status: r.status,
      }))
    );
  }

  await prisma.$disconnect();
  process.exit(fallidas.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Error en verificación de imágenes:", err);
  process.exit(2);
});
