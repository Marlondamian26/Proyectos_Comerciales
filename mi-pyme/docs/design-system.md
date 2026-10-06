# Design System — Mi-Pyme v2.0

> Guía de componentes del sistema de diseño. Todos los componentes usan tokens semánticos, son accesibles (WCAG 2.1 AA) y mobile-first.

## Arquitectura

```
src/styles/tokens.css      → Tokens semánticos mejorados
src/app/globals.css        → Tokens base (@theme inline) + animaciones + utilities
src/styles/theme.ts        → Referencia TypeScript
tailwind.config.ts         → Mapea CSS variables → utilidades Tailwind
src/components/ui/         → Componentes del design system
src/components/            → Componentes de dominio (Marketplace, Checkout, etc.)
```

---

## Componentes Principales

### Button

Botones interactivos con feedback táctil y estados accesibles.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `"primary" \| "secondary" \| "accent" \| "outline" \| "ghost" \| "destructive" \| "gradient" \| "gradientSecondary" \| "gradientAccent" \| "link"` | `"primary"` | Estilo visual |
| `size` | `"sm" \| "md" \| "lg" \| "xl" \| "icon"` | `"md"` | Tamaño del botón |
| `loading` | `boolean` | `false` | Muestra spinner + estado `aria-busy` |
| `icon` | `ReactNode` | — | Ícono opcional |
| `iconPosition` | `"left" \| "right"` | `"left"` | Posición del ícono |
| `asChild` | `boolean` | `false` | Renderiza como elemento hijo (Link) |

**Variantes:**
- `primary`: Fondo primary, texto inverso. Hover eleva sombra.
- `secondary`: Fondo secondary.
- `outline`: Borde + fondo transparente. Hover cambia a accent.
- `ghost`: Sin borde, hover sutil.
- `destructive`: Rojo para acciones destructivas.
- `gradient`: Gradiente primary.
- `link`: Texto con subrayado en hover.

**Estados:**
- `hover`: Elevación sutil + sombra.
- `active`: `scale-[0.98]` para feedback táctil.
- `focus-visible`: `ring-2 ring-ring ring-offset-2`.
- `loading`: Spinner giratorio + `aria-busy="true"` + `disabled`.
- `disabled`: `opacity-50` + `cursor-not-allowed`.

**Touch target:** mínimo 44×44px en mobile (`min-h-[44px] min-w-[44px]`).

**Ejemplo:**
```tsx
<Button variant="primary" size="lg" loading={isSaving} icon={<Save className="h-4 w-4" />}>
  Guardar cambios
</Button>
```

---

### Badge

Etiquetas semánticas con iconos opcionales.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `"default" \| "primary" \| "secondary" \| "success" \| "warning" \| "error" \| "info" \| "outline" \| "verified" \| "promo"` | `"default"` | Color y estilo |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Tamaño |
| `dot` | `boolean` | `false` | Punto decorativo a la izquierda |
| `icon` | `ReactNode` | — | Ícono opcional |

**TrustBadge (wrapper):**
```tsx
<TrustBadge type="verified" />
<TrustBadge type="top-seller" count={42} />
<TrustBadge type="fast-response" />
```

---

### Card

Contenedores con variantes de elevación e interactividad.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `"default" \| "elevated" \| "outlined" \| "ghost" \| "interactive"` | `"default"` | Estilo visual |
| `shadow` | `"sm" \| "md" \| "lg" \| "xl" \| "2xl"` | `"md"` | Sombra |
| `hoverLift` | `boolean` | `true` | Elevación en hover |
| `image` | `{ src, alt }` | — | Imagen opcional |
| `badge` | `{ text, variant }` | — | Badge superpuesto |
| `onClick` | `() => void` | — | Hace la card clickeable |
| `imageAspectRatio` | `"1:1" \| "4:3" \| "16:9" \| "3:4"` | `"4:3"` | Relación de aspecto |

**Ejemplo:**
```tsx
<Card
  title="Producto Destacado"
  badge={{ text: "Nuevo", variant: "success" }}
  image={{ src: "/img.jpg", alt: "Producto" }}
  onClick={() => console.log("clicked")}
/>
```

---

### Rating

Estrellas con contador de reseñas.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `rating` | `number` | — | Rating 0-5 |
| `reviewCount` | `number` | — | Contador de reseñas |
| `maxRating` | `number` | `5` | Máximo de estrellas |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Tamaño |
| `readOnly` | `boolean` | `true` | Solo lectura |
| `showCount` | `boolean` | `true` | Mostrar contador |

**Ejemplo:**
```tsx
<Rating rating={4.5} reviewCount={42} />
```

---

### PriceTag

Visualización de precios con descuento y tachado.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `price` | `number` | — | Precio actual |
| `originalPrice` | `number` | — | Precio original (tachado) |
| `currency` | `string` | `"USD"` | Moneda |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Tamaño |

**Ejemplo:**
```tsx
<PriceTag price={110} originalPrice={137.5} />
```

---

### ProgressSteps

Indicador de pasos para checkout y onboarding.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `steps` | `Step[]` | — | Array de pasos |
| `currentStep` | `number` | `0` | Paso actual |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Dirección |

