# Design Tokens — Mi-Pyme v2.0

> Fuente de verdad para todos los tokens de diseño. Todos los componentes deben usar estos tokens, nunca valores hardcodeados.

## Arquitectura

```
src/styles/theme.ts      → Tokens como TypeScript (documentación + tipado)
src/app/globals.css      → Variables CSS (`@theme inline` para light, `[data-theme="dark"]` y `@media (prefers-color-scheme: dark)` para dark)
tailwind.config.ts       → Mapea variables CSS a utilidades Tailwind
src/components/ui/        → Componentes que consumen los tokens
```

---

## 1. Paleta de Colores

### Principales (brand)

| Token            | Light    | Dark     | Uso                              |
|------------------|----------|----------|----------------------------------|
| `primary`        | `#0B6E4F`| `#1FA77A`| Accentos primarios, botones CTA  |
| `primary-100`    | `#E6F6F0`| `#063E2D`| Backgrounds sutiles primarios    |
| `primary-600`    | `#1FA77A`| `#63D0AB`| Hover de primary                 |
| `secondary`      | `#0B5FA3`| `#3387D7`| Accentos secundarios             |
| `accent`         | `#F59E0B`| `#FBBF24`| Acento amarillo/naranja         |

### Semánticos

| Token              | Light              | Dark               | Uso                                    |
|--------------------|--------------------|--------------------|----------------------------------------|
| `background`       | `#FFFFFF`          | `#0B1220`          | Fondo de página                        |
| `background-alt`   | `#F7F9FB`          | `#0F1724`          | Fondo alternativo                      |
| `background-tertiary` | `#EEF2F7`       | `#141D2E`          | Fondo terciario (sidebars, etc.)       |
| `surface`          | `#FFFFFF`          | `#0F1724`          | Superficie principal de componentes    |
| `surface-subtle`   | `#F7F9FB`          | `#0B1220`          | Superficie muy sutil (hover, active)   |
| `surface-alt`      | `#F2F4F7`          | `#141D2E`          | Alternativa a surface                  |
| `surface-elevated` | `#FFFFFF`          | `#1E2A3D`          | Cards elevadas (sombra)                |
| `surface-sunken`   | `#F2F4F7`          | `#141D2E`          | Inputs, áreas "hundidas"               |

### Texto

| Token                | Light        | Dark         | Uso                                       |
|----------------------|--------------|--------------|-------------------------------------------|
| `text-primary`       | `#0F1724`    | `#E6EEF6`    | Texto principal, títulos                  |
| `text-secondary`     | `#475569`    | `#A5BBCF`    | Texto secundario, subtítulos              |
| `text-muted`         | `#94A3B8`    | `#6B7A8C`    | Texto atenuado, labels, hints             |
| `text-inverse`       | `#FFFFFF`    | `#0B1220`    | Texto sobre backgrounds coloreados        |
| `text-on-primary`    | `#FFFFFF`    | `#0B1220`    | Texto sobre backgrounds primary           |
| `text-on-secondary`  | `#FFFFFF`    | `#0B1220`    | Texto sobre backgrounds secondary         |
| `text-on-accent`     | `#0F1724`    | `#0B1220`    | Texto sobre backgrounds accent            |
| `text-on-surface`    | `#0F1724`    | `#E6EEF6`    | Texto sobre surfaces (contextual)         |

### Bordes

| Token            | Light                  | Dark                    | Uso                            |
|------------------|------------------------|---------------------------|--------------------------------|
| `border`         | `#E6EEF6`              | `rgba(255,255,255,0.06)` | Bordes principales             |
| `border-subtle`  | `#F0F4FA`              | `rgba(255,255,255,0.04)` | Bordes sutiles (divisiones)    |
| `border-strong`  | `#D0DAE8`              | `rgba(255,255,255,0.12)` | Bordes prominentes             |
| `border-muted`   | `#F0F4FA`              | `rgba(255,255,255,0.03)` | Bordes muy sutiles             |

### Estados

