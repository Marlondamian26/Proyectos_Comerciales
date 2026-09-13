# Estilos y Sistema de Diseño - Mi-Pyme

## Estructura

```
src/styles/
├── theme.ts          # Tokens de diseño centralizados
└── README.md         # Este archivo

src/app/
├── globals.css       # Variables CSS y estilos base
└── layout.tsx        # Configuración SSR del tema

tailwind.config.ts    # Configuración Tailwind mapeada a tokens
```

## Tokens de Diseño (`theme.ts`)

El archivo `theme.ts` es la **fuente única de verdad** para todos los tokens de diseño:

- **Colores**: Paletas completas para light/dark mode
- **Gradientes**: Definiciones reutilizables
- **Sombras**: Escalas consistentes
- **Tipografía**: Familias, tamaños, pesos, line-heights
- **Espaciado**: Escala unificada
- **Bordes/Radio**: Valores estándar
- **Transiciones**: Duraciones y easings
- **Z-Indices**: Capas ordenadas
- **Breakpoints**: Puntos de quiebre responsivos
- **Animaciones**: Keyframes reutilizables

### Uso en TypeScript

```typescript
import { theme } from "@/styles/theme";

// Acceso tipado
const primaryColor = theme.colors.primary;
const spacingMd = theme.spacing[4];
const shadowLg = theme.shadows.lg;
```

### Uso en CSS

```css
.mi-componente {
  color: var(--color-primary);
  background: var(--gradient-primary);
  box-shadow: var(--shadow-lg);
  font-size: var(--text-base);
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
}
```

### Uso en Tailwind

```tsx
<div className="bg-primary text-primary-foreground shadow-theme-lg rounded-xl p-4">
  Contenido
</div>
```

## Variables CSS (`globals.css`)

### Modo Claro (`:root`)

Todas las variables base definidas con valores de la paleta clara.

### Modo Oscuro (`[data-theme="dark"]`)

Variables sobrescritas con valores derivados para modo oscuro:
- Colores más brillantes para contraste
- Fondos oscuros (#0B1220, #0F1724)
- Bordes sutiles (rgba white)
- Sombras con glow en lugar de negras

### Fallback Sistema

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* Variables oscuras automáticas si no hay preferencia usuario */
  }
}
```

## Configuración Tailwind (`tailwind.config.ts`)

Mapeo completo de tokens a utilidades:

```typescript
colors: {
  primary: "var(--color-primary)",
  "primary-100": "var(--color-primary-100)",
  surface: "var(--color-surface)",
  "text-primary": "var(--color-text-primary)",
  // ...
},
boxShadow: {
  "theme-sm": "var(--shadow-sm)",
  "theme-md": "var(--shadow-md)",
  // ...
},
backgroundImage: {
  "gradient-primary": "var(--gradient-primary)",
  // ...
},
```

## Clases Utilitarias Personalizadas

### Fondos
```tsx
<div className="bg-surface" />
<div className="bg-surface-alt" />
<div className="bg-surface-elevated" />
<div className="bg-background" />
<div className="bg-background-alt" />
```

### Textos
```tsx
<p className="text-primary" />
<p className="text-secondary" />
<p className="text-muted" />
<p className="text-on-primary" />
```

### Bordes
```tsx
<div className="border-theme" />
<div className="border-theme-strong" />
<div className="border-theme-muted" />
```

### Sombras
```tsx
<div className="shadow-theme-sm" />
<div className="shadow-theme-md" />
<div className="shadow-theme-lg" />
<div className="shadow-theme-xl" />
<div className="shadow-theme-focus" />
<div className="shadow-theme-glow" />
```

### Gradientes
```tsx
<div className="bg-gradient-primary" />
<div className="bg-gradient-hero" />
<div className="bg-gradient-card" />
<div className="bg-gradient-accent" />
```

### Overlays
```tsx
<div className="overlay" />
<div className="overlay-strong" />
```

### Transiciones
```tsx
<div className="transition-theme" />
```

### Animaciones
```tsx
<div className="animate-fade-in" />
<div className="animate-slide-up" />
<div className="animate-slide-down" />
<div className="animate-scale-in" />
```

## Sistema de Tema

### ThemeProvider

```tsx
import { ThemeProvider, useTheme, getInitialTheme } from "@/components/ThemeProvider";

export default function RootLayout({ children }) {
  const initialTheme = getInitialTheme();
  return (
    <html data-theme={initialTheme}>
      <ThemeProvider>{children}</ThemeProvider>
    </html>
  );
}
```

### useTheme Hook

```tsx
function MiComponente() {
  const { theme, resolvedTheme, ready, setTheme, toggleTheme } = useTheme();

  // theme: "light" | "dark" | "system" (preferencia usuario)
  // resolvedTheme: "light" | "dark" (tema real aplicado)
  // ready: boolean (hidratación completada)
}
```

### ThemeToggle

```tsx
import { ThemeToggle } from "@/components/ThemeToggle";

<ThemeToggle />
```

Incluye:
- Toggle principal (clic = alternar light/dark)
- Dropdown (Claro / Oscuro / Sistema)
- Persistencia automática
- Accesibilidad completa

## Agregar Nuevos Tokens

1. **Agregar a `theme.ts`**:
```typescript
export const theme = {
  colors: {
    nuevoColor: "#HEXVALUE",
    nuevoColorDark: "#HEXVALUE",
  },
  // ...
};
```

2. **Agregar variables CSS en `globals.css`**:
```css
:root {
  --color-nuevo-color: #HEXVALUE;
}

[data-theme="dark"] {
  --color-nuevo-color: #HEXVALUE_DARK;
}
```

3. **Mapear en `tailwind.config.ts`**:
```typescript
colors: {
  "nuevo-color": "var(--color-nuevo-color)",
},
```

4. **Documentar en `THEME_GUIDE.md`**

## Mejores Prácticas

### ✅ Hacer
- Usar variables CSS para valores dinámicos (tema)
- Usar utilidades Tailwind para valores estáticos
- Combinar: `bg-surface text-primary shadow-theme-md`
- Testear en ambos temas siempre

### ❌ No Hacer
- Hardcodear colores hex en componentes
- Usar `dark:` prefix de Tailwind (usar variables CSS)
- Crear estilos inline con valores fijos
- Ignorar modo oscuro en nuevos componentes

## Testing

```bash
# Storybook (visual testing)
npm run storybook

# Visual regression (Playwright)
npm run test:visual

# Accesibilidad (axe-core)
npm run test:a11y
```

## Referencias

- [THEME_GUIDE.md](../docs/THEME_GUIDE.md) - Guía completa
- [QA_CHECKLIST.md](../docs/QA_CHECKLIST.md) - Checklist de QA
- [Tailwind Config](https://tailwindcss.com/docs/configuration)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)