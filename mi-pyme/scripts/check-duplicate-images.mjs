import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const negocios = await prisma.negocio.findMany({
    select: { id: true, nombre: true, imagenUrl: true },
  });

  const porImagen = {};
  for (const n of negocios) {
    if (!n.imagenUrl) continue;
    if (!porImagen[n.imagenUrl]) porImagen[n.imagenUrl] = [];
    porImagen[n.imagenUrl].push(n.nombre);
  }

  const duplicados = Object.entries(porImagen).filter(([url, nombres]) => nombres.length > 1);

  if (duplicados.length > 0) {
    console.log("❌ Imágenes duplicadas en Negocios:");
    duplicados.forEach(([url, nombres]) => {
      console.log(`   ${url}`);
      console.log(`   → ${nombres.join(", ")}`);
    });
    process.exit(1);
  }

  console.log("✅ Todas las imágenes son únicas");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