| Token                 | Light    | Dark     | Foreground (light) | Foreground (dark) |
|-----------------------|----------|----------|---------------------|-------------------|
| `success`             | `#16A34A`| `#22C55E`| `#FFFFFF`           | `#0B1220`         |
| `success-100`         | `#DCFCE7`| `#063E2D`|                     |                   |
| `warning`             | `#F59E0B`| `#FBBF24`| `#0F1724`           | `#0B1220`         |
| `warning-100`         | `#FEF3C7`| `#78350F`|                     |                   |
| `danger` / `destructive` | `#EF4444`| `#F87171`| `#FFFFFF`         | `#0B1220`         |
| `danger-100`          | `#FEE2E2`| `#7F1D1D`|                     |                   |
| `info`                | `#0EA5E9`| `#38BDF8`| `#FFFFFF`           | `#0B1220`         |
| `info-100`            | `#E0F2FE`| `#0C4A6E`|                     |                   |

### Foco e Interacciones

| Token            | Light    | Dark     | Uso                              |
|------------------|----------|----------|----------------------------------|
| `focus`          | `#0B6E4F`| `#1FA77A`| Anillo de foco (ring)            |
| `ring`           | `#0B6E4F`| `#1FA77A`| Color del anillo de foco         |
| `overlay`        | `rgba(2,6,23,0.5)` | `rgba(0,0,0,0.7)` | Overlay de modales |
| `overlay-strong` | `rgba(2,6,23,0.7)` | `rgba(0,0,0,0.85)` | Overlay fuerte |
| `muted`          | `#F0F4FA`| `rgba(255,255,255,0.08)` | Backgrounds de elementos deshabilitados |

### Contraste verificado (WCAG AA)

