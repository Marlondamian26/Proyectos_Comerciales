import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verificarImagen(url: string | null | undefined) {
  if (!url) {
    return { url, status: "SIN_IMAGEN", ok: false };
  }
  try {
    const res = await fetch(url, { method: "HEAD" });
    return { url, status: res.status, ok: res.ok };
  } catch (error) {
    return { url, status: 0, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function main() {
  console.log("🔍 Verificando imágenes del seed...\n");

  const productos = await prisma.producto.findMany({ select: { id: true, nombre: true, imagenUrl: true } });
  const servicios = await prisma.servicio.findMany({ select: { id: true, nombre: true, imagenUrl: true } });
  const negocios = await prisma.negocio.findMany({ select: { id: true, nombre: true, imagenUrl: true } });
  const combos = await prisma.combo.findMany({ select: { id: true, nombre: true, imagen: true } });

  const todas = [
    ...productos.map(p => ({ tipo: "Producto", ...p, imagenUrl: p.imagenUrl })),
    ...servicios.map(s => ({ tipo: "Servicio", ...s, imagenUrl: s.imagenUrl })),
    ...negocios.map(n => ({ tipo: "Negocio", ...n, imagenUrl: n.imagenUrl })),
    ...combos.map(c => ({ tipo: "Combo", ...c, imagenUrl: c.imagen })),
  ];

  console.log(`Total de entidades: ${todas.length}\n`);

  const resultados = [];
  for (const item of todas) {
    if (!item.imagenUrl) {
      resultados.push({ ...item, status: "SIN_IMAGEN", ok: false });
      continue;
    }
    const check = await verificarImagen(item.imagenUrl);
    resultados.push({ tipo: item.tipo, nombre: item.nombre, url: item.imagenUrl, status: check.status, ok: check.ok });
  }

  const fallidas = resultados.filter(r => !r.ok);
  const exitosas = resultados.filter(r => r.ok);

  console.log(`✅ Imágenes OK: ${exitosas.length}`);
  console.log(`❌ Imágenes fallidas: ${fallidas.length}\n`);

  if (fallidas.length > 0) {
    console.table(fallidas);
    process.exit(1);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
