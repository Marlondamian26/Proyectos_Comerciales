/**
 * Constantes de geolocalización para Cuba.
 *
 * Estas constantes definen las 16 provincias y los municipios de Pinar del Río.
 * Se usan como valores String en las tablas `User`, `Negocio` y
 * `SolicitudAltaNegocio`, ya que el schema actual no tiene tablas de entidad
 * para provincias/municipios (decisión de Fase 1, migración a entidades en Fase 4).
 */

export const PROVINCIAS_CUBA = [
  "Pinar del Río",
  "Artemisa",
  "La Habana",
  "Mayabeque",
  "Matanzas",
  "Villa Clara",
  "Cienfuegos",
  "Sancti Spíritus",
  "Ciego de Ávila",
  "Camagüey",
  "Las Tunas",
  "Granma",
  "Holguín",
  "Santiago de Cuba",
  "Guantánamo",
  "Isla de la Juventud",
] as const;

export type ProvinciaCuba = (typeof PROVINCIAS_CUBA)[number];

export const MUNICIPIOS_PINAR_DEL_RIO = [
  "Pinar del Río",
  "Consolación del Sur",
  "Guane",
  "La Palma",
  "Los Palacios",
  "Mantua",
  "Minas de Matahambre",
  "San Juan y Martínez",
  "San Luis",
  "Sandino",
  "Viñales",
] as const;

export const MUNICIPIOS_LA_HABANA = [
  "La Habana",
  "Guanabacoa",
  "Centro Habana",
  "Habana Vieja",
  "Plaza de la Revolución",
  "La Lisa",
  "Playa",
  "Marianao",
  "San Miguel del Padrón",
  "Boyeros",
  "Arroyo Naranjo",
  "Alquízar",
] as const;

export const PROVINCIA_DEFECTO = "Pinar del Río";
export const MUNICIPIO_DEFECTO = "Pinar del Río";

export function esProvinciaValida(provincia: string): boolean {
  return PROVINCIAS_CUBA.some((p) => p === provincia);
}

export function esMunicipioValido(municipio: string): boolean {
  return (
    MUNICIPIOS_PINAR_DEL_RIO.some((m) => m === municipio) ||
    MUNICIPIOS_LA_HABANA.some((m) => m === municipio)
  );
}

export function normalizarUbicacion(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
