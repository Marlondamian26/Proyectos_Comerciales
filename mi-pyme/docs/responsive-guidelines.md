# Directrices Responsive — Mi-Pyme

Fuente de verdad para que la UI se vea perfecta en Mobile (320–767px),
Tablet (768–1023px), Desktop (1024–1919px) y Large Desktop (1920px+).

## 1. Breakpoints estándar (Tailwind)

| Prefix | Ancho | Uso |
|--------|-------|-----|
| (base) | < 640px | Mobile primero |
| `sm:` | ≥ 640px | Tablet pequeño |
| `md:` | ≥ 768px | Tablet |
| `lg:` | ≥ 1024px | Desktop |
| `xl:` | ≥ 1280px | Desktop grande |
| `2xl:` | ≥ 1536px | Large desktop |

**Siempre mobile-first:** definir el estilo móvil primero, luego `sm:`/`md:`/`lg:`.

## 2. Configuración global obligatoria

### `src/app/globals.css`
- `html, body { overflow-x: hidden; max-width: 100vw; }`
- `* { min-width: 0; box-sizing: border-box; }` (evita overflow en flex items)
- `img, video, svg, canvas { max-width: 100%; height: auto; display: block; }`
- `p, h1..h6, span, li, td, th { overflow-wrap: break-word; }`
- `body { padding-bottom/env(safe-area-inset-bottom, 0); padding-left/right env(...) }` (notch iOS)
- `@media (prefers-reduced-motion: reduce)` desactiva animaciones/transiciones.

### `src/app/layout.tsx`
- `viewport: { width: "device-width", initialScale: 1, maximumScale: 5, userScalable: true }`
- **NUNCA** `maximumScale: 1` ni `userScalable: false` (viola WCAG 2.1 AA).

### `tailwind.config.ts`
- Breakpoints: `sm: 640`, `md: 768`, `lg: 1024`, `xl: 1280`, `2xl: 1536`.

### `next.config.ts`
- `images.remotePatterns` con Cloudinary, Unsplash, etc.
- `images.formats: ["image/webp"]`.

## 3. Convenciones de spacing responsive

| Elemento | Mobile | Tablet | Desktop |
|----------|--------|--------|---------|
| Padding horizontal contenedor | `px-4` (16px) | `sm:px-6` (24px) | `lg:px-8` (32px) |
| Padding vertical sección | `py-8` (32px) | `sm:py-12` | `lg:py-16` |
| Gap entre cards | `gap-3` (12px) | `sm:gap-4` | `lg:gap-6` |
| h1 | `text-2xl` (24px) | `sm:text-3xl` | `lg:text-4xl` |
| Body | `text-base` (16px) | `text-base` | `text-base` |
| Small / label | `text-sm` (14px) | `text-sm` | `text-sm` |

## 4. Patrones de componentes

### Navbar
- Logo: `flex-shrink-0`, nunca se comprime.
- Buscador y acciones: `hidden md:flex` (solo desktop).
- Hamburguesa: `md:hidden`, `h-11 w-11` (≥ 44×44px), `aria-label`.

### Sidebar (drawer en mobile)
- Desktop (`≥ 1024px`): `hidden lg:flex`, `w-64` / colapsado `w-20`.
- Mobile (`< 768px`): drawer oculto (`lg:hidden`), overlay que cierra al clic, `overflow-y-auto`, cierre con `Escape`.
- Botón colapsar/abrir y cerrar drawer: ≥ 44×44px.

