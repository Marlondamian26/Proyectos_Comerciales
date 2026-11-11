# Mi-Pyme — Plataforma de comercio local

Mi-Pyme es una plataforma de comercio electrónico multi-negocio orientada a
pequeñas y medianas empresas cubanas. Reúne un catálogo público de productos y
servicios con herramientas de operación para clientes, negocios, logística y
administración.

- **Producción:** [mi-pyme-seven.vercel.app](https://mi-pyme-seven.vercel.app/)
- **Aplicación:** [`mi-pyme/`](./mi-pyme/)
- **Guía de despliegue:** [`mi-pyme/docs/deploy.md`](./mi-pyme/docs/deploy.md)

> **Estado documentado al 10 de octubre de 2026:** el commit `baab9d4`
> (`fix: correct area filtering and public empty states`) está sincronizado con
> `origin/Proyecto-Mi-Pyme`. El deployment de producción asociado se verificó
> como `READY` en Vercel. Se comprobó el filtrado remoto de productos y
> servicios en las nueve áreas activas, tanto mediante `areaId` como mediante
> slug, sin resultados de otras áreas.

## Contenido

- [Qué ofrece](#qué-ofrece)
- [Estado y validación](#estado-y-validación)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Rutas principales](#rutas-principales)
- [Modelo de datos](#modelo-de-datos)
- [Desarrollo local](#desarrollo-local)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos, migraciones y seed](#base-de-datos-migraciones-y-seed)
- [Pruebas y calidad](#pruebas-y-calidad)
- [Despliegue y operación](#despliegue-y-operación)
- [Seguridad y convenciones](#seguridad-y-convenciones)
- [Documentación relacionada](#documentación-relacionada)

## Qué ofrece

### Marketplace público

- Catálogo de productos y servicios con páginas de detalle.
- Búsqueda, filtros por negocio, área, subárea y disponibilidad.
- Navegación de áreas desde la página de inicio.
- Filtro de área basado en la relación real del producto o servicio con su
  subárea (`Subarea.areaId`), no en el área principal del negocio. Esto permite
  que un negocio tenga productos y servicios en áreas distintas.
- Páginas de carrito, checkout, confirmación, pedidos, pagos, reservas y
  facturas para los flujos correspondientes.
- Vistas de disponibilidad y cupos para productos y servicios.

### Operación de negocios

Los usuarios autorizados gestionan datos del negocio, horarios, productos,
servicios, inventario, disponibilidad, logística, pedidos, reservas, ventas,
promociones, cupones, combos, pagos y facturas desde sus paneles.

La incorporación de un nuevo negocio sigue un flujo de solicitud de alta,
revisión y aprobación administrativa; el registro público crea usuarios con rol
`CLIENTE`, no concede directamente roles privilegiados.

### Operación de la plataforma

- Panel administrativo para solicitudes, pagos, facturas e informes fiscales.
- Panel de logística y opciones de entrega.
- Notificaciones en la aplicación y preferencias por usuario.
- Registro de actividad de auditoría en operaciones relevantes.
- Conversión y visualización de precios en distintas monedas.
- Carga de imágenes a Cloudinary mediante rutas de API dedicadas.

## Estado y validación

### Estado de producto y operación

El proyecto contiene flujos de marketplace, paneles por rol, persistencia,
migraciones, configuración de despliegue y pruebas automatizadas. El alcance
funcional concreto se describe en las rutas y carpetas de esta guía; las fases
del plan de producto no sustituyen la verificación del código desplegado.

La rama de referencia verificada es `Proyecto-Mi-Pyme`. En la última
comprobación local, `HEAD` y `origin/Proyecto-Mi-Pyme` apuntaban al mismo commit
`baab9d4`, y el árbol de trabajo estaba limpio.

### Cambios de catálogo verificados en producción

- Los endpoints públicos de productos y servicios se comprobaron contra las
  nueve áreas activas usando `areaId` y slug.
- No se encontraron resultados con `subarea.areaId` diferente del área
  seleccionada.
- La home y una búsqueda de catálogo sin resultados respondieron correctamente
  y no expusieron CTA de administración como “Agregar primer producto/servicio”.
- Un visitante anónimo que abre `/cliente` recibió una redirección `307` a
  `/auth/login?callbackUrl=%2Fcliente`.
- El dominio de producción apuntó al deployment `READY` asociado al commit
  `baab9d4`.

### Estado de las pruebas al documentar

- `npx tsc --noEmit`: validación completada correctamente.
- `npx next build`: compilación de producción completada correctamente.
- Smoke tests HTTP de home, catálogo y redirección anónima: correctos.
- Comprobación remota de filtros: nueve áreas verificadas, sin mezcla entre
  áreas.
- La suite Vitest no pudo recolectar en la última ejecución por un error de
  resolución de `next/server` desde `next-auth` en el entorno local. No se
  considera una suite aprobada hasta resolver y volver a ejecutar ese runner.
- El lint de `src/lib/actions.ts` detectó usos de `any` en otras zonas del
  archivo. Los archivos editados restantes pasaron el lint enfocado.
- Los tests E2E nuevos están en
  [`mi-pyme/e2e/catalogo-area-public.test.ts`](./mi-pyme/e2e/catalogo-area-public.test.ts);
  se añadieron, pero no se ejecutaron en la validación descrita arriba.

## Tecnologías

| Área | Tecnología |
| --- | --- |
| Lenguajes principales | TypeScript, TSX, JavaScript/MJS de configuración y pruebas, CSS |
| Web | Next.js `16.3.4`, App Router |
| UI | React `19.2.8`, Tailwind CSS v4, componentes propios, Lucide |
| Formularios y estilo | Componentes React, CSS variables/tokens, `clsx`, `tailwind-merge` |
| Autenticación | Auth.js / NextAuth `5.0.0-beta.32`, Credentials y estrategia JWT |
| ORM y cliente de datos | Prisma `7.10.x` y cliente generado en `src/generated/` |
| Producción | PostgreSQL gestionado por Supabase |
| Pruebas de datos | SQLite local mediante un schema Prisma separado |
| Caché local | Abstracción propia con implementación en memoria |
| Email | Proveedores intercambiables: consola y SMTP |
| Imágenes | Cloudinary, con SDK de servidor y componentes cliente |
| Pruebas | Vitest, Playwright, Axe, Testing Library |
| Calidad y análisis | ESLint 9, TypeScript, Lighthouse CI y bundle analyzer |
| Despliegue | Vercel; raíz de aplicación `mi-pyme/` |
| Contenedores | Docker y Docker Compose |

La versión exacta de dependencias está registrada en
[`mi-pyme/package-lock.json`](./mi-pyme/package-lock.json). El deployment
verificado de Vercel usó Node.js 24.x.

## Arquitectura

### Flujo general

```text
Navegador
  ├─ App Router: páginas y layouts en src/app
  ├─ API Routes: src/app/api/**/route.ts
  └─ Server Actions: acciones exportadas desde src/lib/actions.ts
       ├─ servicios de dominio: src/services/
       ├─ autenticación y acceso: src/lib/auth/
       ├─ infraestructura transversal: src/infrastructure/
       └─ persistencia: Prisma → PostgreSQL o SQLite de pruebas
```

Las páginas y rutas API proporcionan la capa HTTP/UI. Las acciones centralizan
varios flujos de servidor y los servicios de `src/services/` agrupan reglas de
dominio. Los servicios están diseñados para no depender directamente de Next.js;
la separación se comprueba mediante pruebas de arquitectura. Algunas consultas
de aplicación también se realizan desde acciones usando Prisma.

La carpeta `src/infrastructure/` contiene contratos e implementaciones para
caché, email y un event bus en memoria. La implementación de caché activa es
local/en memoria; no se debe asumir que proporciona invalidación distribuida
entre instancias serverless.

### App Router

- `src/app/(frontend)/` contiene páginas con el grupo de rutas de la experiencia
  de usuario.
- `src/app/api/` contiene handlers HTTP.
- `src/app/layout.tsx`, `src/app/globals.css` y los layouts anidados definen
  estructura y estilos globales.
- `src/middleware.ts` contiene actualmente lógica de autenticación y
  redirección. Next.js 16 marca la convención `middleware` como obsoleta en
  favor de `proxy`; la compilación actual advierte sobre esa migración futura.

### Catálogo y relaciones entre áreas

El esquema relaciona `Area` con sus `Subarea`. Cada `Producto` y cada `Servicio`
pertenecen a una subárea mediante `subareaId`; el área se resuelve por
`subarea.areaId`. Un negocio puede tener un área principal y varias subáreas
mediante `NegocioSubarea`. Por eso el filtro de catálogo se aplica a la subárea
del elemento, no únicamente al negocio asociado.

Las funciones de lista aceptan `areaId` o slug `area`. Si llega un slug, se
resuelve a su identificador antes de filtrar y se usa la relación de subárea
tanto para productos como para servicios. Los endpoints públicos relevantes
son `GET /api/productos` y `GET /api/servicios`.

### Autenticación y autorización

- Proveedor Credentials con email o nombre de usuario y contraseña.
- Sesiones JWT con datos de identidad y rol.
- Roles principales: `CLIENTE`, `NEGOCIO`, `LOGISTICA` y `ADMIN`.
- Protección de rutas y redirecciones por rol.
- Validación de propiedad del negocio/recurso en mutaciones sensibles.
- Política central de contraseñas, bcrypt y versión de sesión para invalidación.
- Tokens temporales de verificación/reset almacenados como hash según las reglas
  del proyecto.
- Registro de eventos relevantes de autenticación y auditoría.

La guía de seguridad y sus pendientes se mantienen en
[`mi-pyme/CLAUDE.md`](./mi-pyme/CLAUDE.md) y
[`mi-pyme/AGENTS.md`](./mi-pyme/AGENTS.md).

### Diseño y presentación

El sistema visual es mobile-first y usa tokens semánticos en CSS, modos claro y
oscuro, componentes reutilizables y utilidades Tailwind. La documentación
detallada está en [`mi-pyme/docs/design-tokens.md`](./mi-pyme/docs/design-tokens.md),
[`mi-pyme/docs/design-system.md`](./mi-pyme/docs/design-system.md) y
[`mi-pyme/docs/ux-patterns.md`](./mi-pyme/docs/ux-patterns.md).

## Estructura del repositorio

```text
.
├── README.md
└── mi-pyme/                       # aplicación Next.js
    ├── src/
    │   ├── app/                   # páginas, layouts y rutas API
    │   ├── components/            # UI compartida y componentes de dominio
    │   ├── core/                  # configuración, constantes y ubicaciones
    │   ├── generated/             # clientes Prisma generados; no editar a mano
    │   ├── infrastructure/        # caché, email y event bus
    │   ├── lib/                   # Prisma, acciones y autenticación
    │   ├── services/              # servicios/reglas de dominio
    │   ├── shared/                # tipos y utilidades compartidas
    │   ├── styles/                # tokens y tema
    │   └── tests/                 # suites Vitest
    ├── prisma/
    │   ├── migrations/            # migraciones PostgreSQL
    │   ├── schema.prisma          # schema de producción/desarrollo
    │   ├── schema.test.prisma     # schema SQLite de pruebas
    │   └── seed.ts                # datos de desarrollo/prueba
    ├── e2e/                       # Playwright E2E
    ├── tests/                     # pruebas adicionales basadas en Node/Playwright
    ├── visual-tests/              # accesibilidad y regresión visual
    ├── docs/                      # despliegue, diseño, QA y arquitectura
    ├── public/                    # recursos estáticos
    ├── scripts/                   # utilidades operativas/migración
    ├── package.json
    ├── next.config.ts
    ├── prisma.config.ts
    ├── vitest.config.ts
    └── playwright.*.config.mjs
```

### Archivos de referencia

- [Aplicación y dependencias](./mi-pyme/package.json)
- [Esquema de producción](./mi-pyme/prisma/schema.prisma)
- [Esquema de pruebas](./mi-pyme/prisma/schema.test.prisma)
- [Configuración Prisma](./mi-pyme/prisma.config.ts)
- [Configuración Next.js](./mi-pyme/next.config.ts)
- [Acciones de servidor](./mi-pyme/src/lib/actions.ts)
- [Servicios de dominio](./mi-pyme/src/services/)
- [Autenticación](./mi-pyme/src/lib/auth/)
- [Variables de entorno de ejemplo](./mi-pyme/.env.example)

## Rutas principales

La tabla agrupa las rutas de páginas visibles en el código actual; la
autorización efectiva depende de sesión, rol y, en el caso de `/negocio`, la
propiedad del negocio.

| Área | Rutas |
| --- | --- |
| Público | `/`, `/catalogo`, `/catalogo/[id]`, `/servicios`, `/servicios/[id]`, `/contacto` |
| Autenticación | `/auth/login`, `/auth/registro`, `/auth/recuperar`, `/auth/resetear/[token]` |
| Cliente | `/cliente`, `/carrito`, `/checkout`, `/checkout/confirmacion`, `/pedidos`, `/reservas`, `/pagos`, `/pagos/[id]`, `/facturas`, `/facturas/[id]`, `/perfil`, `/perfil/cambiar-password`, `/perfil/notificaciones`, `/notificaciones`, `/mis-solicitudes` |
| Negocio | `/negocio`, `/negocio/mi-negocio`, `/negocio/horarios`, `/negocio/productos`, `/negocio/servicios`, `/negocio/inventario`, `/negocio/disponibilidad`, `/negocio/logistica`, `/negocio/pedidos`, `/negocio/reservas`, `/negocio/ventas`, `/negocio/promociones`, `/negocio/cupones`, `/negocio/combos`, `/negocio/pagos`, `/negocio/facturas` |
| Solicitudes | `/negocios/solicitar`, `/negocios/solicitud/[id]` |
| Administración | `/admin`, `/admin/solicitudes`, `/admin/pagos`, `/admin/facturas`, `/admin/reportes/fiscal` |
| Logística | `/logistica` |

La API cubre autenticación, áreas/subáreas, catálogo, disponibilidad,
carrito/checkout, negocios, logística, reservas, pedidos, pagos, facturas,
reportes, notificaciones, monedas y carga de archivos. Los handlers están
organizados por endpoint bajo `mi-pyme/src/app/api/`.

## Modelo de datos

El schema tiene modelos para:

- **Identidad y acceso:** `User`, `Account`, `Session`, `VerificationToken`.
- **Geografía y catálogo:** `Provincia`, `Municipio`, `Area`, `Subarea`,
  `NegocioSubarea`, `Negocio`, `Producto`, `Servicio`.
- **Compra y operación:** `Carrito`, `CarritoItem`, `Pedido`, `PedidoItem`,
  `Reserva`, `DisponibilidadProducto`, `Inventario`, `HorarioNegocio`.
- **Finanzas:** `Pago`, `Factura`, `FacturaItem`, `ReporteVenta`, `PrecioProducto`,
  `TasaCambio`, `PreferenciaMonedaUsuario`.
- **Promoción:** `Promocion`, `PromocionUso`, `Cupon`, `CuponUso`, `Combo`,
  `ComboItem`, `ComboUso`.
- **Plataforma y comunicación:** `SolicitudAltaNegocio`, `NegocioUsuario`,
  `AuditLog`, `Notificacion`, `PreferenciaNotificacion`, además de entidades de
  logística como `ProveedorLogistico` y `OpcionLogistica`.

El schema define enums para roles, monedas, tipos de servicio/transporte,
estados de pago/factura/notificación, descuentos y tratamiento fiscal. La lista
completa y las relaciones están en
[`mi-pyme/prisma/schema.prisma`](./mi-pyme/prisma/schema.prisma).

### Fiscalidad y monedas

- Configuración fiscal por negocio, modo de precio con IVA incluido o agregado,
  y tratamiento fiscal en productos/servicios.
- Facturación con desglose de base imponible e IVA.
- Moneda preferida del usuario y monedas base/visualización del negocio.
- `ExchangeRateService` obtiene y sincroniza tasas TRMI desde ElToque, persiste
  datos de tasa y permite conversión usando CUP como moneda puente.
- La documentación del subsistema está en
  [`mi-pyme/docs/currency-system.md`](./mi-pyme/docs/currency-system.md).

## Desarrollo local

### Requisitos

- Node.js compatible con Next.js 16 (Node 24.x es la versión observada en el
  deployment actual).
- npm.
- Una base PostgreSQL/Supabase para desarrollo, o la configuración SQLite que
  usa la suite de pruebas.
- Credenciales de proveedores externos solo para las funciones que los
  necesiten (por ejemplo, Cloudinary o SMTP).

### Instalación y arranque

```bash
cd mi-pyme
cp .env.example .env
```

Completa `.env` con credenciales propias. El archivo de ejemplo contiene valores
de desarrollo; **no los uses en producción**. Configura `DATABASE_URL`,
`DIRECT_URL`, `NEXTAUTH_URL` y un `NEXTAUTH_SECRET` robusto antes de ejecutar la
aplicación. Prisma se genera mediante el hook `postinstall` de npm; después de
configurar el archivo, instala las dependencias:

```bash
npm ci
npm run dev
```

La aplicación queda disponible normalmente en
[http://localhost:3000](http://localhost:3000).

### Comandos disponibles

| Comando | Propósito |
| --- | --- |
| `npm run dev` | Servidor de desarrollo Next.js |
| `npm run build` | Genera Prisma, aplica migraciones pendientes y compila |
| `npm run start` | Inicia la compilación de producción |
| `npm run lint` | ESLint en el proyecto |
| `npx tsc --noEmit` | Verificación de tipos |
| `npm run test` | Suite Vitest |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:a11y` | Accesibilidad Playwright/Axe |
| `npm run test:visual` | Pruebas visuales de componentes |
| `npm run test:visual:comprehensive` | Regresión visual completa |
| `npm run test:visual:all` | Accesibilidad y visuales comprensivos |
| `npm run test:performance` | Métricas de carga, layout y errores |
| `npm run test:bundle` | Límites de tamaño de bundle |
| `npm run test:lighthouse` | Lighthouse CI |
| `npm run build:analyze` | Build con análisis de bundle |
| `npm run db:seed` | Seed de desarrollo |
| `npm run db:migrate:dev` | Crear/aplicar migración en desarrollo |
| `npm run db:migrate:deploy` | Aplicar migraciones pendientes |

El comando `npm run build` incluye `prisma migrate deploy`: necesita las
variables y el acceso a la base correctos; no es un build aislado de la base.

## Variables de entorno

La plantilla es [`mi-pyme/.env.example`](./mi-pyme/.env.example). Las variables
que actualmente enumera son:

| Grupo | Variables |
| --- | --- |
| Base de datos | `DATABASE_URL`, `DIRECT_URL` |
| NextAuth | `NEXTAUTH_URL`, `NEXTAUTH_SECRET` |
| Seed de pruebas | `GENERIC_ADMIN_PASSWORD`, `NEGOCIO_PASSWORD`, `CLIENTE_PASSWORD`, `LOGISTICA_PASSWORD`, `TEST_PASSWORD` |
| Email | `EMAIL_PROVIDER`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| Cloudinary | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` |
| Runtime | `NODE_ENV` |

En despliegue, `DATABASE_URL` corresponde al pooler transaccional de Supabase
para el runtime y `DIRECT_URL` a la conexión directa/session pooler para
migraciones. Las credenciales reales deben administrarse como secretos en Vercel
o en el gestor de secretos del entorno; no se deben subir a Git.

## Base de datos, migraciones y seed

- Producción y desarrollo configurado: PostgreSQL.
- Suite automatizada: SQLite local, archivo `mi-pyme/data/mipyme.db`, con
  `prisma/schema.test.prisma`.
- El test runner genera el cliente de test y sincroniza el schema SQLite en su
  hook `pretest`.
- Prisma lee la configuración de [`mi-pyme/prisma.config.ts`](./mi-pyme/prisma.config.ts).
- Los cambios de producción se versionan en `mi-pyme/prisma/migrations/`.
- El seed de desarrollo está en `mi-pyme/prisma/seed.ts`; la guía también
  diferencia este seed de las utilidades para preparar una instancia de
  producción.

Flujo habitual de migración:

```bash
# Desarrollo
npm run db:migrate:dev

# Aplicar migraciones ya versionadas
npm run db:migrate:deploy
```

Antes de ejecutar operaciones contra producción, revisa
[`mi-pyme/docs/deploy.md`](./mi-pyme/docs/deploy.md), confirma el entorno y haz
un backup apropiado.

## Pruebas y calidad

### Suites y ubicaciones

- Vitest: `mi-pyme/src/tests/**/*.test.ts(x)`.
- Playwright E2E: `mi-pyme/e2e/`.
- Playwright/Axe: `mi-pyme/visual-tests/` y configuración
  `mi-pyme/playwright.a11y.config.mjs`.
- Pruebas visuales: `mi-pyme/visual-tests/` y
  `mi-pyme/playwright.visual.config.mjs`.
- Playwright E2E configura su servidor local y preparación de datos desde
  `mi-pyme/e2e/global-setup.ts`.
- Cobertura Vitest utiliza V8 con reportes de texto, JSON y HTML.

La suite Vitest desactiva la ejecución paralela de archivos porque comparten la
misma base SQLite. Se recomienda verificar tipos y lint enfocado junto con las
pruebas relevantes al cambio. La guía de calidad y QA está en
[`mi-pyme/AGENTS.md`](./mi-pyme/AGENTS.md) y
[`mi-pyme/docs/QA_CHECKLIST.md`](./mi-pyme/docs/QA_CHECKLIST.md).

## Despliegue y operación

### Vercel y Supabase

- **Framework:** Next.js.
- **Root Directory de Vercel:** `mi-pyme`.
- **Build command:** `prisma generate && prisma migrate deploy && next build`
  (configurado en `build` y `vercel-build`).
- **Runtime:** PostgreSQL de Supabase mediante `DATABASE_URL`.
- **Migraciones:** conexión `DIRECT_URL`.
- **Dominio de producción verificado:** `mi-pyme-seven.vercel.app`.

La guía
[`mi-pyme/docs/deploy.md`](./mi-pyme/docs/deploy.md) contiene configuración de
poolers, variables, migraciones, alta del administrador, troubleshooting y
consideraciones de despliegue.

### Docker

Hay [`mi-pyme/Dockerfile`](./mi-pyme/Dockerfile),
[`mi-pyme/Dockerfile.dev`](./mi-pyme/Dockerfile.dev) y
[`mi-pyme/docker-compose.yml`](./mi-pyme/docker-compose.yml) para ejecución
contenedorizada. Revisa especialmente qué base usa cada configuración y no
reutilices credenciales de desarrollo en un entorno expuesto.

## Seguridad y convenciones

- El registro público asigna rol `CLIENTE`; los privilegios de negocio requieren
  el flujo de solicitud/aprobación correspondiente.
- Las rutas de negocio, logística y administración deben aplicar autorización
  por sesión, rol y propiedad cuando corresponda.
- Las mutaciones que cambian recursos de un negocio deben validar ownership.
- No registrar en logs contraseñas, tokens ni secretos.
- Mantener la política de contraseña, hash bcrypt y controles de versión de
  sesión existentes.
- Los servicios de `src/services/` no deben importar Next.js ni NestJS; la
  arquitectura no está migrada a microservicios NestJS.
- La UI debe seguir tokens semánticos, comportamiento mobile-first,
  accesibilidad, soporte de tema claro/oscuro y `prefers-reduced-motion`.

Los detalles son mantenidos en
[`mi-pyme/CLAUDE.md`](./mi-pyme/CLAUDE.md),
[`mi-pyme/AGENTS.md`](./mi-pyme/AGENTS.md),
[`mi-pyme/docs/design-tokens.md`](./mi-pyme/docs/design-tokens.md) y
[`mi-pyme/docs/ux-patterns.md`](./mi-pyme/docs/ux-patterns.md).

## Documentación relacionada

- [Despliegue Vercel + Supabase](./mi-pyme/docs/deploy.md)
- [Arquitectura de servicios](./mi-pyme/SERVICE_ARCHITECTURE.md)
- [Arquitectura de disponibilidad y panel de negocio](./mi-pyme/docs/SERVICE_ARCHITECTURE.md)
- [Sistema de monedas y tasas TRMI](./mi-pyme/docs/currency-system.md)
- [Sistema de diseño](./mi-pyme/docs/design-system.md)
- [Tokens de diseño](./mi-pyme/docs/design-tokens.md)
- [Patrones UX](./mi-pyme/docs/ux-patterns.md)
- [Pruebas visuales](./mi-pyme/docs/visual-testing.md)
- [Checklist QA](./mi-pyme/docs/QA_CHECKLIST.md)
- [Changelog](./mi-pyme/CHANGELOG.md)
- [Contribución](./mi-pyme/CONTRIBUTING.md)
