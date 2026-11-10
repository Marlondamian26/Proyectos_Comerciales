# Arquitectura de Sesiones — Mi-Pyme

Fuente única de verdad para el manejo de sesiones, autenticación e invalidación.

---

## 1. Estrategia de sesión

| Aspecto | Decisión | Valor | Archivo |
|---|---|---|---|
| Estrategia | JWT | Stateless, serverless-friendly | auth.config.ts:63 |
| Duración por defecto | 24 horas | `session.maxAge` | auth.config.ts:64 |
| Duración con "Recordarme" | 30 días | JWT `exp` extendido | auth.config.ts:104-106 |
| Refresh (updateAge) | 1 hora | `session.updateAge` | auth.config.ts:65 |
| Cookie `httpOnly` | true | Previene XSS | Default NextAuth |
| Cookie `secure` | true (producción) | Solo HTTPS | Default NextAuth |
| Cookie `sameSite` | lax | Balance CSRF/navegación | Default NextAuth |
| Cookie name | `next-auth.session-token` | Default NextAuth | — |
| `NEXTAUTH_SECRET` | Obligatorio | Validado en build | validateAuthEnv() |

---

## 2. Matriz de estados de sesión

### Estado A — Anónimo (no logueado)

| Contexto | Comportamiento esperado |
|---|---|
| Home `/` | Accesible, navbar con "Iniciar sesión" / "Registrarse" |
| Catálogo `/catalogo` | Accesible |
| Servicios `/servicios` | Accesible |
| Combos `/combos` | Accesible |
| Transporte `/transporte` | Accesible |
| Agregar al carrito | Redirige a `/auth/login?callbackUrl=...` |
| Reservar | Redirige a `/auth/login?callbackUrl=...` |
| `/cliente` | Redirige a `/auth/login?callbackUrl=/cliente` |
| `/negocio` | Redirige a `/auth/login?callbackUrl=/negocio` |
| `/logistica` | Redirige a `/auth/login?callbackUrl=/logistica` |
| `/admin` | Redirige a `/auth/login?callbackUrl=/admin` |
| `/perfil` | Redirige a `/auth/login?callbackUrl=/perfil` |
| `/carrito` | Redirige a `/auth/login?callbackUrl=/carrito` |
| `/checkout` | Redirige a `/auth/login?callbackUrl=/checkout` |
| `/notificaciones` | Redirige a `/auth/login?callbackUrl=/notificaciones` |
| Logout (sin sesión) | Redirige a `/auth/login` |

### Estado B — Logueado (sesión por defecto, 24h)

| Contexto | Comportamiento esperado |
|---|---|
| Home `/` | Navbar con avatar, notificaciones, "Cerrar sesión" |
| Catálogo | Botón "Agregar al carrito" funcional |
| `/cliente` (rol CLIENTE) | Accesible |
| `/cliente` (rol NEGOCIO) | Redirige a `/negocio` |
| `/negocio` (rol NEGOCIO) | Accesible |
| `/negocio` (rol CLIENTE) | Redirige a `/cliente` |
| `/logistica` (rol LOGISTICA) | Accesible |
| `/admin` (rol ADMIN) | Accesible |
| Logout | Redirige a `/auth/login`, cookies eliminadas |
| Cambio de password | `sessionVersion` incrementado, redirige a login |
| Cambio de rol (por admin) | `sessionVersion` incrementado, próximo request falla |
| Suspensión (por admin) | `isActive: false`, `sessionVersion` incrementado, próximo request falla |

### Estado C — Logueado con "Recordarme" (30 días)

| Contexto | Comportamiento esperado |
|---|---|
| Todo lo de Estado B | Igual |
| Cerrar navegador y reabrir | Sesión persiste (cookie JWT con exp 30 días) |
| Cookie `maxAge` | 30 días |
| Cookie `exp` | `Date.now() + 30 * 24 * 60 * 60` |

### Estado D — Sesión expirada

| Contexto | Comportamiento esperado |
|---|---|
| Acceso a ruta protegida | Redirige a `/auth/login?callbackUrl=...` |
| Acceso a home | Se ve como anónimo |
| Acción que requiere sesión | Redirige a login |

### Estado E — Sesión invalidada por `sessionVersion`

| Contexto | Comportamiento esperado |
|---|---|
| Próximo request a ruta protegida | Redirige a `/auth/login` |
| Próximo request a API | 401 Unauthorized |
| Sesión en otro dispositivo | También invalidada |
| Causas | Cambio de password, cambio de rol, suspensión, eliminación |

### Estado F — Cuenta suspendida (`isActive: false`)

| Contexto | Comportamiento esperado |
|---|---|
| Login | Falla con "Credenciales inválidas" (anti-enumeración) |
| Sesión existente | Invalidada en próximo request (callbacks.session) |
| Acceso a home | Accesible como anónimo |

### Estado G — Cuenta con `mustChangePassword: true`

| Contexto | Comportamiento esperado |
|---|---|
| Login | Permite entrar, redirige a `/perfil/cambiar-password` |
| Navegación | Solo permite `/perfil/cambiar-password`, logout y assets |
| Tras cambiar password | `mustChangePassword: false`, redirige a login |
| Acceso a otras rutas | Redirige a `/perfil/cambiar-password` (middleware) |

