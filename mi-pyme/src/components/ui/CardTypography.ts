/**
 * Sistema unificado de tipografía para cards informativas.
 * Fuente única de verdad para que todas las cards se vean consistentes
 * en mobile y desktop.
 */

export const CARD_TYPOGRAPHY = {
  // Título principal (nombre del producto/negocio/servicio/combo)
  title: "text-sm sm:text-base font-semibold line-clamp-2 leading-tight",
  // Subtítulo (nombre del negocio, municipio, descripción corta)
  subtitle: "text-xs sm:text-sm text-muted-foreground line-clamp-1",
  // Precio o dato destacado
  price: "text-sm sm:text-lg font-bold text-primary",
  // Texto secundario (duración, capacidad, rating, etc.)
  meta: "text-xs sm:text-sm text-muted-foreground",
  // Badge
  badge: "text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded",
  // Padding interno de la card (contenido)
  padding: "p-3 sm:p-4",
  // Gap interno entre elementos
  gap: "gap-1.5 sm:gap-2",
  // Aspect ratio de imagen de producto/servicio (2 columnas mobile)
  imageAspect: "aspect-square",
  // Aspect ratio de cover de negocio (1 columna mobile)
  coverAspect: "aspect-video sm:aspect-square",
} as const;

export type CardTypographyKey = keyof typeof CARD_TYPOGRAPHY;
