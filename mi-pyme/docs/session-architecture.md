# Arquitectura de autenticación y sesiones — Mi-Pyme

Este documento describe el comportamiento implementado y comprobable de las
sesiones. La estrategia sigue siendo JWT; no se usan sesiones persistidas en
base de datos para autenticar.

## Configuración

| Aspecto | Comportamiento |
|---|---|
| Estrategia | JWT de Auth.js, cifrado por defecto |
| Duración efectiva sin “Recordarme” | 24 horas desde el inicio de sesión |
| Duración efectiva con “Recordarme” | 30 días desde el inicio de sesión |
| Cookie de sesión | Auth.js conserva su cookie segura hasta el máximo configurado de 30 días; el JWT cifrado lleva su propia expiración absoluta (24 horas o 30 días) y no puede renovarla |
| `session.updateAge` | Configurado a 1 hora; Auth.js solo lo usa para renovar sesiones de base de datos. No extiende ni renueva estos JWT |
| Cookies | Valores predeterminados de Auth.js: `httpOnly`, `sameSite=lax`, `secure` cuando la URL usa HTTPS |
| Timeout por inactividad | No implementado. La expiración es absoluta, no deslizante |
| Secreto | `NEXTAUTH_SECRET` se valida durante la configuración/build de producción |
| URL de acceso y salida | `/auth/login` |

`session.maxAge` y `jwt.maxAge` permanecen en 30 días para que Auth.js no
trunque los JWT con “Recordarme”. `encodeSessionToken` calcula el tiempo
restante a partir de `sessionExpiresAt`, de modo que Auth.js no reescribe la
expiración individual a 30 días cuando actualiza la cookie.

## Estados de sesión

| Estado | Acceso y respuesta |
|---|---|
| **A — Anónimo** | Home, catálogo, servicios, rutas legales y auth son públicas. Cualquier otra ruta de página requiere sesión y redirige a `/auth/login?callbackUrl=...`. |
| **B — Autenticado** | El home muestra el dashboard correspondiente; el navbar muestra controles de usuario. Las rutas de dashboard aplican sus restricciones de rol y propiedad. |
| **C — Recordarme** | El JWT expira 30 días después del login. La cookie es persistente; al cerrar el navegador no se pierde la sesión por una cookie de tipo sesión. |
| **D — Expirado** | Auth.js rechaza el JWT vencido; rutas protegidas redirigen al login y preservan ruta y query en `callbackUrl`. |
| **E — Invalidado por cambio de cuenta** | `sessionVersion` diferente o usuario inexistente/inactivo invalida la sesión al consultar Auth.js. El callback de sesión falla cerrado si la base de datos no está disponible. |
| **F — Suspendido o eliminado** | Login rechazado con el mismo resultado externo que credenciales inválidas. Las sesiones existentes dejan de ser válidas al siguiente acceso/consulta de sesión. |
| **G — Cambio de contraseña obligatorio** | Middleware fuerza `/perfil/cambiar-password`; deja pasar auth, assets y esa página. Tras cambiar la contraseña se incrementa `sessionVersion` y se vuelve a iniciar sesión. |
| **H — Bloqueo temporal** | Cinco contraseñas incorrectas consecutivas bloquean la cuenta durante 15 minutos. El contador y bloqueo se reinician al vencer el plazo o tras login correcto. |
| **I — Varias pestañas** | Comparten cookie y Auth.js difunde el evento de salida entre pestañas; una petición posterior a una ruta protegida redirige al login. |
| **J — Varios dispositivos** | Cada dispositivo conserva su JWT; el incremento de `sessionVersion` invalida los demás en su siguiente consulta autenticada. |

No existe actualmente una comprobación de sesión cada segundo ni una señal
push de invalidación. El cierre remoto se hace efectivo en la siguiente
petición o consulta de sesión, no de forma instantánea mientras un dispositivo
permanezca inactivo.

## Política de login

