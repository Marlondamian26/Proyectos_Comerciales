# Política de Administrador Genérico

## Resumen

Este documento describe la implementación y políticas para la gestión del administrador genérico en la plataforma Mi Pyme. El objetivo es garantizar que siempre exista al menos un administrador activo en el sistema, proporcionando un mecanismo de respaldo seguro y auditable.

## Características Principales

### 1. Creación Automática del Admin Genérico
- **Cuándo**: Al primer despliegue o cuando no hay administradores activos
- **Credenciales por defecto**:
  - Email: `admin@mi-pyme.local` (configurable via `GENERIC_ADMIN_EMAIL`)
  - Contraseña: `12345678` (configurable via `GENERIC_ADMIN_PASSWORD`, **debe cambiarse en producción**)
  - Usuario: `admin`
  - Nombre: "Administrador Genérico"
- **Banderas**:
  - `isGenericAdmin: true`
  - `mustChangePassword: true` (fuerza cambio en primer login)

### 2. Desactivación al Crear Nuevo Admin
Cuando un administrador existente crea/eleva a otro usuario a rol ADMIN:
- El admin genérico se desactiva (`isActive: false`, `isGenericAdmin: false`)
- Se mantiene el registro para auditoría
- Evento de auditoría: `GENERIC_ADMIN_DEACTIVATED_BY_ADMIN`

### 3. Reaparición Automática
Si la plataforma se queda sin administradores activos:
- Se reactiva el admin genérico existente o se crea uno nuevo
- Se restablece `mustChangePassword: true`
- Evento de auditoría: `GENERIC_ADMIN_RECREATED` o `GENERIC_ADMIN_CREATED`

### 4. Eliminación del Último Admin (Doble Confirmación)
Cuando el único administrador intenta eliminar su cuenta:
- Requiere **dos contraseñas**:
  1. Su contraseña de administrador actual
  2. La contraseña genérica del sistema (`12345678` por defecto)
- Solo si ambas son correctas, se elimina la cuenta
- Se crea/reactiva automáticamente el admin genérico
- Evento de auditoría: `LAST_ADMIN_DELETED_BY_SELF`

### 5. Eliminación de Cuenta para Otros Roles
Todos los usuarios (CLIENTE, NEGOCIO, LOGISTICA, ADMIN) pueden eliminar su cuenta desde "Mi Perfil":
- Confirmación con contraseña propia
- Soft delete: `isActive: false`, `deletedAt`, `deletedBy`, `deletedReason`
- Invalidación de sesiones activas
- Evento de auditoría: `ACCOUNT_DELETED`

## Arquitectura Técnica

### Esquema de Base de Datos (Prisma)

```prisma
model User {
  id                    String       @id @default(cuid())
  email                 String       @unique
  password              String?
  nombre                String?
  rol                   Rol          @default(CLIENTE)
  isGenericAdmin        Boolean      @default(false)
  mustChangePassword    Boolean      @default(false)
  isActive              Boolean      @default(true)
  lastLoginAt           DateTime?
  failedLoginAttempts   Int          @default(0)
  lockedUntil           DateTime?
  sessionVersion        Int          @default(0)
  deletedAt             DateTime?
  deletedBy             String?
  deletedReason         String?
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt
  
  @@index([rol])
  @@index([isGenericAdmin])
  @@index([isActive])
  @@index([lockedUntil])
}

model AuditLog {
  id        String   @id @default(cuid())
  eventType String
  actorId   String?
  targetId  String?
  timestamp DateTime @default(now())
  meta      Json?
  user      User?    @relation(fields: [actorId], references: [id])
  
  @@index([eventType])
  @@index([actorId])
  @@index([targetId])
  @@index([timestamp])
}
```

### Endpoints API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/admin/create-generic-if-none` | POST | Crea admin genérico si no hay admins activos |
| `/api/admin/assign-role` | POST | Asigna rol ADMIN a usuario (desactiva genérico) |
| `/api/users/delete` | DELETE | Elimina cuenta (normal o último admin) |

### Server Actions

