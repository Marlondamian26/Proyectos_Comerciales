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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

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

# Tests de integración
npm run test:integration

# Tests visuales y de accesibilidad (Playwright)
npx playwright test --config=visual-tests/playwright.config.mjs
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