### Estado H — Cuenta bloqueada (`lockedUntil > now`)

| Contexto | Comportamiento esperado |
|---|---|
| Login | Falla con "Credenciales inválidas" (anti-enumeración) |
| Bloqueo tras | 5 intentos fallidos consecutivos |
| Duración del bloqueo | 15 minutos |
| Desbloqueo | Automático tras `lockedUntil` |

### Estado I — Multi-tab (misma sesión)

| Contexto | Comportamiento esperado |
|---|---|
| Login en pestaña A | Pestaña B detecta sesión (comparten cookies) |
| Logout en pestaña A | Pestaña B detecta y redirige a login en próximo request |
| Cambio de password en pestaña A | Pestaña B detecta `sessionVersion` mismatch y redirige a login |

### Estado J — Multi-dispositivo

| Contexto | Comportamiento esperado |
|---|---|
| Login en dispositivo A | Dispositivo B mantiene sesión independiente (JWT propio) |
| Cambio de password en A | Dispositivo B pierde sesión (vía `sessionVersion`) |
| Cambio de rol en admin | Todos los dispositivos del usuario pierden sesión |
| Suspensión | Todos los dispositivos pierden sesión |

---

## 3. Invalidación de sesión

| Evento | Acción | Archivo |
|---|---|---|
| Cambio de password | `sessionVersion` incrementado + `mustChangePassword: false` | actions.ts:2300 |
| Cambio de rol (admin) | `sessionVersion` incrementado | actions.ts:1831, 2541 |
| Suspensión de cuenta | `isActive: false` + `sessionVersion` incrementado | actions.ts:2438 |
| Eliminación de cuenta | `deletedAt` + `sessionVersion` incrementado | actions.ts:2438 |
| Password reset | `sessionVersion` incrementado | api/auth/resetear/route.ts:38 |
| Logout | Cookies eliminadas + `signOut()` | LogoutButton.tsx, api/auth/logout/route.ts |

Validación en cada refresh del JWT (`trigger === "update"`):
- `sessionVersion` comparado contra BD
- `isActive` verificado contra BD

---

## 4. Comportamiento del home

El home `/` es **siempre accesible** (logueado o no):

| Estado | Contenido del hero |
|---|---|
| Anónimo | "Comenzar gratis" + "Explorar catálogo" |
| Logueado | Botón "Ir a mi dashboard" (según rol) |

El Navbar se adapta:
- Sin sesión: "Iniciar sesión" / "Registrarse"
- Con sesión: Avatar + notificaciones + "Cerrar sesión"

---

## 5. Multi-tab y multi-dispositivo

- **Multi-tab**: Comparten cookies del navegador. `useSession` reacciona a cambios en todas las pestañas.
- **Multi-dispositivo**: Cada dispositivo tiene su propio JWT. La invalidación vía `sessionVersion` afecta a todos al siguiente refresh de token.

---

## 6. Redirecciones y `callbackUrl`

| Origen | Destino | `callbackUrl` |
|---|---|---|
| Acceso a ruta protegida sin sesión | `/auth/login` | `callbackUrl=<ruta_original>` |
| Login exitoso | `/cliente` (o `/negocio`, `/admin`, `/logistica`) | Seguir `callbackUrl` si existe |
| Logout | `/auth/login` | — |
| `mustChangePassword: true` | `/perfil/cambiar-password` | — |
| Tras cambiar password | `/auth/login` | — |

---

## 7. Reglas de implementación (obligatorias)

1. **`sessionVersion` es la fuente de verdad** para invalidación. Incrementar en: password, rol, suspensión, eliminación.
2. **Validar `sessionVersion` en `callbacks.jwt`** con `trigger === "update"`.
3. **Validar `isActive` en `callbacks.jwt`** con `trigger === "update"`.
4. **`callbackUrl` siempre preservado** en redirecciones a login.
5. **Anti-enumeración**: mismo mensaje para usuario inexistente, password incorrecta, cuenta inactiva y cuenta bloqueada.
6. **Tipado estricto**: sin `any`.
7. **Tests que fallen si el bug vuelve.**

---

## 8. Archivos involucrados

| Archivo | Responsabilidad |
|---|---|
| `src/lib/auth/auth.config.ts` | Configuración NextAuth: JWT, callbacks, eventos |
| `src/lib/auth/credentials-authorize.ts` | Lógica de authorize: bcrypt, isActive, bloqueo |
| `src/lib/auth/requireRole.ts` | Helper de autorización por rol |
| `src/lib/auth/dashboard-paths.ts` | Redirección por rol post-login |
| `src/lib/auth/actualizar-last-login.ts` | Actualiza lastLoginAt |
| `src/middleware.ts` | Protección de rutas por rol y contexto |
| `src/app/api/auth/logout/route.ts` | Eliminación de cookies en logout |
| `src/components/LogoutButton.tsx` | Botón de logout cliente |
| `src/components/Navbar.tsx` | Navbar con `useSession` |
| `src/app/layout.tsx` | `<SessionProvider>` envuelve todo |
| `src/app/page.tsx` | Home adaptativo (logueado vs anónimo) |
| `docs/session-architecture.md` | Este documento |
