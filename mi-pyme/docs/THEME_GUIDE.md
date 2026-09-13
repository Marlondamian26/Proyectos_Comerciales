# Sistema de Diseño Mi-Pyme - Guía de Tokens y Temas

## Visión General

Este documento describe el sistema de diseño completo para la plataforma Mi-Pyme, incluyendo tokens de diseño, implementación de modo claro/oscuro, componentes y guías de accesibilidad.

## Estructura de Tokens

### Colores

#### Modo Claro (Light Mode)

```typescript
// Colores primarios - Verde corporativo
primary: "#0B6E4F"           // Principal
primary-100: "#E6F6F0"       // Muy claro
primary-200: "#CFF0E3"       // Claro
primary-300: "#99E0C7"       // Medio-claro
primary-400: "#63D0AB"       // Medio
primary-500: "#2DC08F"       // Base
primary-600: "#1FA77A"       // Hover
primary-700: "#168460"       // Activo
primary-800: "#0D6146"       // Oscuro
primary-900: "#063E2D"       // Muy oscuro

// Colores secundarios - Azul corporativo
secondary: "#0B5FA3"
secondary-100: "#E6F0FA"
// ... escalas similares

// Colores de acento - Amarillo/naranja
accent: "#F59E0B"
accent-100: "#FEF3C7"
// ... escalas similares

// Fondos
background: "#FFFFFF"
background-alt: "#F7F9FB"
background-tertiary: "#EEF2F7"

// Superficies
surface: "#FFFFFF"
surface-alt: "#F2F4F7"
surface-elevated: "#FFFFFF"

// Textos
text-primary: "#0F1724"      // Títulos, texto principal
text-secondary: "#475569"    // Texto secundario
text-muted: "#94A3B8"        // Texto atenuado
text-on-primary: "#FFFFFF"   // Texto sobre primario
text-on-secondary: "#FFFFFF" // Texto sobre secundario
text-on-accent: "#0F1724"    // Texto sobre acento

// Bordes
border: "#E6EEF6"
border-strong: "#D0DAE8"
border-muted: "#F0F4FA"

// Estados
success: "#16A34A"
warning: "#F59E0B"
danger: "#EF4444"
info: "#0EA5E9"
```

#### Modo Oscuro (Dark Mode)

```typescript
// Colores primarios - Versión más brillante para fondo oscuro
primary: "#1FA77A"           // Principal (más brillante)
primary-100: "#063E2D"       // Muy oscuro
primary-200: "#0D6146"       // Oscuro
// ... escalas invertidas

// Fondos oscuros
background: "#0B1220"        // Fondo principal
background-alt: "#0F1724"    // Fondo alternativo
background-tertiary: "#141D2E" // Fondo terciario

// Superficies oscuras
surface: "#0F1724"
surface-alt: "#141D2E"
surface-elevated: "#1E2A3D"

// Textos claros
text-primary: "#E6EEF6"
text-secondary: "#A5BBCF"
text-muted: "#6B7A8C"
text-on-primary: "#0B1220"
text-on-secondary: "#0B1220"
text-on-accent: "#0B1220"

// Bordes sutiles
border: "rgba(255, 255, 255, 0.06)"
border-strong: "rgba(255, 255, 255, 0.12)"
border-muted: "rgba(255, 255, 255, 0.03)"

// Estados adaptados
success: "#22C55E"
warning: "#FBBF24"
danger: "#F87171"
info: "#38BDF8"
```

### Gradientes

```typescript
gradients: {
  primary: "linear-gradient(90deg, #0B6E4F 0%, #0B5FA3 100%)",
  primaryHover: "linear-gradient(90deg, #1FA77A 0%, #3387D7 100%)",
  hero: "linear-gradient(180deg, #E6F6F0 0%, #FFFFFF 100%)",
  heroAlt: "linear-gradient(135deg, #E6F6F0 0%, #E6F0FA 100%)",
  card: "linear-gradient(180deg, #FFFFFF 0%, #F7F9FB 100%)",
  accent: "linear-gradient(90deg, #F59E0B 0%, #F97316 100%)",
  mesh: "radial-gradient(ellipse at 50% 50%, #E6F6F0 0%, #FFFFFF 70%)",
}
```

### Sombras

