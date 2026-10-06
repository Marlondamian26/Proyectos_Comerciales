# UX Patterns — Mi-Pyme v2.0

> Patrones de marketplace para catálogo, checkout, seller profile y onboarding.

---

## 1. Listing Cards (Product Card)

```
┌─────────────────────────────┐
│  ┌───────────────────────┐  │
│  │      IMAGEN 1:1       │  │  ← next/image, blur placeholder
│  │                       │  │
│  │  [PROMO -20%]  [❤️]   │  │  ← badges overlay
│  └───────────────────────┘  │
│                             │
│  Título del producto        │  ← text-base, font-medium, 2 líneas max
│  Nombre del negocio         │  ← text-sm, text-secondary
│                             │
│  ★★★★☆ (12)   📍 Pinar     │  ← rating + ubicación
│                             │
│  $110.00  ~~$137.50~~       │  ← precio destacado (text-lg, bold)
│                             │
│  [🟢 Disponible hoy]        │  ← DisponibilidadBadge
│                             │
│  [ Agregar al carrito ]     │  ← CTA full-width
└─────────────────────────────┘
```

**Hover:** elevación (`shadow-medium`), zoom sutil en imagen (`scale-105`), transición 200ms.
**Touch:** `active:scale-[0.99]` para feedback táctil.

### ServiceCard
- Duración (`⏱ 45 min`)
- Capacidad (`👥 4 personas`)
- Badge de tipo (`SERVICIO_GENERAL`, `TRANSPORTE`)

### ComboCard
- Badge "Combo" + "Multi-negocio" si cruza negocios
- Lista de items incluidos (colapsable, máx. 3 visibles)
- Ahorro mostrado ("Ahorras $27.50")

### TransporteCard
- Origen → Destino con icono (`📦 Pinar del Río → Viñales`)
- Tipo de transporte
- Peso máximo

---

## 2. Búsqueda Facetada

### Desktop (sidebar derecho o izquierdo)
```
┌─────────────┬──────────────────────────────────────┐
│  FILTROS    │  [🔍 Buscar...]     [Ordenar ▼]     │
│  (sidebar)  │                                      │
│  Categoría  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  ○ Aseo     │  │Card │ │Card │ │Card │ │Card │   │
│  Precio     │  └─────┘ └─────┘ └─────┘ └─────┘   │
│  [$0]—[$500]│                                      │
│  Ubicación  │  [Mostrando 1–20 de 156]             │
│  Rating     │  [1] [2] [3] ... [8] [→]             │
│  [Limpiar]  │                                      │
└─────────────┴──────────────────────────────────────┘
```

### Mobile
Sidebar → **BottomSheet** (swipe up).

### Filtros disponibles
- Categoría (área/subárea) — checkbox con contador
- Rango de precio — slider dual + inputs
- Ubicación — provincia/municipio
- Disponibilidad — "Hoy", "Esta semana"
- Rating mínimo — estrellas
- Negocio — multi-select
- Con promoción / Con descuento

### Chips de filtros activos
- Cada filtro activo aparece como chip con "X" para quitar
- Botón "Limpiar filtros"

---

## 3. Seller Profile (`/negocio/[id]`)

```
┌─────────────────────────────────────────────────────────┐
│  [IMAGEN DE PORTADA]                                    │
│                                                         │
│  ┌────┐  Nombre del Negocio  [✓ Verificado]             │
│  │LOGO│  ★★★★☆ (45 reseñas) · 120 transacciones        │
│  └────┘  📍 Pinar del Río, Pinar del Río               │
│          🕐 Responde en ~2h                             │
│          📅 En Mi-Pyme desde 2024                       │
│                                                         │
│  [Seguir]  [Contactar]                                  │
├─────────────────────────────────────────────────────────┤
│  [Productos] [Servicios] [Combos] [Reseñas] [Info]     │
├─────────────────────────────────────────────────────────┤
│  Grid de productos/servicios del negocio                │
└─────────────────────────────────────────────────────────┘
```

**Trust signals:**
- Badge verificado
- Rating con count
- Número de transacciones
- Tiempo de respuesta
- Año de registro

---

## 4. Checkout Optimizado

```
┌──────────────────────────────────┬─────────────────────┐
│  [1 Carrito] → [2 Entrega] → [3 Pago] → [4 Confirmar] │
│                                  │  RESUMEN (sticky)   │
│  Paso 2: Entrega                 │                     │
│                                  │  Subtotal:  $250.00 │
│  ┌────────────────────────────┐  │  Descuento: -$25.00 │
│  │ Negocio A                  │  │  IVA (10%): $22.50  │
│  │ ○ Domicilio  ○ Recogida    │  │  Envío:      $5.99  │
│  │ [Opciones de envío ▼]      │  │  ─────────────────  │
│  │                            │  │  TOTAL:     $253.49 │
│  └────────────────────────────┘  │                     │
│                                  │  [Confirmar pedido] │
│  [← Volver]    [Continuar →]    │  🔒 Pago seguro     │
└──────────────────────────────────┴─────────────────────┘
```