```tsx
<ProgressSteps
  steps={[
    { id: "cart", label: "Carrito" },
    { id: "delivery", label: "Entrega" },
    { id: "payment", label: "Pago" },
    { id: "confirm", label: "Confirmar" },
  ]}
  currentStep={1}
/>
```

---

### BottomSheet

Sheet móvil con swipe-to-dismiss.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `isOpen` | `boolean` | — | Visibilidad |
| `onClose` | `() => void` | — | Handler de cierre |
| `title` | `string` | — | Título |
| `size` | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"md"` | Tamaño |
| `showDragHandle` | `boolean` | `true` | Mostrar handle de arrastre |

---

### Skeleton

Placeholders de carga con animación shimmer.

**Variantes:** `text`, `rect`, `circle`, `avatar`, `badge`, `product-card`, `table-row`

```tsx
<Skeleton variant="text" className="h-4 w-3/4" />
<ProductCardSkeleton />
<TableSkeleton rows={5} cols={4} />
<DashboardSkeleton />
```

---

### Table

Tabla responsiva con cards en mobile.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `data` | `T[]` | — | Datos |
| `columns` | `Column<T>[]` | — | Columnas |
| `isLoading` | `boolean` | `false` | Estado de carga |
| `mobileCard` | `boolean` | `true` | Cards en mobile |
| `onRowClick` | `(row: T) => void` | — | Click en fila |

---

### Modal

Modal con focus trap, bottom sheet en mobile.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `isOpen` | `boolean` | — | Visibilidad |
| `onClose` | `() => void` | — | Handler |
| `mobileAsSheet` | `boolean` | `false` | Bottom sheet en mobile |
| `closeOnEscape` | `boolean` | `true` | Cerrar con Escape |

---

### Toast

Notificación con barra de progreso.

**Variantes:** `success`, `error`, `warning`, `info`

---

### EmptyState

Estado vacío con ilustración e CTA.

**Presets:** `cart`, `reservations`, `products`, `services`, `orders`, `search`, `logistics`, `users`, `areas`, `settings`, `favorites`, `reviews`, `notifications`, `invoices`, `support`

---

### QuantitySelector

Selector de cantidad con +/- botones.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `quantity` | `number` | — | Valor actual |
| `min` / `max` | `number` | `1` / `99` | Rango |
| `onChange` | `(value: number) => void` | — | Handler |

---

### SearchInput

Input de búsqueda con debounce.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `onSearch` | `(value: string) => void` | — | Handler con debounce |
| `debounceMs` | `number` | `300` | Tiempo de debounce |
| `loading` | `boolean` | `false` | Estado de carga |

---

### Pagination

Paginación numérica con info de items.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `currentPage` | `number` | — | Página actual |
| `totalPages` | `number` | — | Total de páginas |
| `onPageChange` | `(page: number) => void` | — | Handler |

---

### DisponibilidadBadge

Badge de disponibilidad de producto/servicio.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `disponible` | `boolean` | — | Disponible |
| `cantidad` | `number` | — | Cantidad disponible |
| `variante` | `"producto" \| "servicio"` | `"producto"` | Tipo de negocio |

---

### EstadoPagoBadge

Badge de estado de pago.

**Estados:** `pendiente`, `procesando`, `completado`, `fallido`, `reembolsado`, `cancelado`

---

### SellerCard

Card de negocio con trust signals.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `id` | `string` | — | ID del negocio |
| `name` | `string` | — | Nombre |
| `rating` | `number` | — | Rating |
| `reviewCount` | `number` | — | Conteo de reseñas |
| `transactionCount` | `number` | — | Transacciones |
| `verified` | `boolean` | `false` | Verificado |
| `href` | `string` | — | Link al perfil |

---

### StatusTimeline

Timeline de estados (pedido, pago).

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `steps` | `TimelineStep[]` | — | Pasos del timeline |
| `orientation` | `"horizontal" \| "vertical"` | `"vertical"` | Dirección |

---

### ImageWithFallback

Imagen con fallback y blur placeholder.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `src` | `string \| null` | — | URL de imagen |
| `alt` | `string` | — | Texto alternativo |
| `aspectRatio` | `"1:1" \| "4:3" \| "16:9" \| "3:4"` | `"1:1"` | Ratio |
| `fallback` | `ReactNode` | — | Fallback si falla |

---

### FacetedFilter

Filtros facetados con checkboxes, rangos y chips activos.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `groups` | `FilterGroup[]` | — | Grupos de filtros |
| `onFilterChange` | `(groupId, value) => void` | — | Handler |
| `onClearAll` | `() => void` | — | Limpiar filtros |

---

### InlineEdit

Edición inline con guardado automático.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `string \| number` | — | Valor actual |
| `onSave` | `(value) => void` | — | Handler de guardado |
| `label` | `string` | — | Label accesible |
| `validate` | `(value) => string \| undefined` | — | Validador |

---

### Stepper

Stepper horizontal para formularios multi-paso.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `steps` | `StepperStep[]` | — | Pasos |
| `currentStep` | `number` | — | Paso actual |
| `onChange` | `(step) => void` | — | Handler |

---

### ProductGallery

Galería de imágenes con thumbnails y zoom.

**Props:**
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `images` | `{ src, alt }[]` | — | Imágenes |
| `showThumbnails` | `boolean` | `true` | Mostrar thumbnails |
| `enableZoom` | `boolean` | `false` | Zoom en hover |