```typescript
shadows: {
  none: "none",
  xs: "0 1px 2px rgba(2, 6, 23, 0.03)",
  sm: "0 1px 3px rgba(2, 6, 23, 0.04), 0 1px 2px rgba(2, 6, 23, 0.02)",
  md: "0 4px 12px rgba(2, 6, 23, 0.06), 0 2px 4px rgba(2, 6, 23, 0.03)",
  lg: "0 12px 28px rgba(2, 6, 23, 0.08), 0 4px 8px rgba(2, 6, 23, 0.04)",
  xl: "0 20px 40px rgba(2, 6, 23, 0.10), 0 8px 16px rgba(2, 6, 23, 0.05)",
  "2xl": "0 32px 64px rgba(2, 6, 23, 0.12), 0 12px 24px rgba(2, 6, 23, 0.06)",
  inner: "inset 0 2px 4px rgba(2, 6, 23, 0.03)",
  focus: "0 0 0 3px rgba(11, 110, 79, 0.25)",
  glow: "0 0 20px rgba(11, 110, 79, 0.15)",
  "glow-strong": "0 0 40px rgba(11, 110, 79, 0.25)",
}
```

### Tipografía

```typescript
typography: {
  fontFamily: {
    sans: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
    display: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  sizes: {
    "2xs": "10px",
    xs: "12px",
    sm: "14px",
    base: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px",
    "5xl": "48px",
    "6xl": "60px",
  },
  weights: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  lineHeights: {
    none: 1,
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
}
```

### Espaciado

```typescript
spacing: {
  0: "0",
  1: "0.25rem",   // 4px
  2: "0.5rem",    // 8px
  3: "0.75rem",   // 12px
  4: "1rem",      // 16px
  5: "1.25rem",   // 20px
  6: "1.5rem",    // 24px
  8: "2rem",      // 32px
  10: "2.5rem",   // 40px
  12: "3rem",     // 48px
  16: "4rem",     // 64px
  20: "5rem",     // 80px
  24: "6rem",     // 96px
  32: "8rem",     // 128px
}
```

### Bordes y Radio

```typescript
borderRadius: {
  none: "0",
  xs: "0.125rem",  // 2px
  sm: "0.25rem",   // 4px
  md: "0.375rem",  // 6px
  lg: "0.5rem",    // 8px
  xl: "0.75rem",   // 12px
  "2xl": "1rem",   // 16px
  "3xl": "1.5rem", // 24px
  full: "9999px",
}
```

## Implementación CSS

### Variables CSS Personalizadas

Todas las variables CSS están definidas en `src/app/globals.css` bajo `:root` (modo claro) y `[data-theme="dark"]` (modo oscuro).

```css
:root {
  --color-primary: #0B6E4F;
  --color-background: #FFFFFF;
  --color-text-primary: #0F1724;
  /* ... más variables */
}

[data-theme="dark"] {
  --color-primary: #1FA77A;
  --color-background: #0B1220;
  --color-text-primary: #E6EEF6;
  /* ... variables oscuras */
}
```

### Uso en Componentes

```tsx
// Usando variables CSS directamente
<div className="bg-[var(--color-surface)] text-[var(--color-text-primary)]" />

// Usando clases Tailwind mapeadas
<div className="bg-surface text-primary" />

// Usando utilidades personalizadas
<div className="shadow-theme-lg bg-gradient-primary" />
```

## Tailwind Config

El archivo `tailwind.config.ts` mapea todos los tokens a utilidades de Tailwind:

```typescript
theme: {
  extend: {
    colors: {
      primary: "var(--color-primary)",
      "primary-100": "var(--color-primary-100)",
      // ... todos los colores
      surface: "var(--color-surface)",
      "text-primary": "var(--color-text-primary)",
      // ...
    },
    fontFamily: {
      sans: ["var(--font-sans)"],
      mono: ["var(--font-mono)"],
    },
    boxShadow: {
      "theme-sm": "var(--shadow-sm)",
      "theme-md": "var(--shadow-md)",
      "theme-lg": "var(--shadow-lg)",
      // ...
    },
  },
}
```

## Hook useTheme