### Cards
- Mobile: `w-full`, `rounded-none sm:rounded-xl`, `border-0 sm:border`, sin bordes laterales.
- Imagen: `next/image` con `fill` + `object-cover`, `sizes` correcto, `aspect-square sm:aspect-[4/3]`.
- Grid container: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6`.

### Tablas → cards en mobile
- Desktop: tabla con `overflow-x-auto`.
- Mobile: cards con campos clave, CTA `w-full`.

### Modales
- Mobile: full-screen (`fixed inset-0 w-full h-full`), contenido `overflow-y-auto`.
- Desktop: centrado (`sm:top-1/2 sm:left-1/2`), `sm:max-w-lg sm:max-h-[90vh]`.
- Header sticky con botón cerrar ≥ 44×44px.
- Cierre con `Escape` (por defecto en Dialog/Radix).

### Formularios
- Inputs `w-full`, `h-11` (≥ 44px), `text-base` en mobile (≥ 16px, evita zoom iOS).
- `autoComplete` correcto (`email`, `current-password`, `new-password`, `tel`).
- `inputMode` (`email`, `tel`, `numeric`, `url`).
- `autoCapitalize="none"`, `autoCorrect="off"` en emails/usernames.
- Botones: `w-full` mobile, `sm:w-auto` desktop.

### Botones
- `min-h-[44px] min-w-[44px]` (touch target).
- `text-base` mobile, `text-sm` desktop.
- `active:scale-[0.98]` feedback táctil.
- Icon-only: `aria-label` obligatorio.

### Imágenes
- Siempre `next/image` con `fill` o `width/height`.
- Siempre `sizes` correcto.
- Siempre `object-cover` (sin distorsión).
- `priority` solo above-the-fold.
- `alt` descriptivo.

### Paginación
- Mobile: solo Anterior/Siguiente + "X de Y".
- Desktop: números completos (`hidden sm:flex`).

### Toasts
- Mobile: `fixed top-4 left-4 right-4 w-full`.
- Desktop: `fixed top-4 right-4 sm:max-w-sm`.
- Botón cerrar ≥ 44×44px.

### Bottom tab bar (cliente, solo mobile)
- `sm:hidden`, 5 tabs máximo, `env(safe-area-inset-bottom)`.
- Contenido principal con `pb-[80px] sm:pb-0`.

## 5. Reglas de texto y contraste

- Body text ≥ 16px en mobile (`text-base`).
- Labels ≥ 14px (`text-sm`).
- Contraste WCAG 2.1 AA en light Y dark.
- Verificar con `npm run test:a11y`.

## 6. Prohibiciones

- Hardcodear anchos fijos: `w-[500px]`, `min-w-[200px]` sin fallback responsive.
- Grids sin responsive: `grid-cols-3` sin `sm:`/`md:`/`lg:`.
- `userScalable: false` o `maximumScale: 1`.
- `overflow-x: auto` sin contenedor que lo justifique (salvo tablas desktop).
- Valores de color/espaciado hardcodeados (usar tokens).

## 7. Cómo verificar overflow

Consola del navegador (iPhone 12 Pro 390×844):

```js
(() => {
  const vw = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;
  if (sw > vw) {
    console.table(
      Array.from(document.querySelectorAll("*"))
        .filter((el) => el.offsetWidth > vw)
        .map((el) => ({ tag: el.tagName, class: el.className, width: el.offsetWidth }))
    );
  }
  return sw > vw;
})();
```

Script ejecutable: `node scripts/audit-responsive.mjs` (requiere servidor en `:3000`).

Tests Playwright: `tests/responsive-all-views.e2e.mjs`.

## 8. Matriz de verificación

| Ruta | iPhone SE | iPhone 12 | Galaxy S20 | iPad Mini | Laptop | Desktop |
|------|-----------|-----------|------------|-----------|--------|---------|
| `/` | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| `/catalogo` | ... | ... | ... | ... | ... | ... |
| `/carrito` | ... | ... | ... | ... | ... | ... |
| `/checkout` | ... | ... | ... | ... | ... | ... |
| `/cliente` | ... | ... | ... | ... | ... | ... |
| `/negocio` | ... | ... | ... | ... | ... | ... |
| `/admin` | ... | ... | ... | ... | ... | ... |

Criterios: cero overflow, touch targets ≥ 44×44px, texto ≥ 14px, sin imágenes distorsionadas, modales full-screen mobile, tablas→cards mobile, sidebar→drawer mobile.
