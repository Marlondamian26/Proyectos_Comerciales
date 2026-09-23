# Service Architecture

## Capa de autenticación

### Estrategia de sesión
- **JWT** (NextAuth v5.0.0-beta.32, Credentials provider)
- `maxAge` global: 30 días
- Sin `rememberMe`: sesión expira en 24h (JWT `exp` override)
- Con `rememberMe`: sesión expira en 30 días
- `updateAge: 1h` — el `session` callback valida `sessionVersion` contra BD cada hora

### Roles
Enum único en `schema.prisma`:
- `ADMIN` — acceso completo al panel
- `CLIENTE` — rol de cliente/consumidor
- `NEGOCIO` — negocio/propietario
- `LOGISTICA` — logística/proveedor

**Workaround C8 (Etapa 3, B7):** un usuario con rol `CLIENTE` que es dueño de un
`Negocio` (`Negocio.userId === user.id`) puede acceder a rutas `/negocio`.
Esto permite que un cliente que vende no pierda el acceso a la vista de cliente.
Multi-rol real diferido a **Fase 4**.

### Flujo de login
1. Credentials provider llama `credentialsAuthorize()` en `src/lib/auth/credentials-authorize.ts`
2. Se normaliza el identifier (email/username) a lowercase
3. Query busca por `email` o `username` con `isActive: true`
4. Comparación de password con bcrypt (12 rounds)
5. Si `isActive: false` → login falla con "Credenciales inválidas" (anti-enumeración)
6. Si `mustChangePassword: true` → login permitido pero session marcada
7. Eventos de auditoría: `LOGIN_EXITOSO`, `LOGIN_FALLIDO`, `LOGIN_FALLIDO_USUARIO_INACTIVO`

### Flujo de registro
- `/api/auth/registro` — siempre crea `CLIENTE` (forzado server-side)
- El campo `rol` en el body es ignorado (backward compatibility)
- Para ser NEGOCIO: solicitud via `/negocios/solicitar` + aprobación (Fase 1, Punto 3)
- Email y username normalizados a lowercase
- Política de contraseña: 10+ chars, letra, número, lista negra
- bcrypt 12 rounds
- Evento: `REGISTRO_USUARIO`

### Flujo de reset de contraseña
1. `/api/auth/recuperar` — genera token UUID (1h expiración, single-use)
2. Token **hasheado con SHA-256** antes de guardarlo en `VerificationToken`
3. Token plano retornado en la respuesta (dev) o enviado por email (prod)
4. `/auth/resetear/[token]` — página valida token via `POST /api/auth/resetear/validar`
5. `/api/auth/resetear` — consume token (POST con token en body), actualiza password, incrementa `sessionVersion`
6. `Referrer-Policy: no-referrer` en headers de `/auth/resetear/*`
7. Evento: `PASSWORD_RESET_SOLICITADO`, `PASSWORD_RESET_COMPLETADO`
8. **Nunca** se loggea el token ni URL de reset

### Invalidación de sesiones (sessionVersion)
- `sessionVersion` en `User` (schema: `@default(0)`)
- Al login: `credentialsAuthorize` devuelve `sessionVersion`
- `jwt` callback: incluye `sessionVersion` en el token
- `session` callback: valida `token.sessionVersion` contra BD; si difiere, invalida sesión
- Ventana de gracia: hasta 1h (hasta el próximo `updateAge`)
- `sessionVersion` se incrementa al: cambiar password, cambiar rol, eliminar cuenta
- Evento: `SESSION_INVALIDATED`

### Política de contraseña
- Archivo: `src/lib/auth/password-policy.ts`
- Mínimo 10 caracteres
- Al menos una letra y un número
- Lista negra de ~50 contraseñas comunes
- Aplicado en: registro, reset, cambio de password
- UI muestra requisitos en vivo (`aria-describedby`)

### bcrypt
- `BCRYPT_ROUNDS = 12` (constante en `src/lib/auth/constants.ts`)
- Aplicado en: registro, reset, cambio de password, test endpoints
- Passwords existentes con 10 rounds siguen funcionando (bcrypt compara entre rounds)
- Al próximo cambio, se re-hashean con 12 rounds

### Eventos de auditoría de auth
| Evento | Trigger |
|--------|---------|
| `LOGIN_EXITOSO` | Login exitoso |
| `LOGIN_FALLIDO` | Credenciales inválidas / usuario no existe |
| `LOGIN_FALLIDO_USUARIO_INACTIVO` | Usuario con `isActive: false` |
| `LOGOUT` | Cierre de sesión |
| `REGISTRO_USUARIO` | Registro exitoso |
| `PASSWORD_RESET_SOLICITADO` | Solicitud de reset |
| `PASSWORD_RESET_COMPLETADO` | Reset completado |
| `PASSWORD_CAMBIADO` | Cambio de password via API |
| `PASSWORD_CAMBIADO_OBLIGATORIO` | Password cambiada con `mustChangePassword: true` |
| `ROL_CAMBIADO` | Asignación de rol ADMIN |
| `ROL_MIGRADO_AUTOREGISTRO` | Migración B1 (degradado NEGOCIO → CLIENTE) |
| `SESSION_INVALIDATED` | sessionVersion mismatch |

### Validación de NEXTAUTH_SECRET
- `src/lib/auth/validate-env.ts` — `validateAuthEnv()`
- Llamado en `next.config.ts` (top-level)
- Producción: throw si secret es default, missing, o <32 chars
- Desarrollo: console.warn

### Pendientes (Fase 3/4)
- [TODO Fase 3] Rate limiting en endpoints sensibles (login, recuperar, resetear)
- [TODO Fase 3] Logging de intentos fallidos con contador (`failedLoginAttempts`/`lockedUntil`)
- [TODO Fase 4] 2FA (TOTF)
- [TODO Fase 4] Email verification
- [TODO Fase 4] Multi-rol real (cliente-que-vende con múltiples sesiones de rol)