- **ProgressSteps** en la parte superior
- **Resumen sticky** en desktop
- **Costo total visible** antes de confirmar
- **Trust signals:** "Pago seguro", "Devolución garantizada"
- **Sin dark patterns:** no "casi agotado", no popups, no countdowns falsos

---

## 5. Onboarding de Seller

```
┌─────────────────────────────────────────────────────────┐
│  ¡Bienvenido a Mi-Pyme!                                │
│  Completa estos pasos para empezar a vender             │
│                                                         │
│  ●━━━━●━━━━○━━━━○━━━━○                                 │
│  Perfil  Productos  Horarios  Logística  Listo          │
│  (✓)     (✓)       (2)       (3)        (4)            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [✓] 1. Completa tu perfil                      │   │
│  │  [✓] 2. Agrega tu primer producto               │   │
│  │  [ ] 3. Define tus horarios                     │   │
│  │  [ ] 4. Configura opciones de envío             │   │
│  │  [ ] 5. ¡Listo para vender!                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Continuar con el paso 3 →]                            │
└─────────────────────────────────────────────────────────┘
```

- **ProgressSteps** visual
- **Checklist de activación** con checkmarks
- **Tooltips contextuales** (máx. 1 por paso)
- **Empty states** con CTA: "Aún no tienes productos. Crea el primero."
- **Celebración** al completar cada paso (confetti sutil, toast)

---

## 6. Mobile First

### Tab bar inferior (CLIENTE)
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    CONTENIDO                            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  🏠        📋        🛒        📦        👤            │
│  Inicio   Catálogo  Carrito   Pedidos   Perfil         │
│           (badge)   (3)       (1)                      │
└─────────────────────────────────────────────────────────┘
```

- **5 tabs:** Inicio, Catálogo, Carrito, Pedidos, Perfil
- **Badge** en Carrito (items) y Pedidos (novedades)
- **Active state:** color primario + indicador
- **Touch targets** ≥ 44×44px

### Bottom sheets
Reemplazar modales por bottom sheets en mobile para:
- Filtros
- Detalle de producto
- Confirmaciones
- Selector de ubicación
- Carrito rápido

**Características:**
- Swipe-to-dismiss
- Drag handle visual
- Backdrop scrim
- `aria-modal="true"`

### Responsive breakpoints
| Breakpoint | Width | Grid |
|---|---|---|
| Mobile (320px) | 1 columna | 1 col |
| Tablet (768px) | 2 columnas | 2 cols |
| Desktop (1024px) | 3–4 columnas | 3–4 cols |

---

## 7. Micro-interacciones

### Skeletons (reemplazar spinners)
- `ProductCardSkeleton`: imagen + título + precio
- `TableSkeleton`: filas con shimmer
- `DashboardSkeleton`: cards de KPIs
- **Shimmer:** animación sutil, no spinner

### Empty States
- **Ilustración SVG** contextual (no icono genérico)
- **Título:** corto, claro
- **Descripción:** 1-2 líneas
- **CTA:** botón primario prominente
- **Máximo 3 elementos:** ilustración + texto + botón

### Transiciones
| Elemento | Animación |
|---|---|
| Modales | fade + scale (200ms, ease-out) |
| Dropdowns | fade + slide (150ms) |
| Toasts | slide-in desde arriba (200ms) |
| Cards hover | elevación (100ms) |
| Active | scale-[0.98] (100ms) |
| `prefers-reduced-motion` | deshabilitar todas |

### Feedback táctil
- Botones: `active:scale-[0.98]`
- Cards: `active:scale-[0.99]`
- Inputs: focus ring con transición
- Pull-to-refresh en listas (mobile)

---

## 8. Tips Tipográficos

- Jerarquía: `h1` (2.25rem), `h2` (1.5rem), `h3` (1.25rem), body (1rem), caption (0.875rem), fine (0.75rem)
- Máximo 2 pesos por pantalla
- Line-height: 1.2 para títulos, 1.5 para body
- Letter-spacing: -0.02em en títulos grandes
- Body text ≥ 16px

---

## 9. Accesibilidad (WCAG 2.1 AA)

### Contraste
- Texto normal: 4.5:1
- Texto grande: 3:1
- Verificar en light **y** dark

### Keyboard
- Todo interactivo accesible por teclado
- Focus visible (`ring-2 ring-ring ring-offset-2`)
- Tab order lógico
- `Escape` cierra modales/dropdowns

### Screen reader
- Labels en todos los inputs
- `aria-label` en icon-only buttons
- `aria-live` en notificaciones y contadores
- `role` correctos
- Skip link al contenido principal

### Formularios
- `aria-describedby` para errores
- `aria-invalid` cuando hay error
- `autocomplete` correcto