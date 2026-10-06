This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy en producción (Vercel + Supabase)

Mi-Pyme usa **PostgreSQL (Supabase)** en producción y **SQLite** en tests.
Ver la [guía completa de deploy](./docs/deploy.md) para detalles.

### Prerequisitos

- Proyecto en Supabase (PostgreSQL) configurado.
- Cuenta en Vercel.
- Variables: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.

### Quick start

```bash
# 1. Generar cliente Prisma
npx prisma generate

# 2. Aplicar migraciones a Supabase
npx prisma migrate dev --name init_postgres

# 3. Crear admin genérico
npx tsx scripts/seed-prod.ts

# 4. Build + test local
npm run build && npm run test
```

### Deploy en Vercel

1. Ir a [vercel.com](https://vercel.com) → **Add New → Project**.
2. Importar `Proyectos_Comerciales`.
3. **Root Directory**: `mi-pyme`.
4. Framework: Next.js (auto).
5. Configurar **Environment Variables** (ver [docs/deploy.md](./docs/deploy.md) para la tabla completa).
6. **Deploy**.

### Seed en producción

- **Admin genérico**: `npx tsx scripts/seed-prod.ts`
- **Datos de prueba** (NO en producción): `npx prisma db seed`

## Panel de autogestión de negocio

Mi-Pyme incluye un panel completo para que los usuarios con rol **NEGOCIO**
 gestionen su negocio, y un flujo de solicitud de alta para que los **CLIENTES**
 soliciten crear un negocio (aprobado por **ADMIN**).

### Funcionalidades

- **Datos del negocio**: nombre, descripción, provincia, municipio, dirección, contacto.
- **Horarios**: editor semanal con apertura/cierre por día.
- **Productos**: CRUD completo con precio, stock, subárea.
- **Servicios**: CRUD con duración, capacidad y horarios disponibles.
- **Inventario**: gestión de stock y punto de reorden por producto.
- **Disponibilidad**: disponibilidad diaria de productos (Fase 1, Punto 2).
- **Logística**: opciones de envío con tarifas y proveedores.
- **Pedidos**: lista y actualización de estado.
- **Reservas**: lista y confirmación/cancelación de reservas.
- **Ventas**: reporte de ventas por día y productos más vendidos.
- **Solicitudes**: crear, consultar y cancelar solicitudes de alta.
- **Checkout**: proceso formal de compra con logística elegible (Fase 1, Punto 4).
- **Facturación**: emisión y gestión de facturas con cálculo automático de IVA cubano (10%).
- **Pagos**: gestión manual/semi-automática de pagos (Fase 1, Punto 5). Soporta efectivo, transferencia, pago móvil. Recibos y estados de pago.
- **Reportes fiscales**: KPIs de IVA por negocio y plataforma (solo ADMIN).

### Rutas

| Ruta                    | Rol               |
| ----------------------- | ----------------- |
| `/negocio`              | NEGOCIO, ADMIN    |
| `/negocio/disponibilidad` | NEGOCIO, ADMIN  |
| `/negocio/mi-negocio`   | NEGOCIO, ADMIN    |
| `/negocio/horarios`     | NEGOCIO, ADMIN    |
| `/negocio/productos`    | NEGOCIO, ADMIN    |
| `/negocio/servicios`    | NEGOCIO, ADMIN    |
| `/negocio/inventario`   | NEGOCIO, ADMIN    |
| `/negocio/logistica`    | NEGOCIO, ADMIN    |
| `/negocio/pedidos`      | NEGOCIO, ADMIN    |
| `/negocio/reservas`     | NEGOCIO, ADMIN    |
| `/negocio/ventas`       | NEGOCIO, ADMIN    |
| `/checkout`             | CLIENTE           |
| `/checkout/confirmacion` | CLIENTE          |
| `/pedidos`              | CLIENTE           |
| `/carrito`              | CLIENTE           |
| `/negocios/solicitar`   | CLIENTE           |
| `/mis-solicitudes`      | CLIENTE           |
| `/negocios/solicitud/[id]` | owner, ADMIN   |
| `/admin/solicitudes`    | ADMIN             |
| `/admin/facturas`       | ADMIN             |
| `/admin/reportes/fiscal`| ADMIN             |
| `/facturas`             | CLIENTE, NEGOCIO  |
| `/negocio/facturas`     | NEGOCIO, ADMIN    |
| `/negocio/mi-negocio#datos-fiscales` | NEGOCIO, ADMIN |
| `/pagos`                | CLIENTE           |
| `/pagos/[id]`           | CLIENTE           |
| `/negocio/pagos`        | NEGOCIO, ADMIN    |
| `/admin/pagos`          | ADMIN             |

### Tests

```bash
# Tests unitarios (Vitest)
npm run test

# Tests de accesibilidad y regresión visual (Playwright + Axe)
npm run test:a11y

# Tests de rendimiento (LCP, CLS, console errors)
npm run test:performance

# Tests de tamaño de bundle
npm run test:bundle

# Tests de registro visual
npm run test:visual

# Tests de registro visual comprensivos
npm run test:visual:comprehensive

# Tests E2E (flujo de auth, pagos)
npm run test:e2e

# Lighthouse CI
npm run test:lighthouse

# Bundle analyzer
npm run build:analyze

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

### Facturación e IVA (10%)

Mi-Pyme implementa el cálculo de IVA según la normativa cubana (10%):

- **Tasa IVA**: 10% (configurable por negocio, default 10).
- **Régimen fiscal**: `GENERAL` (aplica IVA), `SIMPLIFICADO` (IVA no aplica), `EXENTO`, `NO_SUJETO`.
- **Modo de precio**: `IVA_INCLUIDO` (el precio mostrado incluye IVA) o `IVA_AGREGADO` (IVA se suma al precio base).
- **Tratamiento IVA por producto/servicio**: `GRAVADO` (aplica IVA), `EXENTO` (producto exento), `NO_SUJETO` (no sujeto a IVA).
- Los negocios con régimen `SIMPLIFICADO`, `EXENTO` o `NO_SUJETO` no pueden tener productos `GRAVADOS`.
- Las facturas usan el formato `PR-AAAA-NNNNNN` (prefijo configurable).
- El checkout muestra el desglose fiscal por grupo de negocio.
- La facturación se emite mediante `emitirFactura(pedidoId)`, recalculando IVA cuando el pedido no tiene snapshots fiscales.

### Arquitectura

Los servicios de negocio en `src/services/` son **framework-agnostic**: no
importan Next.js ni `@nestjs/*`. La migración a Nest.js microservicios está
planeada para Fase 4 y se documenta en detail en `SERVICE_ARCHITECTURE.md`.

La prueba de arquitectura (`src/tests/architecture.test.ts`) verifica
automáticamente que los servicios mantienen esta separación.

## Migraciones de datos (Etapa 3 — Cubo 1)

Después de mergear las correcciones de coherencia (B1–B8), ejecutar las
migraciones manuales siguientes:

### B1: Migración de usuarios NEGOCIO autoregistrados

El registro ahora solo crea usuarios `CLIENTE`. Los usuarios existentes con
rol `NEGOCIO` que no tienen un negocio asociado deben degradarse a `CLIENTE`:

```bash
npx tsx scripts/migrar-negocios-autoregistrados.ts
```

- Usuarios NEGOCIO con negocio ACTIVO asociado → mantienen rol NEGOCIO.
- Usuarios NEGOCIO sin negocio asociado → degradados a CLIENTE.
- Usuarios NEGOCIO con negocio PENDIENTE/RECHAZADO → degradados a CLIENTE.
- Cada cambio se registra en `AuditLog` con evento `ROL_MIGRADO_AUTOREGISTRO`.

### B2: Invalidar tokens de reset existentes

Los tokens de reset existentes en texto plano deben invalidarse (se
hashean ahora con SHA-256). Borrar todos los registros `VerificationToken`:

```bash
npx tsx -e "import { PrismaClient } from './src/generated/prisma/client'; const p = new PrismaClient(); p.verificationToken.deleteMany({}); console.log('Tokens borrados:', p.verificationToken);"
```

Los usuarios con tokens válidos deben solicitar uno nuevo.

## Seed de datos de prueba

El seed puebla la BD con datos realistas para desarrollo y tests. Es **idempotente**: puede ejecutarse N veces sin duplicar.

```bash
npx prisma db seed
# o: npm run db:seed
```

Para producción, usa `scripts/seed-prod.ts` que crea SOLO el admin genérico:

```bash
npx tsx scripts/seed-prod.ts
```

### Qué crea

| Entidad | Cantidad | Detalles |
|---------|----------|----------|
| Usuarios | 15 | 2 ADMIN (1 genérico), 5 NEGOCIO, 7 CLIENTE (3 + 3 test + 1 preexistente), 1 LOGISTICA |
| Negocios | 5 (seed) + 1 preexistente | 3 en Pinar del Río (municipio), 1 en Viñales, 1 en Consolación del Sur |
| Áreas | 7 (seed) | Aseo y Limpieza, Alimentos, Electrodomésticos, Salud y Belleza, Comida y Restaurantes, Servicios Profesionales, Tecnología |
| Subáreas | 23 | 2-6 por área |
| Productos | 27 | 5-6 por negocio, con tratamientoIVA variado |
| Servicios | 11 | 2-3 por negocio |
| Inventario | 27 | 1 por producto |
| DisponibilidadProducto | 189 | 7 días × 27 productos |
| Proveedores logísticos | 3 | Envíos Pinar, Envíos Viñales, Logística Nacional |
| Opciones logísticas | hasta 35 | 2-3 por negocio por proveedor |
| Horarios | 35 | 7 días × 5 negocios seed |
| Solicitudes alta | 1 | "Confitería La Esquina" (PENDIENTE_APROBACION) |
| Tokens de reset | 2 (seed) + 1 preexistente | 1 válido, 2 expirados |
| Usuarios de test auth | 3 | inactive@test.com, mustchange@test.com, locked@test.com |

### Régimen fiscal

| Régimen | Negocios | IVA aplica | Productos |
|---------|----------|------------|-----------|
| GENERAL | 3 | Sí (10%) | GRAVADO / EXENTO |
| SIMPLIFICADO | 1 | No | NO_SUJETO |
| EXENTO | 1 | No | EXENTO |

### Variables de entorno

```bash
# Base de datos (Supabase PostgreSQL)
DATABASE_URL="postgresql://..."         # Transaction pooler (runtime Vercel)
DIRECT_URL="postgresql://..."           # Session pooler (migraciones)

# Auth
NEXTAUTH_URL="https://mi-pyme.vercel.app"  # o http://localhost:3000 en dev
NEXTAUTH_SECRET="<openssl rand -base64 32>"  # mínimo 32 chars

# Seed
GENERIC_ADMIN_PASSWORD=12345678    # Password del admin genérico
NEGOCIO_PASSWORD=negocio123      # Passwords de usuarios NEGOCIO
CLIENTE_PASSWORD=cliente123      # Passwords de usuarios CLIENTE
LOGISTICA_PASSWORD=logistica123  # Password de usuario LOGISTICA
TEST_PASSWORD=test1234           # Passwords de usuarios de test auth
```

### Usuarios de prueba

| Email | Rol | Password | Notas |
|-------|-----|----------|-------|
| admin@mi-pyme.local | ADMIN | GENERIC_ADMIN_PASSWORD | mustChangePassword: true |
| admin2@test.com | ADMIN | admin2pass | |
| panaderia@test.com | NEGOCIO | NEGOCIO_PASSWORD | Negocio: Panadería La Espiga |
| carniceria@test.com | NEGOCIO | NEGOCIO_PASSWORD | Negocio: Carnicería El Rincón |
| barberia@test.com | NEGOCIO | NEGOCIO_PASSWORD | Negocio: Barbería El Corte |
| reposteria@test.com | NEGOCIO | NEGOCIO_PASSWORD | Negocio: Repostería Dulce Sueño |
| techstore@test.com | NEGOCIO | NEGOCIO_PASSWORD | Negocio: TechStore Express |
| cliente1@test.com | CLIENTE | CLIENTE_PASSWORD | Token de reset válido |
| cliente2@test.com | CLIENTE | CLIENTE_PASSWORD | Token de reset expirado |
| cliente3@test.com | CLIENTE | CLIENTE_PASSWORD | Solicitante de alta |
| logistica@test.com | LOGISTICA | LOGISTICA_PASSWORD | Dueño de proveedores |
| inactive@test.com | CLIENTE | TEST_PASSWORD | isActive: false |
| mustchange@test.com | CLIENTE | TEST_PASSWORD | mustChangePassword: true |
| locked@test.com | CLIENTE | TEST_PASSWORD | lockedUntil +1h |
| cliente@test.com | CLIENTE | — | Preexistente (no password)