```typescript
import { useTheme } from "@/components/ThemeProvider";

function MiComponente() {
  const { theme, resolvedTheme, ready, setTheme, toggleTheme } = useTheme();

  return (
    <div>
      <p>Tema actual: {resolvedTheme}</p>
      <p>Preferencia: {theme}</p>
      <button onClick={toggleTheme}>Cambiar tema</button>
      <button onClick={() => setTheme("dark")}>Forzar oscuro</button>
      <button onClick={() => setTheme("system")}>Sistema</button>
    </div>
  );
}
```

## Componente ThemeToggle

```tsx
import { ThemeToggle } from "@/components/ThemeToggle";

<ThemeToggle />
```

El componente incluye:
- Botón principal para alternar claro/oscuro
- Dropdown con 3 opciones: Claro, Oscuro, Sistema
- Accesibilidad completa (ARIA, keyboard navigation)
- Animaciones suaves
- Persistencia en localStorage y cookies

## Reglas de Accesibilidad (WCAG AA/AAA)

### Contraste Mínimo

- Texto principal: ≥ 7:1 (AAA) / ≥ 4.5:1 (AA)
- Texto grande (≥18px): ≥ 4.5:1 (AAA) / ≥ 3:1 (AA)
- Elementos interactivos: ≥ 3:1

### Verificación de Contraste

```bash
# Ejecutar pruebas de accesibilidad
npm run test:a11y
```

### Focus Visible

Todos los elementos interactivos tienen focus visible:

```css
*:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}
```

### Navegación por Teclado

- Tab: Navegar entre elementos
- Enter/Space: Activar botones
- Escape: Cerrar modales/dropdowns
- Flechas: Navegar en menús

## Testing

### Pruebas Visuales (Playwright)

```bash
# Ejecutar pruebas visuales
npm run test:visual

# Ver reporte
npx playwright show-report
```

### Pruebas de Accesibilidad

```bash
# Ejecutar pruebas de accesibilidad
npm run test:a11y
```

### Storybook

```bash
# Iniciar Storybook
npm run storybook

# Construir Storybook estático
npm run storybook:build
```

## Checklist de QA

### Modo Claro
- [ ] Paleta coincide con especificaciones (#0B6E4F primary)
- [ ] Contraste texto principal ≥ 7:1
- [ ] Contraste botones primarios ≥ 4.5:1
- [ ] Gradientes renderizan correctamente
- [ ] Sombras suaves y consistentes

### Modo Oscuro
- [ ] Derivación coherente (no inversión literal)
- [ ] Colores más brillantes sobre fondo oscuro
- [ ] Bordes visibles (rgba white 0.06)
- [ ] Sombras internas/glow en lugar de negras
- [ ] Gradientes desaturados

### Componentes
- [ ] Button: todos los variantes en ambos temas
- [ ] Card: default, elevated, outlined, ghost
- [ ] Modal: focus trap, escape, overlay click
- [ ] Table: striped, hover, compact, loading
- [ ] Input: label, error, hint, password toggle
- [ ] Select: placeholder, error, disabled
- [ ] Badge: todos los variantes y tamaños
- [ ] Toast: success, error, warning, info

### Accesibilidad
- [ ] axe-core: 0 violaciones WCAG 2.1 AA
- [ ] Lighthouse: Accessibility ≥ 95
- [ ] Navegación teclado completa
- [ ] ARIA labels correctos
- [ ] Focus visible en todos los interactivos

### Performance
- [ ] Sin FOUC (Flash of Unstyled Content)
- [ ] Transiciones suaves (150-250ms)
- [ ] No layout shift en cambio de tema
- [ ] SSR correctamente hidratado

## Migración y Mantenimiento

### Agregar Nuevo Color

1. Agregar a `src/styles/theme.ts`
2. Agregar variables CSS en `globals.css` (light y dark)
3. Mapear en `tailwind.config.ts`
4. Actualizar documentación

### Agregar Nuevo Componente

1. Crear componente en `src/components/ui/`
2. Usar tokens CSS variables
3. Crear stories en `.stories.tsx`
4. Agregar tests visuales
5. Verificar accesibilidad

## Referencias

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Storybook Docs](https://storybook.js.org/docs)
- [Playwright Docs](https://playwright.dev/docs/intro)
- [axe-core Docs](https://github.com/dequelabs/axe-core)