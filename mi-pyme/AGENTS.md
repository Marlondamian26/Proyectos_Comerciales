<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Normas de Calidad de Código

## Verificación de typos y patrones de Date

Antes de commitear, verifica:

1. **`new Date` siempre lleva paréntesis `()`.** `const x = new Date` asigna la
   función constructora, no una instancia. Busca patrones sospechosos:
   ```bash
   grep -rn "new Date[^(]" src/ --include="*.ts" --include="*.tsx"
   ```

2. **Las interfaces públicas (`*Params`, `*DTO`) deben revisarse ortográficamente.**
   Typos en nombres de campos como `fechaHoraFincio` (debe ser `fechaHoraInicio`)
   se propagan a todos los consumidores y son difíciles de detectar.

3. **Nomenclatura consistente singular/plural.** Usa plural (`pedidos`, `reservas`)
   para arrays y singular (`pedido`, `reserva`) para entidades individuales.

4. **Verifica con `tsc --noEmit`** que no hay errores de tipo tras los cambios.

## Testing

```bash
# Tests unitarios (vitest)
npm run test

# Tests de accesibilidad y regresión visual (Playwright + Axe)
npm run test:a11y

# Tests de rendimiento (LCP, CLS, console errors)
npm run test:performance

# Tests de tamaño de bundle
npm run test:bundle

# Lighthouse CI
npm run test:lighthouse

# Todos los tests visuales
npm run test:visual:all
```

**Verificación de calidad:** Antes de commitear, ejecuta `npm run test`,
`npx tsc --noEmit`, `npm run lint`, y `npm run test:a11y`. Los tests de
accesibilidad deben pasar en light y dark mode para todas las páginas críticas.

## Autenticación y seguridad

> **Reglas completas en `CLAUDE.md` → "Reglas de Autenticación y Seguridad (Etapa 5)"**
>
> Resumen de prohibiciones críticas:
> - Registro público **siempre** `CLIENTE` (nunca `NEGOCIO`/`ADMIN`/`LOGISTICA`).
> - Tokens de reset **siempre** hasheados (SHA-256) antes de guardar.
> - **Nunca** tokens en query strings (`?token=...`); usar POST body o headers.
> - **Nunca** loggear passwords, tokens, secrets ni `NEXTAUTH_SECRET`.
> - Mutaciones **siempre** validan propiedad (`assertPertenencia`).
> - `isActive: false` y `mustChangePassword` bloquean login.
> - `/api/admin/*` **siempre** validan rol `ADMIN`.
> - bcrypt **siempre** 12 rounds (`BCRYPT_ROUNDS`).
> - `sessionVersion` se incrementa al cambiar password, rol o estado de cuenta.
> - Los JWT deben llevar `sessionExpiresAt` absoluto: 24 h por defecto y 30 días con `rememberMe`; no depender de `token.exp` modificado antes del encoder de Auth.js.
> - Los intentos fallidos y `lockedUntil` se actualizan de forma atómica; la respuesta externa de login no distingue cuentas inexistentes, inactivas o bloqueadas.
> - Las rutas de página privadas redirigen a `/auth/login` conservando ruta y query en `callbackUrl`; el destino posterior al login debe validarse same-origin.
> - Los callbacks de sesión deben fallar cerrado si no pueden verificar el estado del usuario en la base de datos.
> - El logout debe usar POST para limpiar cookies Auth.js; no ofrecer mutaciones de sesión por GET.
> - Normalizar emails/usernames a lowercase.
>
> **Tests de arquitectura**: `src/tests/architecture-auth.test.ts` verifica
> automáticamente que ninguna de estas reglas se ha revertido. Si un test falla,
> es una regresión real.

## UI/UX — Reglas de Diseño (Fase 3.5)

> **Fuente de verdad**: `src/styles/tokens.css`, `src/app/globals.css`, `docs/design-tokens.md`, `docs/design-system.md`, `docs/ux-patterns.md`.