- `eliminarCuenta(usuarioId, { password })` - Eliminación normal
- `eliminarUltimoAdmin(usuarioId, { adminPassword, genericAdminPassword })` - Último admin
- `asignarRolAdmin(usuarioId, actorId)` - Asignar rol ADMIN
- `ensureGenericAdminExists(actorId?)` - Garantizar existencia de admin genérico
- `deactivateGenericAdmin(actorId)` - Desactivar admin genérico

### Eventos de Auditoría

| Evento | Descripción |
|--------|-------------|
| `GENERIC_ADMIN_CREATED` | Creación inicial del admin genérico |
| `GENERIC_ADMIN_DEACTIVATED_BY_ADMIN` | Desactivación al crear nuevo admin |
| `GENERIC_ADMIN_RECREATED` | Reaparición automática |
| `LAST_ADMIN_DELETED_BY_SELF` | Eliminación de último admin con doble confirmación |
| `ACCOUNT_DELETED` | Eliminación de cuenta estándar |
| `FAILED_DELETE_ATTEMPT` | Intento fallido de eliminación |
| `LOGIN_EXITOSO` | Login exitoso (incluye `rememberMe` en meta) |
| `LOGIN_FALLIDO` | Credenciales inválidas (usuario no existe o password incorrecto) |
| `LOGIN_FALLIDO_USUARIO_INACTIVO` | Login fallido para usuario con `isActive: false` |
| `PASSWORD_CAMBIADO_OBLIGATORIO` | Password cambiada por usuario con `mustChangePassword: true` |
| `PASSWORD_CAMBIADO` | Password cambiada voluntariamente vía `/api/perfil` |
| `PASSWORD_RESET_SOLICITADO` | Solicitud de recuperación de contraseña |
| `PASSWORD_RESET_COMPLETADO` | Contraseña restablecida exitosamente |
| `REGISTRO_USUARIO` | Nuevo usuario registrado vía `/api/auth/registro` |
| `ROL_CAMBIADO` | Asignación de rol ADMIN a usuario |
| `LOGOUT` | Cierre de sesión del usuario |

## Configuración de Producción

### Variables de Entorno Requeridas

```env
# .env.production
GENERIC_ADMIN_EMAIL="admin@tu-dominio.com"
GENERIC_ADMIN_PASSWORD="contraseña-segura-generada-aleatoriamente"
DATABASE_URL="file:../data/mipyme.db"
NEXTAUTH_SECRET="clave-secreta-larga-y-aleatoria"
NEXTAUTH_URL="https://tu-dominio.com"
```

### Rotación de Contraseña Genérica

1. Generar contraseña segura: `openssl rand -base64 32`
2. Actualizar `GENERIC_ADMIN_PASSWORD` en variables de entorno
3. Reiniciar la aplicación
4. El admin genérico se recreará con la nueva contraseña en el próximo arranque sin admins
5. **Importante**: Documentar la nueva contraseña en gestor de contraseñas seguro

### Checklist de Despliegue

- [ ] Cambiar `GENERIC_ADMIN_PASSWORD` por valor seguro
- [ ] Configurar `GENERIC_ADMIN_EMAIL` con dominio real
- [ ] Verificar que registro público no permite rol ADMIN
- [ ] Probar flujo: despliegue → login genérico → cambio contraseña → crear admin real → verificar desactivación genérico
- [ ] Probar eliminación de último admin con doble confirmación
- [ ] Verificar logs de auditoría en base de datos
- [ ] Configurar alertas para eventos `GENERIC_ADMIN_CREATED` y `LAST_ADMIN_DELETED_BY_SELF`
- [ ] Verificar que `NEXTAUTH_SECRET` es ≥32 caracteres (build falla si no)
- [ ] Verificar que usuarios inactivos no pueden loguearse

## Flujos de Usuario

### Flujo 1: Primer Despliegue
```
Despliegue → Seed ejecuta → Admin genérico creado → Login con 12345678 → 
Forzado cambio contraseña → Panel admin disponible
```

### Flujo 2: Crear Admin Real
```
Admin genérico logueado → Panel Admin → Crear/asignar admin → 
Admin genérico desactivado → Nuevo admin activo
```

