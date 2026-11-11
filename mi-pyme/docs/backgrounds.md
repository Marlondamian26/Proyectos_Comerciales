# Sistema de fondos — Mi-Pyme

## Reglas

1. **Light mode:** fondo blanco/gris muy claro. Sin gradientes agresivos.
2. **Dark mode:** fondo `--background` (slate-950) sólido. SIN gradientes grises.
3. **Navbar:** `bg-background` sólido + `border-b border-border`.
4. **Secciones de dashboard:** `bg-background` sólido + `border-b border-border`.
5. **Cards:** `bg-surface-base` + `border border-border`.
6. **Contraste mínimo:** WCAG 2.1 AA (4.5:1 texto normal, 3:1 texto grande).

## Prohibiciones

- ❌ Gradientes grises en dark mode.
- ❌ `bg-background/80 backdrop-blur-md` en navbar (usar sólido).
- ❌ Texto directamente sobre gradientes.
- ❌ Colores hardcodeados (siempre usar tokens).

## Componentes

### Navbar (`src/components/Navbar.tsx`)

```tsx
<header className="sticky top-0 z-[1000] border-b border-border bg-background">
```

- Sólido, sin transparencia.
- `z-[1000]` para que dropdowns aparezcan encima de todo.
- `border-b border-border` para separar del contenido.

### Secciones de dashboard

```tsx
<section className="border-b border-border bg-background">
```

- Reemplazar `bg-gradient-to-b from-primary/5 via-background to-background` por `bg-background`.
- Mantener bordes para separar secciones.

### Hero de home (landings)

```tsx
<section className="relative border-b border-border bg-background">
  {/* Blob decorativo sutil */}
  <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
</section>
```

- Blobs sutiles con `bg-primary/10` y `bg-secondary/10` son aceptables.
- En dark mode, opacidad ≤ 0.1.

### CTA sections

```tsx
<div className="rounded-3xl bg-gradient-to-r from-primary to-secondary p-8 sm:p-16 text-center">
```

- Usar `from-primary to-secondary` (colores Mi-Pyme).
- Texto blanco sobre este gradiente tiene suficiente contraste.

## Contrastes verificados

| Texto | Fondo | Light contrast | Dark contrast |
|-------|-------|---------------|---------------|
| `text-foreground` | `bg-background` | ~15:1 | ~18:1 |
| `text-muted-foreground` | `bg-background` | ~7:1 | ~6:1 |
| `text-white` | `bg-primary/15` | ~7:1 | ~6:1 |
| `text-primary` | `bg-primary/15` | ~4:1 | ~3:1 |

## Palette de colores

| Nombre | Light | Dark | Uso |
|--------|-------|------|-----|
| primary | #0B6E4F | #1FA77A | Accentos primarios |
| secondary | #0B5FA3 | #3387D7 | Accentos secundarios |
| accent | #F59E0B | #FBBF24 | Call-to-action destacados |
| background | #FFFFFF | #0B1220 | Fondo principal |
| surface | #FFFFFF | #0F1724 | Superficies elevadas |
| foreground | #0F1724 | #E6EEF6 | Texto principal |