- **OBLIGATORIO**: usar tokens semánticos, no valores hardcodeados (colores, spacing, tipografía).
- **OBLIGATORIO**: mobile-first (320px antes que 768px).
- **OBLIGATORIO**: touch targets ≥ 44×44px.
- **OBLIGATORIO**: body text ≥ 16px.
- **OBLIGATORIO**: `next/image` con `width`/`height`/`alt` (o `fill`).
- **OBLIGATORIO**: skeletons en lugar de spinners en listas.
- Los fallbacks de navegación deben usar skeletons contextuales, `LoadingRegion` y labels accesibles. Respetar tema claro/oscuro y `prefers-reduced-motion`; ver [`docs/loading-system.md`](./docs/loading-system.md).
- **OBLIGATORIO**: empty states accionables (con CTA clara).
- **OBLIGATORIO**: `prefers-reduced-motion` respetado globalmente.
- **OBLIGATORIO**: `aria-label` en icon-only buttons.
- **OBLIGATORIO**: labels visibles en inputs (no solo placeholder).
- **OBLIGATORIO**: focus visible (`ring-2 ring-ring`).
- **PROHIBIDO**: animaciones decorativas sin propósito.
- **PROHIBIDO**: `console.log` en producción.
- **PROHIBIDO**: dark patterns (falsos countdowns, "casi agotado", popups forzados).
- **OBLIGATORIO**: correr `npm run test:a11y` antes de mergear.

### Reglas Responsive (Auditoría UI/UX Desktop + Mobile)

- **OBLIGATORIO**: `html, body { overflow-x: hidden; max-width: 100vw; }` en `globals.css`.
- **OBLIGATORIO**: `* { min-width: 0; }` global en `globals.css`.
- **OBLIGATORIO**: `env(safe-area-inset-*)` padding en `body` (notch iOS).
- **OBLIGATORIO**: `viewport` metadata con `maximumScale: 5` y `userScalable: true` en `layout.tsx`.
- **OBLIGATORIO**: touch targets ≥ 44×44px (`min-h-[44px] min-w-[44px]`).
- **OBLIGATORIO**: body text ≥ 16px en mobile (`text-base`), labels ≥ 14px (`text-sm`).
- **OBLIGATORIO**: `next/image` con `fill`/`width/height`, `object-cover` y `sizes` correcto.
- **OBLIGATORIO**: modales full-screen en mobile (`fixed inset-0 w-full h-full`).
- **OBLIGATORIO**: tablas → cards en mobile.
- **OBLIGATORIO**: sidebar → drawer en mobile (`hidden lg:flex` + drawer lateral).
- **OBLIGATORIO**: cards full-width en mobile (`rounded-none sm:rounded-xl`, `border-0 sm:border`).
- **OBLIGATORIO**: formularios y botones `w-full` en mobile, `sm:w-auto` en desktop.
- **OBLIGATORIO**: toasts full-width arriba en mobile, esquina arriba-derecha en desktop.
- **OBLIGATORIO**: mobile-first (320px antes que 768px); escribir estilos base mobile, luego `sm:`/`md:`/`lg:`.
- **PROHIBIDO**: hardcodear anchos fijos (`w-[500px]`, `min-w-[200px]` sin fallback responsive).
- **PROHIBIDO**: grids sin responsive (`grid-cols-3` sin `sm:`/`md:`/`lg:`).
- **PROHIBIDO**: `userScalable: false` ni `maximumScale: 1` en viewport.
- **PROHIBIDO**: valores de color/espaciado hardcodeados (usar tokens semánticos).

## Buscadores y Server Components (Prevención de error React #441)

### Obligaciones

- **OBLIGATORIO**: `searchParams` y `params` deben `await`earse en Next.js 15+ Server Components.
- **OBLIGATORIO**: `auth()`, `cookies()`, `headers()` deben `await`earse en Server Components.
- **OBLIGATORIO**: `useSearchParams` debe estar envuelto en `<Suspense>` en Client Components.
- **OBLIGATORIO**: `useEffect` que navega (`router.push`/`replace`) debe tener debounce (300ms) y depender solo del valor debounced.
- **OBLIGATORIO**: sanitizar query de Prisma (`trim`, `slice(0, 100)`, `mode: "insensitive"`).
- **OBLIGATORIO**: manejar resultados vacíos con `EmptyState`.
- **OBLIGATORIO**: serializar datos Server → Client (`Decimal` → `toString()`, `Date` → `toISOString()`).
- **OBLIGATORIO**: todos los buscadores usan el patrón canónico (`SearchInput` + `useDebounce` + `<Suspense>`).