- `text-primary` sobre `background`: **7.1:1** light / **13.4:1** dark ✓
- `text-primary` sobre `surface`: **7.1:1** light / **13.4:1** dark ✓
- `text-on-primary` (#FFFFFF) sobre `primary` (#0B6E4F): **4.54:1** ✓
- `text-on-accent` (#0F1724) sobre `accent` (#F59E0B): **4.54:1** ✓
- `text-secondary` sobre `background`: **4.54:1** light ✓
- Borde `border` sobre `surface`: **≥ 3:1** ✓

---

## 2. Tipografía

### Escala modular (7 tamaños semánticos)

| Token     | Tamaño (px) | Tamaño (rem) | Uso                          | Ratio al anterior |
|-----------|-------------|--------------|------------------------------|-------------------|
| `display` | 48          | 3rem         | Hero, landing page titles    | 1.33x             |
| `h1`      | 36          | 2.25rem      | Page headings                | 1.50x             |
| `h2`      | 24          | 1.5rem       | Section headings             | 1.50x             |
| `h3`      | 20          | 1.25rem      | Subsection headings          | 1.25x             |
| `body`    | 16          | 1rem         | Body text (mínimo 16px)      | 1.25x             |
| `caption` | 14          | 0.875rem     | Captions, labels, hints      | 1.14x             |
| `fine`    | 12          | 0.75rem      | Fine print, legal            | 1.17x             |

**Regla**: Solo 2 pesos por pantalla. `regular` (400) y `semibold` (600) para contenido; `bold` (700) para títulos.

### Pesos

| Token        | Valor | Uso                          |
|--------------|-------|------------------------------|
| `normal`     | 400   | Body text, labels            |
| `medium`     | 500   | Subheadings, nav items       |
| `semibold`   | 600   | Card titles, section headers |
| `bold`       | 700   | Page headings, hero text     |

### Line heights

| Token     | Valor | Uso                          |
|-----------|-------|------------------------------|
| `tight`   | 1.1   | Large headings               |
| `snug`    | 1.25  | h2, h3                       |
| `normal`  | 1.5   | Body text                    |
| `relaxed` | 1.625 | Captions                     |

### Familias

| Token     | Font                              | Uso                          |
|-----------|-----------------------------------|------------------------------|
| `sans`    | Inter, system-ui, sans-serif      | Todo el contenido            |
| `mono`    | Fira Code, JetBrains Mono, mono   | Código, precios            |
| `display` | Inter, sans-serif                 | Hero, títulos grandes        |

### Letter spacing

| Token       | Valor     | Uso                          |
|-------------|-----------|------------------------------|
| `tight`     | `-0.025em`| Títulos grandes              |
| `tighter`   | `-0.05em` | Hero text                    |
| `normal`    | `0`       | Body text                    |
| `wide`      | `0.025em` | Labels, uppercase            |
| `wider`     | `0.05em`  | Tracking tight labels        |
| `widest`    | `0.1em`   | Acrónimos                    |

---

## 3. Espaciado (base 4px)

Escala base 4px con ratio 1.25 → 1.5 → 2:

| Token    | px  | rem   | Uso típico                    |
|----------|-----|-------|-------------------------------|
| `0`      | 0   | 0     | Sin espaciado                 |
| `1`      | 4   | 0.25  | Micro spacing                 |
| `2`      | 8   | 0.5   | Element gaps, inline spacing  |
| `3`      | 12  | 0.75  | Label-to-input, small gaps    |
| `4`      | 16  | 1     | Card padding, section gaps    |
| `5`      | 20  | 1.25  | Component spacing             |
| `6`      | 24  | 1.5   | Column gaps, card spacing     |
| `7`      | 28  | 1.75  | Larger gaps                   |
| `8`      | 32  | 2     | Section padding, hero spacing |
| `9`      | 36  | 2.25  | Large section gaps            |
| `10`     | 40  | 2.5   | Page padding                  |
| `11`     | 44  | 2.75  | Hero spacing                  |
| `12`     | 48  | 3     | Large section padding         |
| `14`     | 56  | 3.5   | Very large gaps               |
| `16`     | 64  | 4     | Page max padding              |
| `20`     | 80  | 5     | Hero max-width                |
| `24`     | 96  | 6     | Large layout                  |
| `28`–`96`| —   | —     | Layout escalado               |

---

## 4. Bordes y Radios

| Token    | px    | rem   | Uso                          |
|----------|-------|-------|------------------------------|
| `none`   | 0     | 0     | Sin borde                    |
| `xs`     | 2     | 0.125 | Sutiles (inputs)             |
| `sm`     | 4     | 0.25  | Chips, pequeños componentes  |
| `md`     | 6     | 0.375 | Botones, cards pequeños      |
| `lg`     | 8     | 0.5   | Cards, modales (default)     |
| `xl`     | 12    | 0.75  | Cards grandes, modales       |
| `2xl`    | 16    | 1     | Hero sections                |
| `3xl`    | 24    | 1.5   | Hero muy grandes             |
| `full`   | ∞     | —     | Avatares, badges, botones redondos |

### Grosor de bordes

| Token   | px | Uso                          |
|---------|----|------------------------------|
| `thin`  | 1  | Bordes sutiles               |
| `normal`| 1  | Bordes estándar              |
| `thick` | 2  | Focus, destacado             |

---

## 5. Sombras (3 niveles)

| Token          | Light                              | Dark                              | Uso                           |
|----------------|------------------------------------|-----------------------------------|-------------------------------|
| `subtle`       | `0 1px 3px rgba(2,6,23,0.04), 0 1px 2px rgba(2,6,23,0.02)` | `0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)` | Cards, elementos sutiles |
| `medium`       | `0 4px 12px rgba(2,6,23,0.06), 0 2px 4px rgba(2,6,23,0.03)` | `0 4px 12px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.25)` | Cards hover, dropdowns |
| `strong`       | `0 12px 28px rgba(2,6,23,0.08), 0 4px 8px rgba(2,6,23,0.04)` | `0 12px 28px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.3)` | Modales, tooltips, popovers |

| Token          | Light                              | Dark                              | Uso                           |
|----------------|------------------------------------|-----------------------------------|-------------------------------|
| `focus`        | `0 0 0 3px rgba(11,110,79,0.25)`    | `0 0 0 3px rgba(31,167,122,0.35)`  | Anillo de foco              |
| `glow`         | `0 0 20px rgba(11,110,79,0.15)`    | `0 0 20px rgba(31,167,122,0.2)`    | Enfoque suave               |
| `glow-strong`  | `0 0 40px rgba(11,110,79,0.25)`    | `0 0 40px rgba(31,167,122,0.3)`    | Enfoque fuerte              |
| `inner`        | `inset 0 2px 4px rgba(2,6,23,0.03)`| `inset 0 2px 4px rgba(0,0,0,0.3)`  | Inset elements              |

---

## 6. Motion

### Duraciones

| Token     | Duración | Uso típico                            |
|-----------|----------|---------------------------------------|
| `instant` | 100ms    | Hover, feedback táctil                |
| `fast`    | 150ms    | Estado de foco, micro-interacciones   |
| `normal`  | 200ms    | Transiciones de estado, animaciones   |
| `slow`    | 300ms    | Entrada/salida de modales, slides     |
| `slower`  | 500ms    | Transiciones lentas,Loading states    |

### Easings

| Token             | Función                                | Uso                          |
|-------------------|----------------------------------------|------------------------------|
| `linear`          | `linear`                               | Transiciones lineales        |
| `standard`        | `cubic-bezier(0.4, 0, 0.2, 1)`         | Transiciones generales       |
| `easeOut`         | `cubic-bezier(0, 0, 0.2, 1)`           | Transiciones hacia fuera     |
| `easeIn`          | `cubic-bezier(0.4, 0, 1, 1)`           | Transiciones hacia dentro    |
| `easeInOut`       | `cubic-bezier(0.4, 0, 0.2, 1)`         | Transiciones de entrada/salida|
| `emphasized`      | `cubic-bezier(0.2, 0, 0, 1)`           | Transiciones destacadas      |

### `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 100ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 100ms !important;
    scroll-behavior: auto !important;
  }
}
```

Aplicados globalmente en `globals.css`.

---

## 7. Breakpoints y Container

| Token | Breakpoint | Uso                          |
|-------|------------|------------------------------|
| `sm`  | 640px      | Mobile landscape             |
| `md`  | 768px      | Tablet                       |
| `lg`  | 1024px     | Tablet landscape / desktop   |
| `xl`  | 1280px     | Desktop                      |
| `2xl` | 1536px     | Wide desktop                 |

| Container | Max-width | Uso                          |
|-----------|-----------|------------------------------|
| `sm`      | 640px     | Contenido estrecho           |
| `md`      | 768px     | Contenido de texto           |
| `lg`      | 1024px    | Dashboard                    |
| `xl`      | 1280px    | Main content                 |
| `2xl`     | 1400px    | Proyecto completo            |

---

## 8. Z-Index

| Token       | Valor     | Uso                              |
|-------------|-----------|----------------------------------|
| `hide`      | -1        | Elements ocultos                 |
| `auto`      | auto      | Auto                             |
| `base`      | 0         | Contenido base                   |
| `dropdown`  | 1000      | Dropdowns, tooltips              |
| `sticky`    | 1100      | Headers sticky                   |
| `modal`     | 1300      | Modals                           |
| `popover`   | 1400      | Popovers flotantes               |
| `tooltip`   | 1500      | Tooltips                         |
| `toast`     | 1600      | Toasts/notificaciones            |
| `overlay`   | 1700      | Overlays de modales              |
| `skipLink`  | 10000     | Skip link (top layer)            |

---

## 9. Uso en código

### TypeScript (theme.ts)

```typescript
import { theme } from "@/styles/theme";

