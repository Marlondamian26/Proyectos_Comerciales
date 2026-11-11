# Checklist de QA - Sistema de Diseño Mi-Pyme

## ✅ Checklist de Aceptación Final

### 1. Tokens y Paleta de Colores

#### Modo Claro (Light Mode)
- [ ] **Primary**: `#0B6E4F` coincide con especificación
- [ ] **Primary scales**: 100-900 definidos correctamente
- [ ] **Secondary**: `#0B5FA3` coincide con especificación
- [ ] **Accent**: `#F59E0B` coincide con especificación
- [ ] **Background**: `#FFFFFF` puro
- [ ] **Background-alt**: `#F7F9FB`
- [ ] **Surface**: `#FFFFFF`
- [ ] **Surface-alt**: `#F2F4F7`
- [ ] **Text-primary**: `#0F1724`
- [ ] **Text-secondary**: `#475569`
- [ ] **Text-muted**: `#94A3B8`
- [ ] **Border**: `#E6EEF6`
- [ ] **Success**: `#16A34A`
- [ ] **Warning**: `#F59E0B`
- [ ] **Danger**: `#EF4444`
- [ ] **Info**: `#0EA5E9`

#### Modo Oscuro (Dark Mode)
- [ ] **Primary**: `#1FA77A` (derivado más brillante)
- [ ] **Background**: `#0B1220`
- [ ] **Background-alt**: `#0F1724`
- [ ] **Surface**: `#0F1724`
- [ ] **Surface-alt**: `#141D2E`
- [ ] **Surface-elevated**: `#1E2A3D`
- [ ] **Text-primary**: `#E6EEF6`
- [ ] **Text-secondary**: `#A5BBCF`
- [ ] **Text-muted**: `#6B7A8C`
- [ ] **Border**: `rgba(255,255,255,0.06)`
- [ ] **Border-strong**: `rgba(255,255,255,0.12)`
- [ ] **Success**: `#22C55E`
- [ ] **Warning**: `#FBBF24`
- [ ] **Danger**: `#F87171`
- [ ] **Info**: `#38BDF8`

### 2. Contraste y Accesibilidad (WCAG AA/AAA)

#### Textos
- [ ] Títulos (text-primary): ≥ 7:1 contraste (AAA)
- [ ] Cuerpo (text-secondary): ≥ 4.5:1 contraste (AA)
- [ ] Texto atenuado (text-muted): ≥ 3:1 contraste (AA large)
- [ ] Texto sobre primario: ≥ 4.5:1
- [ ] Texto sobre secundario: ≥ 4.5:1
- [ ] Texto sobre acento: ≥ 4.5:1

#### Botones e Interactivos
- [ ] Botón primario: ≥ 4.5:1 (texto) / ≥ 3:1 (borde/fondo)
- [ ] Botón secundario: ≥ 4.5:1
- [ ] Botón outline: ≥ 3:1 (borde)
- [ ] Botón ghost: ≥ 3:1 (hover)
- [ ] Estados focus: anillo visible 2px
- [ ] Estados hover: cambio visible
- [ ] Estados active: escala 0.98
- [ ] Estados disabled: opacidad 0.5

#### Formularios
- [ ] Labels asociados correctamente (htmlFor)
- [ ] Errores con role="alert" y aria-live
- [ ] Hints con aria-describedby
- [ ] Inputs con aria-invalid cuando hay error
- [ ] Focus visible en todos los campos

### 3. Componentes UI

#### Button
- [ ] Variants: primary, secondary, accent, outline, ghost, destructive, gradient, gradientSecondary, gradientAccent, link
- [ ] Sizes: sm, md, lg, icon
- [ ] Loading state con spinner
- [ ] Icon left/right
- [ ] asChild support
- [ ] Disabled state
- [ ] Focus-visible ring

#### Card
- [ ] Variants: default, elevated, outlined, ghost
- [ ] Con imagen y overlay
- [ ] Con badge (default, success, warning, error, info)
- [ ] Con footer
- [ ] Hover lift animation
- [ ] Gradient border option
- [ ] Clickable (button wrapper)

#### Modal
- [ ] Focus trap funcional
- [ ] Escape para cerrar
- [ ] Click overlay para cerrar (configurable)
- [ ] Botón close visible
- [ ] Tamaños: sm, md, lg, xl, full
- [ ] Animaciones: scaleIn, fadeIn
- [ ] Footer con acciones

#### Table
- [ ] Columnas con header, accessor, align
- [ ] Striped rows
- [ ] Hoverable rows
- [ ] Row click con keyboard support
- [ ] Loading state
- [ ] Empty state
- [ ] Bordered option
- [ ] Compact option

#### Input / Textarea / Select
- [ ] Label, error, hint
- [ ] Left/right icons
- [ ] Password toggle
- [ ] Disabled/readonly states
- [ ] Focus ring con color primario
- [ ] Error state con color destructivo
- [ ] Select con opciones y placeholder

#### Badge
- [ ] Variants: default, primary, secondary, success, warning, error, info, outline
- [ ] Sizes: sm, md, lg
- [ ] Dot indicator
- [ ] StatusBadge helper (pending, active, completed, cancelled, failed, draft)