### Flujo 3: Quedarse Sin Admins
```
Último admin eliminado/desactivado → Verificación countAdmins=0 → 
Admin genérico reactivado/creado → mustChangePassword=true
```

### Flujo 4: Eliminar Último Admin
```
Último admin → Mi Perfil → Eliminar cuenta → Modal doble contraseña → 
Ingresa admin pass + genérica pass → Cuenta eliminada → Genérico recreado
```

### Flujo 5: Usuario Normal Elimina Cuenta
```
Usuario → Mi Perfil → Eliminar cuenta → Modal contraseña → 
Ingresa su contraseña → Cuenta desactivada (soft delete)
```

## Seguridad

### Estado actual de seguridad

- ✅ **Implementado**: bcrypt 12 rounds (uniforme en todos los endpoints de password),
  `isActive` bloquea login, `mustChangePassword` fuerza cambio, `NEXTAUTH_SECRET`
  validado, auditoría de eventos (login, reset, cambio password, rol, eliminación),
  `sessionVersion` invalida JWT tras cambio de password/rol, password policy fuerte
  (10+ chars, letra, número, lista negra), token de reset hasheado con SHA-256.
- ⏳ **Pendiente (Fase 3/4)**: rate limiting, lockout con lógica, 2FA, email
  verification, multi-rol real.

### Medidas Implementadas
- **bcrypt 12 rounds** para todas las contraseñas de usuarios (registro, reset,
  cambio de password). Passwords existentes con 10 rounds siguen funcionando;
  al próximo cambio se re-hashean a 12.
- **isActive filter**: usuarios con `isActive: false` no pueden loguearse
- **mustChangePassword enforcement**: admin genérico forzado a cambiar contraseña
- **Middleware**: navegación restringida durante mustChangePassword
- **Política de contraseña**: 10 caracteres mínimo + al menos una letra + al menos
  un número + lista negra de contraseñas comunes
- **Token de reset hasheado**: SHA-256 (no bcrypt) + `timingSafeEqual` para
  prevenir timing attacks
- **sessionVersion**: incrementado en cambio de password, rol o eliminación de cuenta;
  validado en el `session` callback con ventana de gracia de hasta 1h
- **Validación de NEXTAUTH_SECRET**: build falla en producción si el secret es default o <32 chars
- **Revocation de sesiones** tras eliminación de cuenta
- **Middleware** verifica `countAdmins` en cambios de roles
- **Validación de permisos**: solo ADMIN puede asignar rol ADMIN
- **No token en logs**: el URL de reseteo nunca se loggea con el token incluido
- [TODO Fase 3] **Rate limiting** en endpoints sensibles (login, recuperar, resetear)
- [TODO Fase 3] **Logging de intentos fallidos** con auditoría (eventos LOGIN_FALLIDO ya implementados)
- [TODO Fase 4] **2FA** y **email verification**

### Consideraciones
- La contraseña genérica por defecto (`12345678`) **NO debe usarse en producción**
- Forzar `mustChangePassword=true` garantiza rotación inmediata
- Auditoría completa permite trazabilidad forense
- Soft delete preserva integridad referencial y datos históricos

### Forzamiento de Cambio de Contraseña (mustChangePassword)

El admin genérico se crea con `mustChangePassword: true`. Al primer login, el
usuario es autenticado pero **no puede navegar** a ninguna ruta protegida hasta
que cambie su contraseña.

#### Flujo

```
Login con admin genérico (12345678) → Session con mustChangePassword: true
  → Middleware redirige a /perfil/cambiar-password
  → Usuario cambia contraseña (debe tener 10+ caracteres, letra y número)
  → Server Action pone mustChangePassword: false en BD
  → AuditLog registra PASSWORD_CAMBIADO_OBLIGATORIO
  → signOut forzado → redirect a /auth/login?message=password-changed
  → Re-login con nueva contraseña → acceso normal
```

#### Restricciones de navegación (Middleware)

Mientras `mustChangePassword === true`, el middleware permite **únicamente**:

| Ruta | Descripción |
|------|-------------|
| `/perfil/cambiar-password` | Página de cambio obligatorio |
| `/api/perfil` | Server Action de cambio de password |
| `/auth/*` | Login, logout, recuperar (para cerrar sesión) |
| `/_next/*` | Assets estáticos |
| `/favicon.ico` | Favicon |