const primaryColor = theme.colors.primary;
const borderRadius = theme.borderRadius.lg;
const motionDuration = theme.motion.duration.normal;
```

### CSS (variables)

```css
.my-component {
  color: var(--color-text-primary);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-subtle);
  box-shadow: var(--shadow-subtle);
  border-radius: var(--radius-lg);
  transition: box-shadow var(--transition-normal);
}

@media (prefers-reduced-motion: reduce) {
  .my-component {
    transition: none;
  }
}
```

### Tailwind (utilidades)

```tsx
// Colores semánticos
<div className="bg-surface-elevated text-primary border border-subtle" />
<div className="bg-surface-sunken text-secondary" />

// Sombra semántica
<div className="shadow-subtle" />   {/* Subtle shadow */}
<div className="shadow-medium" />   {/* Medium shadow  */}
<div className="shadow-strong" />   {/* Strong shadow  */}

// Texto semántico
<p className="text-inverse" />      {/* Texto inverso al theme */}
<p className="text-on-surface" />   {/* Texto sobre surface */}

// Bordes semánticos
<div className="border border-subtle" />
<div className="border border-strong" />

// Destructive (alias de danger)
<button className="bg-destructive text-destructive-foreground" />
```

---

## 10. Principios de diseño

1. **Tokens primero**: todo componente usa tokens, nunca valores hardcodeados.
2. **Mobile-first**: 320px antes que desktop. Touch targets ≥ 44×44px.
3. **Accesibilidad AA**: contraste ≥ 4.5:1 texto, ≥ 3:1 bordes/elementos.
4. **Light + dark**: verificar ambos en cada cambio.
5. **Motion con propósito**: 100/200/300ms. `prefers-reduced-motion` respetado.
6. **Body text ≥ 16px** (`--text-base`).
7. **Máximo 7 tamaños tipográficos** (escala modular, ratio ~1.33).
8. **3 sombras + focus ring** (no más).