#### Toast
- [ ] Variants: success, error, warning, info
- [ ] Auto-dismiss con duration
- [ ] Manual close button
- [ ] Title opcional
- [ ] Action button opcional
- [ ] ToastContainer con stack
- [ ] Animaciones: slideDown, fadeIn

#### Navbar
- [ ] Logo/link a home
- [ ] Nav items filtrados por rol
- [ ] Active state (aria-current="page")
- [ ] Hover states
- [ ] ThemeToggle integrado
- [ ] Responsive (overflow-x-auto)

#### Sidebar
- [ ] Items filtrados por rol
- [ ] Active state con path matching
- [ ] Icons con lucide-react
- [ ] Hover states
- [ ] Scroll interno

### 4. Theme System

#### ThemeProvider
- [ ] SSR-safe (getInitialTheme)
- [ ] Persistencia localStorage
- [ ] Persistencia cookies (para SSR)
- [ ] prefers-color-scheme listener
- [ ] system/light/dark modes
- [ ] No FOUC
- [ ] useSyncExternalStore para reactividad

#### ThemeToggle
- [ ] Botón principal toggle light/dark
- [ ] Dropdown con 3 opciones
- [ ] ARIA labels completos
- [ ] Keyboard navigation (Escape, Tab)
- [ ] Animaciones suaves
- [ ] Estado aria-pressed

#### CSS Variables
- [ ] :root (light) definido
- [ ] [data-theme="dark"] definido
- [ ] @media prefers-color-scheme fallback
- [ ] Transiciones globales (transition-theme)
- [ ] Scrollbar styling

### 5. Visual Regression Tests

#### Componentes (Light + Dark)
- [ ] Button: default, all variants, all sizes, loading, disabled
- [ ] Card: default, with image, with badge, elevated, outlined, ghost, grid
- [ ] Modal: default, with footer, sm, lg, xl, no overlay close
- [ ] Table: default, striped, hoverable, loading, empty, large dataset
- [ ] Input: default, with error, disabled, textarea, select
- [ ] Badge: all variants, all sizes, with dot, status badges
- [ ] Toast: all variants, with action, container
- [ ] Navbar: guest, cliente, negocio, logistica, admin
- [ ] Sidebar: cliente, negocio, logistica, admin

#### Páginas Completas
- [ ] Home page
- [ ] Login/Registro
- [ ] Catálogo
- [ ] Perfil
- [ ] Dashboard (cada rol)

### 6. Accesibilidad (axe-core + Lighthouse)

#### axe-core Tests
- [ ] Home page: 0 violations WCAG 2.1 AA
- [ ] Login: 0 violations
- [ ] Registro: 0 violations
- [ ] Catálogo: 0 violations
- [ ] Perfil: 0 violations
- [ ] Modales: 0 violations (focus trap)
- [ ] Formularios: 0 violations
- [ ] Tablas: 0 violations
- [ ] Navegación: 0 violations

#### Lighthouse
- [ ] Accessibility score ≥ 95
- [ ] Best Practices ≥ 90
- [ ] SEO ≥ 90

#### Manual Testing
- [ ] Navegación solo teclado (Tab, Shift+Tab)
- [ ] Screen reader (NVDA/VoiceOver) - anuncios correctos
- [ ] Zoom 200% - sin pérdida de funcionalidad
- [ ] Alto contraste del SO - legible

### 7. Performance y UX

#### Cambio de Tema
- [ ] Sin FOUC (Flash of Unstyled Content)
- [ ] Transición suave 150-250ms
- [ ] No layout shift
- [ ] Persistencia correcta (recarga mantiene tema)

#### SSR/SEO
- [ ] HTML inicial con data-theme correcto
- [ ] Hydration sin mismatch
- [ ] Meta tags correctos
- [ ] Script theme-init beforeInteractive

#### Animaciones
- [ ] Reduce motion respetado
- [ ] Duraciones consistentes (100-500ms)
- [ ] Easing natural (ease-out)

### 8. Cross-Browser

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (iOS Safari simulation)
- [ ] Mobile Safari

### 9. Documentación

- [ ] THEME_GUIDE.md completo
- [ ] README actualizado
- [ ] Storybook documentado
- [ ] Changelog actualizado

## 🚀 Comandos de Verificación

```bash
# Desarrollo
npm run dev

# Linting
npm run lint

# Tests unitarios
npm run test

# Tests visuales
npm run test:visual

# Tests accesibilidad
npm run test:a11y

# Storybook
npm run storybook

# Build producción
npm run build

# Lighthouse CI
npx lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-report.json
```

## 📋 Firmas de Aprobación

| Rol | Nombre | Fecha | Firma |
|-----|--------|-------|-------|
| Frontend Lead | | | |
| Diseño UX/UI | | | |
| QA Lead | | | |
| Product Owner | | | |

---

**Nota**: Este checklist debe completarse al 100% antes del merge a main. Cualquier item no verificado debe documentarse como known issue con plan de resolución.