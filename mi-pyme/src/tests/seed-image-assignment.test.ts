import { describe, expect, it } from "vitest";
import {
  getSeedProductImage,
  getSeedServiceImage,
} from "../../prisma/seed-images";

describe("Asignación de imágenes para datos de prueba", () => {
  it("asigna imágenes de catálogo por categoría a productos antiguos del seed", () => {
    const arroz = getSeedProductImage(
      "bodega-la-esquina",
      "Arroz",
      "seed-prod-bodega-la-esquina-0"
    );
    const vestido = getSeedProductImage(
      "boutique-maria",
      "Vestido",
      "seed-prod-boutique-maria-2"
    );

    expect(arroz).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(vestido).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(arroz).not.toContain("placehold.co");
    expect(vestido).not.toContain("placehold.co");
  });

  it("elige la misma imagen para un mismo registro en cada ejecución", () => {
    const args = [
      "farmacia-san-rafael",
      "Paracetamol",
      "seed-prod-farmacia-san-rafael-0",
    ] as const;

    expect(getSeedProductImage(...args)).toBe(getSeedProductImage(...args));
  });

  it("asigna una imagen de servicio real según tipo y negocio", () => {
    const repair = getSeedServiceImage(
      "taller-el-mecanico",
      "Cambio de aceite",
      "seed-serv-taller-el-mecanico-0"
    );
    const delivery = getSeedServiceImage(
      "muebleria-el-roble",
      "Envío de paquete",
      "seed-serv-transporte-envio-paquete"
    );

    expect(repair).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(delivery).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(repair).not.toContain("placehold.co");
    expect(delivery).not.toContain("placehold.co");
  });
});
