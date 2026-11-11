# Deploy en Producción (Vercel + Supabase)

## Prerequisitos

- Proyecto en Supabase (PostgreSQL) creado.
- Cuenta en [Vercel](https://vercel.com).
- Access a Supabase Dashboard con permisos de administrador.

## Arquitectura de base de datos

| Entorno | Motor | Descripción |
|---------|-------|-------------|
| Producción | PostgreSQL (Supabase) | Connection pooler gestionado por Supabase |
| Desarrollo | PostgreSQL (Supabase) | Mismo `DATABASE_URL` que producción |
| Tests | SQLite | Base local `data/mipyme.db` (isolated, fast) |

### Connection poolers de Supabase

Supabase ofrece dos poolers de conexión:

| Pooler | Puerto | Parámetro | Uso |
|--------|--------|-----------|-----|
| **Session pooler** | 5432 | `DIRECT_URL` | Migraciones (`prisma migrate dev`, `prisma migrate deploy`) |
| **Transaction pooler** | 6543 | `DATABASE_URL` | Runtime (Vercel, app server) — con `pgbouncer=true&connection_limit=1` |

> **Importante:** El Transaction pooler (puerto 6543) es obligatorio para Vercel porque limita
> conexiones concurrentes a 1, compatible con el modelo sin servidor de Vercel. El Session
> pooler (puerto 5432) permite migraciones más intensivas.

## Variables de entorno en Vercel

Configurar en **Vercel Dashboard → Project → Settings → Environment Variables**
para **Production** y **Preview**:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres.<ref>:<password>@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require` |
| `DIRECT_URL` | `postgresql://postgres.<ref>:<password>@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require` |
| `NEXTAUTH_URL` | `https://mi-pyme-seven.vercel.app` (DOMINIO DE PRODUCCIÓN EXACTO) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` (mínimo 32 chars) |
| `GENERIC_ADMIN_PASSWORD` | Contraseña fuerte para el admin genérico |
| `NEGOCIO_PASSWORD` | Contraseña para usuarios NEGOCIO de prueba |
| `CLIENTE_PASSWORD` | Contraseña para usuarios CLIENTE de prueba |
| `LOGISTICA_PASSWORD` | Contraseña para usuario LOGISTICA de prueba |
| `TEST_PASSWORD` | Contraseña para usuarios de test de auth |
| `EMAIL_PROVIDER` | `console` (dev) o `smtp` (prod) |
| `SMTP_HOST` | (opcional) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | (opcional) |
| `SMTP_PASS` | (opcional) |
| `SMTP_FROM` | `noreply@mi-pyme.cu` |
| `NODE_ENV` | `production` |

## Pasos de deploy

### 1. Configurar variables de entorno local

Editar `.env` con las credenciales de Supabase:

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_SECRET="openssl rand -base64 32"
```

### 2. Generar el cliente de Prisma

```bash
npx prisma generate
```

### 3. Aplicar migraciones

```bash
npx prisma migrate dev --name init_postgres
```

Este comando crea todas las tablas en Supabase y genera la migración inicial
en `prisma/migrations/`.

> **Nota:** El backup de migraciones SQLite está en `prisma/migrations.sqlite-backup/`.
> No se necesita aplicar las migraciones antiguas; el schema completo se define en
> `prisma/schema.prisma` y `prisma migrate dev` genera una nueva migración
> idempotente para PostgreSQL.

### 4. Verificar tablas en Supabase

1. Ve a **Supabase Dashboard → Table Editor**.
2. Verifica que aparezcan las tablas: `User`, `Negocio`, `Producto`, `Pedido`,
   `Factura`, `Carrito`, `Reserva`, etc.
3. Verifica los enums y los índices.

### 5. Crear el admin genérico

```bash
npx tsx scripts/seed-prod.ts
```

Este script crea SOLO el admin genérico (`admin@mi-pyme.local` / `admin`).
No crea datos de ejemplo.

### 6. Deploy en Vercel

1. Ve a [vercel.com](https://vercel.com) → login con GitHub.
2. **"Add New..." → "Project"**.
3. Importa el repositorio `Proyectos_Comerciales`.
4. **Root Directory**: `mi-pyme`.
5. **Framework**: Next.js (auto-detectado).
6. Añade las variables de entorno (ver tabla arriba).
7. Haz clic en **"Deploy"**.

### 7. Verificar el deploy

- Visita `https://mi-pyme.vercel.app`.
- Login con el admin (`admin@mi-pyme.local` / `GENERIC_ADMIN_PASSWORD`).
- El admin será redirigido a `/perfil/cambiar-password` (mustChangePassword: true).

## Consideraciones para Cuba

| Aspecto | Mitigación |
|---|---|
| **IPv6 no soportado** | Session pooler (IPv4) para migraciones, Transaction pooler (IPv4) para runtime. |
| **Latencia ~150ms** | Región `us-east-1` seleccionada (mínima latencia). |
| **Supabase pausa tras 7 días** | Reactivar manualmente desde el dashboard. Para producción, considerar plan Pro ($25/mes) para evitar pausas. |
| **Vercel dashboard lento** | El deploy no depende de la conexión local. |

## Troubleshooting

### Error de conexión SSL

```
Can't connect to PostgreSQL server
```

Verifica que:
- `DATABASE_URL` y `DIRECT_URL` incluyen `?sslmode=require`.
- La contraseña de Supabase es correcta.
- El Project Ref es correcto.
- No hay firewall bloqueando el pooler (Supabase permite conexiones desde cualquier IP por defecto).

### Error: "pgbouncer" transaction mode

```
Transaction ID wraparound limit reached
```

Este error indica que el pooler está agotado. Asegúrate de que:
- `DATABASE_URL` incluye `pgbouncer=true&connection_limit=1`.
- No estás usando `DIRECT_URL` (puerto 5432) para el runtime.

### Error de migración: duplicate object

Si `prisma migrate dev` falla con "relation already exists":

```bash
# Reset the database (¡CUIDADO! Borra todos los datos)
npx prisma migrate dev --name init_postgres --skip-generate
# o forzar reset:
npx prisma db push  # solo para desarrollo, no usar en prod
```

### NEXTAUTH_SECRET validation error

```
NEXTAUTH_SECRET no está configurado
```

Genera una clave:
```bash
openssl rand -base64 32
```

Y configúrala en Vercel → Environment Variables → `NEXTAUTH_SECRET`.

### Logout redirige a un sitio externo ("MiPyme Chile")

**Causa:** `NEXTAUTH_URL` mal configurada en Vercel, o falta del callback `redirect`
en `src/lib/auth/auth.config.ts`. NextAuth resuelve `callbackUrl` relativo contra
`NEXTAUTH_URL`; si apunta a un dominio equivocado, el logout sale del sitio.

**Solución:**

1. Verifica que `NEXTAUTH_URL` en **Vercel → Settings → Environment Variables**
   sea exactamente el dominio de producción:
   ```
   NEXTAUTH_URL=https://mi-pyme-seven.vercel.app
   ```
2. El callback `redirect` en `auth.config.ts` fuerza que las URLs relativas
   (`callbackUrl: "/"`) se resuelvan contra `baseUrl` y que cualquier redirect
   externo caiga a `baseUrl` (nunca a un sitio externo).
3. Redeploy.

## Post-deploy

1. **Cambiar la contraseña de Supabase** después de verificar el deploy (ver Paso 12 en el prompt de migración).
2. **Configurar dominio personalizado** en Vercel → Settings → Domains (ej. `mi-pyme.cu`).
3. **Configurar notificaciones email** en producción (SMTP real en lugar de `console`).
4. **Revisar logs** en Vercel → Functions → Logs para verificar ausencia de errores.

## Referencias

- [Supabase Documentation](https://supabase.com/docs/guides/database)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/orm/overview/prisma-with-postgresql)
- [Vercel Deploy Docs](https://vercel.com/docs/concepts/deployments/overview)
- [NextAuth.js v5](https://authjs.dev/)
