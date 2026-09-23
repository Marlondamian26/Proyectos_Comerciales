@AGENTS.md

# Normas de Calidad (Fase 2, Punto 7)

- Verificar que `new Date` siempre lleve paréntesis `()`. Verificar typos en
  nombres de campos de interfaces antes de commitear.
- Las interfaces públicas (`*Params`, `*DTO`) deben revisarse ortográficamente.
- Usar plural para arrays, singular para entidades individuales.
- Ejecutar `npx tsc --noEmit` y `npm test` antes de commitear.

# Reglas de Arquitectura (Fase 2, Punto 8)

## Framework-agnostic

- **Los servicios en `src/services/` NO deben importar Next.js.** Verificado por
  `src/tests/architecture.test.ts`.
- **Los servicios NO deben importar `@nestjs/*`.** La migración a Nest.js es
  Fase 4; no se añade código preparativo ahora.
- Si un servicio necesita funcionalidad de Next.js (p.ej. headers, cookies),
  **inyección de dependencia** — el servicio recibe un callback/interfaz, no
  importa Next.js directamente.

## Migración a Nest.js (Fase 4)

- `nest-compat.ts` y `ServiceRegistry.ts` **no existen actualmente**. Ver
  `SERVICE_ARCHITECTURE.md` → "Migración a Nest.js (Fase 4)".
- Si se añade un servicio nuevo, no se prepara para Nest.js (no hay providers,
  tokens, ni nest-compat). La migración se implementará en Fase 4.
- `InMemoryEventBus` existe como scaffolding — no se usa activamente. No
  eliminar sin revisar.

# Reglas de Autenticación y Seguridad (Etapa 5)

> **Fuente de verdad**: estas reglas están verificadas automáticamente por
> `src/tests/architecture-auth.test.ts`. Si un test falla, se corrige el código,
> no el test. Si el test es demasiado estricto (falso positivo), se refina el
> regex — nunca se elimina ni se relaja la regla.

## Prohibiciones

- **PROHIBIDO** permitir selección de rol distinto de `CLIENTE` en el registro público.
  - La única vía para obtener rol `NEGOCIO` es la solicitud de alta + aprobación del admin (Fase 1, Punto 3).
  - La única vía para obtener rol `ADMIN` o `LOGISTICA` es asignación por un admin existente.

- **PROHIBIDO** crear endpoints que otorguen roles sin aprobación explícita del admin.

- **PROHIBIDO** guardar tokens de reset, verificación o cualquier credencial temporal en texto plano.
  - Siempre hashear antes de almacenar (SHA-256 para tokens de alta entropía).

- **PROHIBIDO** transportar tokens en query strings (`?token=...`) en endpoints que validan o consumen el token.
  - Los tokens van en POST body o headers.

- **PROHIBIDO** loggear passwords, tokens, secrets ni `NEXTAUTH_SECRET` en consola, archivos o servicios de logging.

- **PROHIBIDO** omitir validación de propiedad del recurso en mutaciones.
  - Toda mutación que afecta a un recurso debe validar que el usuario sea dueño o tenga permiso (usar `assertPertenencia` de `src/services/utils/permisos.ts`).

- **PROHIBIDO** permitir login a usuarios con `isActive: false` o sin verificar `mustChangePassword`.

- **PROHIBIDO** implementar endpoints `/api/admin/*` sin validación de rol `ADMIN`.

## Obligaciones

- **OBLIGATORIO** añadir rate limiting a endpoints públicos de auth (login, registro, recuperación).
  - Estado actual: pendiente (Fase 3). Si se añade un endpoint público de auth, incluir rate limiting o marcar `[TODO Fase 3]` explícito.

- **OBLIGATORIO** registrar eventos de auth en `AuditLog`:
  - `LOGIN_EXITOSO`, `LOGIN_FALLIDO`, `LOGOUT`, `REGISTRO_USUARIO`, `PASSWORD_RESET_SOLICITADO`, `PASSWORD_RESET_COMPLETADO`, `PASSWORD_CAMBIADO`, `ROL_CAMBIADO`.

- **OBLIGATORIO** incrementar `sessionVersion` al cambiar password, rol o estado de cuenta.

- **OBLIGATORIO** usar la política de contraseña centralizada (`validarPassword` de `src/lib/auth/password-policy.ts`).

- **OBLIGATORIO** usar bcrypt con 12 rounds (constante `BCRYPT_ROUNDS` en `src/lib/auth/constants.ts`).

- **OBLIGATORIO** normalizar emails y usernames a lowercase antes de guardar o buscar.

- **OBLIGATORIO** que los tests de auth cubran casos de escalada de privilegios y acceso no autorizado.

## Convenciones

- Toda lógica de auth vive en `src/lib/auth/` (framework-agnostic donde sea posible).
- Los helpers de auth (`token-hash`, `password-policy`, `constants`) **no** importan Next.js.
- Los eventos de auditoría usan el helper `logAudit` de `src/services/utils/audit.ts`.
- Los mensajes de error de login son genéricos (anti-enumeración): "Credenciales inválidas" para todos los casos.

## Pendientes conocidos (Fase 3/4)

- ⏳ Rate limiting (login, registro, recuperación).
- ⏳ Lockout por intentos fallidos (`failedLoginAttempts`, `lockedUntil` — campos ya en schema).
- ⏳ 2FA para admin.
- ⏳ Verificación de email real (requiere proveedor SMTP).
- ⏳ Multi-rol (N:N) — workaround actual: dueño de negocio accede a `/negocio` sin importar su rol.
- ⏳ Structured logging (winston/pino).
- ⏳ Logout revocation server-side (base: `sessionVersion`).

Cada uno con `TODO` en el código correspondiente y referencia en `SERVICE_ARCHITECTURE.md`.

---

## Checklist antes de commitear

1. `npm run test` — todos los tests pasan.
2. `npx tsc --noEmit` — sin errores de tipo.
3. `npm run lint` — sin errores de lint.