`credentialsAuthorize` normaliza el identificador, exige usuario activo y no
eliminado, y compara la contraseña con bcrypt. Una contraseña incorrecta
incrementa `failedLoginAttempts` de forma atómica; el quinto fallo establece
`lockedUntil` a 15 minutos. Los logins bloqueados, usuarios inexistentes,
cuentas inactivas/eliminadas y contraseñas incorrectas devuelven `null`, que
el formulario presenta como credenciales inválidas. Los motivos de bloqueo se
registran internamente; no se exponen al usuario.

El login correcto reinicia los intentos, elimina el bloqueo y actualiza
`lastLoginAt`. `mustChangePassword` se propaga al JWT para que el middleware
restrinja navegación.

## Home y redirecciones

El home (`/`) siempre permanece accesible. Para visitantes ofrece “Comenzar
gratis” y “Explorar catálogo”; para usuarios autenticados ofrece su dashboard
según rol y el catálogo. El navbar global cambia de enlaces de acceso a avatar,
notificaciones y logout.

Las rutas no públicas redirigen a `/auth/login` conservando ruta y query en
`callbackUrl`. Al completar el login, la URL de retorno se limita al mismo
origen para evitar redirecciones externas.

Roles:

| Ruta | Acceso aplicado |
|---|---|
| `/cliente` | CLIENTE, ADMIN |
| `/negocio` | NEGOCIO, ADMIN y CLIENTE propietario de negocio |
| `/logistica` | LOGISTICA, ADMIN |
| `/admin` | ADMIN |
| Resto de páginas privadas | Requiere sesión; autorización adicional en layouts, páginas o handlers según el recurso |
| `/api/*` | El middleware no concede autorización por listar la ruta como pública; cada endpoint conserva su propia comprobación de sesión/rol |

Las denegaciones de rol conservan el destino de dashboard definido para el
usuario. No se convierte la lista de rutas en sustituto de las comprobaciones
de autorización de cada acción o API.

## Invalidación

`sessionVersion` se incrementa en cambios de contraseña, rol, suspensión y
eliminación de cuenta. La validación comprueba versión, `isActive` y
`deletedAt`. El cambio de versión revoca todos los JWT del usuario en la
siguiente consulta autenticada.

El callback de sesión no devuelve una sesión válida si falla la consulta de
estado en base de datos: registra el error y falla cerrado.

## Logout

`LogoutButton` primero usa `signOut` de Auth.js (incluida la difusión a otras
pestañas) y después llama por POST al endpoint de limpieza, que elimina cookies
Auth.js actuales y nombres heredados de NextAuth. El endpoint no ofrece GET,
para que una navegación GET no pueda cerrar la sesión.

## Pruebas

- `src/tests/auth-session-lifetime.test.ts`: vencimiento JWT a 24 h y 30 días.
- `src/tests/auth-login-lockout.test.ts`: bloqueo, reset tras éxito y
  recuperación tras vencimiento.
- `src/tests/safe-callback-url.test.ts`: callback same-origin y rechazo de
  destinos externos.
- `src/tests/architecture-session.test.ts`: guardas de configuración,
  redirección y cookies.
- `e2e/session-route-guard.test.ts`: redirección a login de páginas privadas
  anónimas, preservación de query string, duración de cookie persistente y
  limpieza del logout entre pestañas.
- `tests/session-all-states.e2e.test.mjs`: cobertura E2E preexistente de flujos
  adicionales; no forma parte del `testDir` `e2e` del Playwright configurado.

## Archivos principales

- `src/lib/auth/auth.config.ts`: configuración de Auth.js, callbacks y evento
  de salida.
- `src/lib/auth/session-token.ts`: límites absolutos y codificación JWT.
- `src/lib/auth/credentials-authorize.ts`: verificación de credenciales,
  bloqueo temporal y actualización de último login.
- `src/middleware.ts`: control de sesión, rutas, rol y cambio obligatorio de
  contraseña.
- `src/app/api/auth/logout/route.ts`: limpieza de cookies heredadas.
- `src/components/LogoutButton.tsx`: salida desde navbar y dashboards.