**Cualquier otra ruta** redirige a `/perfil/cambiar-password`. Esto incluye `/`,
`/admin`, `/cliente`, `/catalogo`, etc.

#### Página `/perfil/cambiar-password`

- No muestra Navbar ni Sidebar (evita tentar navegación)
- Título: "Debes cambiar tu contraseña"
- Mensaje: "Por seguridad, debes establecer una nueva contraseña antes de continuar."
- Formulario: contraseña actual + nueva + confirmación
- Accesibilidad: labels, `aria-describedby`, `autocomplete`
- Al éxito: `signOut` + redirect a `/auth/login?message=password-changed`

### Bloqueo de Usuarios Inactivos (isActive)

Los usuarios con `isActive: false` (soft-delete) **no pueden loguearse**. La
query de `authorize` filtra por `isActive: true`. Si el usuario existe pero está
inactivo, el login falla con el mismo mensaje que una contraseña incorrecta
("Credenciales inválidas") para prevenir enumeración de cuentas. El evento de
auditoría `LOGIN_FALLIDO_USUARIO_INACTIVO` se registra en el servidor.

## Testing

### Tests Unitarios (Vitest)
```bash
npm test
```
Cubre:
- Crear admin genérico si no hay admins
- Desactivar admin genérico al crear otro admin
- Reaparecer admin genérico si no hay admins
- Eliminación último admin requiere doble contraseña
- Usuarios normales eliminan cuenta con su contraseña
- Usuarios inactivos no pueden loguearse (`auth-isactive.test.ts`)
- Admin genérico forzado a cambiar contraseña (`auth-must-change-password.test.ts`)
- Validación de NEXTAUTH_SECRET en producción (`auth-env-validation.test.ts`)
- No token de reset en logs (`auth-s4-no-token-logs.test.ts`)

### Tests de Integración (Playwright)
```bash
npm run test:a11y
npm run test:visual:comprehensive
```
Cubre:
- Flujo registro → login → primer login genérico → cambio contraseña
- Intento eliminar último admin con contraseña incorrecta falla
- Verificar registro público no permite crear admin
- Verificar revocación de sesiones

## Mantenimiento

### Consultas Útiles

```sql
-- Ver administradores activos
SELECT id, email, nombre, rol, isGenericAdmin, mustChangePassword, isActive 
FROM "User" 
WHERE rol = 'ADMIN' AND isActive = true;

-- Ver logs de auditoría recientes
SELECT * FROM "AuditLog" 
WHERE eventType LIKE '%ADMIN%' 
ORDER BY timestamp DESC 
LIMIT 20;

-- Verificar admin genérico
SELECT * FROM "User" WHERE isGenericAdmin = true;
```

### Rotación Periódica Recomendada
- Cambiar `GENERIC_ADMIN_PASSWORD` cada 90 días
- Revisar logs de auditoría mensualmente
- Verificar que no hay admins genéricos activos inesperados

## Solución de Problemas

### Admin Genérico No Se Crea
1. Verificar que seed script se ejecuta en `postinstall` o manualmente
2. Revisar logs de consola para errores de Prisma
3. Verificar `DATABASE_URL` apunta a BD correcta

### No Se Desactiva Admin Genérico
1. Verificar que `asignarRolAdmin` se llama al crear admin
2. Revisar que `deactivateGenericAdmin` no falla silenciosamente
3. Comprobar permisos del usuario que crea el admin

### Eliminación Último Admin Falla
1. Verificar que `GENERIC_ADMIN_PASSWORD` coincide en .env y BD
2. Revisar que bcrypt compara correctamente (12 rounds para nuevas contraseñas)
3. Comprobar que `eliminarUltimoAdmin` se llama (no `eliminarCuenta`)

## Referencias

- [Prisma Schema](./prisma/schema.prisma)
- [Seed Script](./prisma/seed.ts)
- [Server Actions](./src/lib/actions.ts)
- [API Routes](./src/app/api/)
- [UI Perfil](./src/app/perfil/page.tsx)
- [Tests](./src/tests/)