### Prohibiciones

- **PROHIBIDO**: acceder a `searchParams.q` sin `await`.
- **PROHIBIDO**: `router.push`/`replace` en `useEffect` sin debounce.
- **PROHIBIDO**: incluir `router` o `searchParams` en deps de `useEffect` que navega.
- **PROHIBIDO**: pasar `Decimal` o `Date` directamente a Client Components.
- **PROHIBIDO**: usar `defaultValue` en inputs de búsqueda controlados por Client Components.

### Tests de arquitectura

`src/tests/architecture-search.test.ts` verifica automáticamente que ninguna de estas reglas se ha revertido. Si un test falla, es una regresión real.

## Sesiones e invalidación (Prevención de regresiones de sesión)

### Obligaciones

- **OBLIGATORIO**: incrementar `sessionVersion` al cambiar password, rol o estado de cuenta.
- **OBLIGATORIO**: validar `sessionVersion` en `callbacks.jwt` con `trigger === "update"`.
- **OBLIGATORIO**: validar `isActive` en `callbacks.jwt` con `trigger === "update"`.
- **OBLIGATORIO**: `callbackUrl` preservado en redirecciones a login.
- **OBLIGATORIO**: `<SessionProvider>` envuelve todo el árbol en `layout.tsx`.
- **OBLIGATORIO**: `pages.signOut` definido en `auth.config.ts`.
- **OBLIGATORIO**: logout elimina cookies del servidor (`cookies()` de next/headers) y del cliente (`signOut`).
- **OBLIGATORIO**: home es accesible anónimo y logueado (contenido adaptativo).
- **OBLIGATORIO**: `mustChangePassword: true` bloquea navegación excepto `/perfil/cambiar-password`.

### Prohibiciones

- **PROHIBIDO**: `new Response().headers` para eliminar cookies en logout (usar `cookies()` de next/headers).
- **PROHIBIDO**: `void session` sin usar la sesión en Server Components.
- **PROHIBIDO**: `window.location.href` como navegación principal en logout (usar `router.push` + `router.refresh`).
- **PROHIBIDO**: hardcodear rutas de redirección en componentes de logout.

### Tests de arquitectura

`src/tests/architecture-session.test.ts` verifica automáticamente que ninguna de estas reglas se ha revertido. Si un test falla, es una regresión real.

## Reglas Legales (Fase Legal)

> **Fuente de verdad**: `docs/legal.md`. Los documentos legales requieren revisión por abogado antes del lanzamiento público.

### Obligaciones

- **OBLIGATORIO**: el registro público incluye checkbox de aceptación de Términos y Condiciones y Política de Privacidad.
- **OBLIGATORIO**: validación en servidor de `aceptaTerminos` en `registrarUsuario` (`src/lib/actions.ts`).
- **OBLIGATORIO**: registrar `aceptoTerminosEn` y `aceptoTerminosVersion` en el modelo `User` de Prisma.
- **OBLIGATORIO**: el checkout muestra aviso de Términos y Condiciones y Política de Privacidad antes de confirmar.
- **OBLIGATORIO**: el footer incluye enlaces a `/privacidad`, `/terminos` y `/devoluciones`.
- **OBLIGATORIO**: cada página legal tiene `metadata` con `title`, `description` y `robots`.
- **OBLIGATORIO**: actualizar `lastUpdated` en los documentos si cambian.
- **OBLIGATORIO**: los 3 documentos legales declaran transferencia internacional de datos (Vercel, Supabase, Cloudinary, Resend en EE.UU.).

### Prohibiciones

- **PROHIBIDO**: publicar cambios en documentos legales sin revisión de abogado.
- **PROHIBIDO**: permitir registro sin aceptar términos (checkbox + validación servidor).
- **PROHIBIDO**: implementar Política de Cookies ni banner de cookies (fase posterior).

### Pendientes

- ⏳ Revisión por abogado antes del lanzamiento público.
- ⏳ Política de Cookies (fase posterior).
- ⏳ Banner de cookies (si se añaden analytics).
- ⏳ Aviso legal (si se opera en España).
