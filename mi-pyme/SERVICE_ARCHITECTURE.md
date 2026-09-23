# Arquitectura de Disponibilidad Diaria (Fase 1, Punto 2)

> Véase también: **[Panel de Autogestión de Negocio — Fase 1, Punto 3](#panel-de-autogesti-n-de-negocio)**

## Visión General

La disponibilidad diaria permite a los negocios definir cuántas unidades de un
producto (o cupos de un servicio) están disponibles por día. Los clientes ven
la disponibilidad en tiempo real en el catálogo y en las páginas de detalle, y
no pueden agregar al carrito más unidades de las disponibles.

## Stack

- **Next.js 16** App Router
- **TypeScript**
- **Prisma 6.19.3** (SQLite en dev)
- **Tailwind CSS v4**

## Componentes

### Modelos de datos

| Modelo                | Campos clave                                   |
| --------------------- | ---------------------------------------------- |
| `Producto`            | `disponibleHoy` (denormalizado para filtros)   |
| `DisponibilidadProducto` | `productoId`, `fecha` (UTC 00:00), `cantidad`, `notas` |
| `Servicio`            | `capacidad`, `horariosDisponibles` (JSON)      |

La tabla `DisponibilidadProducto` tiene un índice único compuesto
`@@unique([productoId, fecha])`, lo que permite usar `upsert` de forma
idempotente.

### Servicios de negocio

| Servicio                         | Responsabilidad                                      |
| -------------------------------- | ---------------------------------------------------- |
| `DisponibilidadService`          | Lee disponibilidad, valida si se puede comprar/reservar |
| `AdminDisponibilidadService`     | Upsert/elimina disponibilidad (verifica ownership)   |
| `CartService`                    | Agrega items al carrito, valida disponibilidad       |
| `CatalogService`                 | Lista productos/servicios con disponibilidad de hoy  |
| `PedidosService`                 | Crea pedidos, consume disponibilidad                 |
| `ReservaService`                 | Crea reservas de servicios                           |

### API Routes

| Endpoint                                           | Método | Descripción                              |
| -------------------------------------------------- | ------ | ---------------------------------------- |
| `/api/disponibilidad/producto/[id]`                | GET    | Disponibilidad para una fecha específica |
| `/api/disponibilidad/producto/[id]`                | POST   | Establecer disponibilidad para una fecha |
| `/api/disponibilidad/producto/[id]/semana`         | GET    | Disponibilidad para los próximos 7 días  |
| `/api/disponibilidad/producto/[id]/bulk`           | POST   | Establecer disponibilidad para múltiples fechas |
| `/api/disponibilidad/servicio/[id]`                | GET    | Cupos disponibles de un servicio         |
| `/api/carrito/item/[itemId]`                       | PATCH  | Actualizar cantidad (valida disponibilidad) |
| `/api/carrito/validar`                             | GET    | Valida todo el carrito contra disponibilidad |

### Server Actions (`src/lib/actions.ts`)

| Action                              | Descripción                                    |
| ----------------------------------- | ---------------------------------------------- |
| `getDisponibilidadProductoAction`   | Obtiene disponibilidad para un producto/fecha  |
| `getDisponibilidadSemanaAction`     | Lista disponibilidad para 7 días               |
| `getCuposServicioAction`            | Obtiene cupos para un servicio/fecha           |
| `setDisponibilidadAction`           | Establece disponibilidad (requiere rol NEGOCIO/ADMIN) |
| `bulkSetDisponibilidadAction`       | Establece disponibilidad para múltiples fechas |
| `eliminarDisponibilidadAction`      | Elimina disponibilidad para un producto/fecha  |
| `validarCarritoAction`              | Valida el carrito completo del usuario         |
| `obtenerProductosDisponibilidadAction` | Productos del negocio con disponibilidad de 7 días |

### Componentes UI

| Componente                      | Descripción                                         |
| ------------------------------- | --------------------------------------------------- |
| `DisponibilidadBadge`           | Muestra estado: "Disponible", "Últimas unidades", "Agotado" |
| `SelectorFechaDisponibilidad`   | Selector de 7 días con indicadores de disponibilidad |
| `ProductoDetalleForm`           | Formulario de detalle de producto con selector de fecha |

## Flujo de datos

```
Negocio (dashboard)
  → Server Actions (setDisponibilidadAction, bulkSetDisponibilidadAction)
  → AdminDisponibilidadService
  → Prisma (disponibilidadProducto.upsert)

Cliente (catálogo)
  → /api/productos, /api/servicios
  → listarProductosConDisponibilidad / listarServiciosConCupos
  → DisponibilidadService.getDisponibilidadProductos / getCuposServicio

Cliente (carrito)
  → /api/carrito/item/[itemId] (PATCH)
  → DisponibilidadService.puedeComprarProducto / puedeReservarServicio

Cliente (checkout)
  → /api/carrito/validar
  → CartService.validarCarritoCompleto
  → PedidosService.crearPedido (consume disponibilidad)
```

## Reglas de negocio

1. **Corte horario**: después de las `HORA_CORTE_DISPONIBILIDAD` (22:00) local,
   no se vende para el mismo día.
2. **Fechas pasadas**: no se puede establecer disponibilidad para fechas pasadas.
3. **Ownership**: solo el dueño del negocio puede modificar disponibilidad de
   sus productos.
4. **Reservas**: las reservas consumen cupos de servicio de forma inmediata.
5. **Pedidos**: al crear un pedido, se reservan las unidades en
   `disponibilidadProducto`.

## Cómo ejecutar

```bash
# Instalar dependencias
npm install

# Aplicar migraciones
npx prisma migrate dev

# Seed de disponibilidad (productos demo + disponibilidad)
npm run db:seed:disp

# Tests unitarios
npm run test

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

# Panel de Autogestión de Negocio (Fase 1, Punto 3)

## Visión General

El panel de autogestión permite a los usuarios con rol **NEGOCIO** gestionar
sus negocios: datos, productos, servicios, inventario, horarios, disponibilidad,
logística, pedidos, reservas y ventas. Un usuario **CLIENTE** puede solicitar
el alta de un negocio; un **ADMIN** aprueba o rechaza las solicitudes.

## Modelos de datos (nuevos / extendidos)

| Modelo                  | Campos clave                                                    |
| ----------------------- | --------------------------------------------------------------- |
| `Negocio`               | `estado` (PENDIENTE/APROBADO/ACTIVO/SUSPENDIDO), `aprobadoPorId`, `aprobadoEn`, `motivoRechazo`, `permiteReservas`, `permiteEnvio`, `telefono`, `emailContacto`, `direccion` |
| `SolicitudAltaNegocio`  | `userId`, `nombreNegocio`, `areaId`, `subareaIds` (JSON), `provincia`, `municipio`, `telefono`, `emailContacto`, `direccion`, `estado`, `revisadoPorId`, `revisadoEn`, `motivoRechazo` |
| `HorarioNegocio`        | `negocioId`, `diaSemana` (0=domingo), `horaApertura`, `horaCierre`, `cerrado` |
| `NegocioSubarea`        | Relación N:N `negocioId` ↔ `subareaId`                         |
| `OpcionLogistica`       | `negocioId`, `proveedorId`, `nombre`, `tipo`, `tarifaBase`, `tarifaPorDistancia`, `tiempoEstimado` |
| `ProveedorLogistico`    | `usuarioId`, `nombre`, `zonaCobertura`, `alcanceNacional`, `contacto`, `activo` |

## Servicios de negocio

| Servicio                  | Responsabilidad                                              |
| ------------------------- | ------------------------------------------------------------ |
| `NegocioService`          | CRUD de negocio, horarios, `estaAbiertoHoy`, aprobar/rechazar/suspender/reactivar |
| `SolicitudAltaService`    | Crear solicitud, listar (usuario y pendientes), getSolicitud, cancelar, aprobar (crea negocio + horarios default), rechazar |
| `CatalogService`          | CRUD de productos y servicios, inventario (upsert), listado con pertenciencia |
| `LogisticaNegocioService` | Listar opciones, crear/actualizar/eliminar opción, listar proveedores disponibles |
| `DashboardNegocioService` | KPIs (pedidos pendientes, reservas, ventas, stock bajo), listar pedidos/reservas, actualizar estados |
| `permisos.ts` (`assertPertenencia`) | Valida ownership: propietario directo, ADMIN, (N:N vía NegocioUsuario TODO Fase 2) |

## Flujo de datos

```
CLIENTE
  → /negocios/solicitar
  → SolicitudAltaForm → crearSolicitudAltaAction
  → SolicitudAltaService.crearSolicitud → prisma.solicitudAltaNegocio.create
  → estado: PENDIENTE_APROBACION

ADMIN
  → /admin/solicitudes
  → aprobarNegocioAction → SolicitudAltaService.aprobarSolicitud
    → crea Negocio (estado=ACTIVO, aprobadoPorId)
    → crea HorarioNegocio por defecto (l-una 08:00-18:00, sáb 08:00-13:00, d-cerrado)
    → otorga rol NEGOCIO al usuario
  → rechazarNegocioAction → SolicitudAltaService.rechazarSolicitud

NEGOCIO (autogestión)
  → /negocio/* (dashboard, mi-negocio, horarios, productos, servicios, inventario, disponibilidad, logistica, pedidos, reservas, ventas)
  → Server Actions (con requireRole + assertPertenencia)
  → Servicios correspondientes → Prisma
```

## Rutas del panel

| Ruta                              | Rol             | Descripción                              |
| --------------------------------- | --------------- | ---------------------------------------- |
| `/negocio`                        | NEGOCIO, ADMIN  | Dashboard con KPIs                       |
| `/negocio/mi-negocio`             | NEGOCIO, ADMIN  | Formulario de datos del negocio          |
| `/negocio/horarios`               | NEGOCIO, ADMIN  | Editor de horarios semanales             |
| `/negocio/productos`              | NEGOCIO, ADMIN  | CRUD de productos                        |
| `/negocio/servicios`              | NEGOCIO, ADMIN  | CRUD de servicios                        |
| `/negocio/inventario`             | NEGOCIO, ADMIN  | Gestión de stock e inventario            |
| `/negocio/disponibilidad`         | NEGOCIO, ADMIN  | Disponibilidad diaria (Fase 1, Punto 2)  |
| `/negocio/logistica`              | NEGOCIO, ADMIN  | Configuración de opciones de envío       |
| `/negocio/pedidos`                | NEGOCIO, ADMIN  | Lista y actualización de estado de pedidos |
| `/negocio/reservas`               | NEGOCIO, ADMIN  | Lista y actualización de reservas        |
| `/negocio/ventas`                 | NEGOCIO, ADMIN  | Reporte de ventas y productos vendidos   |
| `/negocios/solicitar`             | CLIENTE         | Formulario de solicitud de alta          |
| `/mis-solicitudes`                | CLIENTE         | Lista de mis solicitudes                 |
| `/negocios/solicitud/[id]`        | owner, ADMIN    | Detalle de solicitud                     |
| `/admin/solicitudes`              | ADMIN           | Panel de aprobación de solicitudes       |

## Server Actions (`src/lib/actions.ts`)

| Action                              | Descripción                                    |
| ----------------------------------- | ---------------------------------------------- |
| `getNegocioAction`                  | Obtiene un negocio por ID                      |
| `listNegociosDeUsuarioAction`       | Negocio asociado al usuario actual             |
| `actualizarNegocioAction`           | Actualiza datos del negocio                    |
| `actualizarSubareasNegocioAction`   | Asigna subáreas a un negocio                   |
| `listarHorariosAction`              | Lista horarios del negocio                     |
| `actualizarHorariosAction`          | Actualiza horarios (upsert por día)            |
| `crearProductoAction`               | Crea un producto                               |
| `actualizarProductoAction`          | Actualiza un producto                          |
| `eliminarProductoAction`            | Elimina un producto                            |
| `crearServicioAction`               | Crea un servicio                               |
| `actualizarServicioAction`          | Actualiza un servicio                          |
| `eliminarServicioAction`            | Elimina un servicio                            |
| `actualizarInventarioAction`        | Upsert de inventario para un producto          |
| `listarInventarioDeNegocioAction`   | Lista inventario del negocio                   |
| `listOpcionesDeNegocioAction`       | Lista opciones de envío                        |
| `crearOpcionLogisticaAction`        | Crea una opción de envío                       |
| `actualizarOpcionLogisticaAction`   | Actualiza una opción de envío                  |
| `eliminarOpcionLogisticaAction`     | Elimina una opción de envío                    |
| `listProveedoresDisponiblesAction`  | Lista proveedores disponibles                  |
| `crearSolicitudAltaAction`          | Crea una solicitud de alta                     |
| `cancelarSolicitudAltaAction`       | Cancela una solicitud pendiente                |
| `getSolicitudAltaAction`            | Obtiene una solicitud (owner/ADMIN)            |
| `listarSolicitudesUsuarioAction`    | Lista solicitudes de un usuario                |
| `listarSolicitudesPendientesAction` | Lista solicitudes pendientes (ADMIN)           |
| `listarSolicitudesAction`           | Lista solicitudes filtradas por estado         |
| `aprobarNegocioAction`              | Aprueba solicitud, crea negocio ACTIVO         |
| `rechazarNegocioAction`             | Rechaza solicitud con motivo                   |
| `getDashboardNegocioAction`         | KPIs del dashboard del negocio                 |
| `getResumenAction`                  | Resumen rápido (alias de DashboardNegocioService.getResumen) |
| `getPedidosRecientesAction`         | Pedidos recientes del negocio                  |
| `getReservasProximasAction`         | Reservas próximas del negocio                  |
| `listarPedidosNegocioAction`        | Todos los pedidos del negocio                  |
| `listarReservasNegocioAction`       | Todas las reservas del negocio                 |
| `actualizarEstadoPedidoAction`      | Cambia estado de un pedido                     |
| `actualizarReservaAction`           | Cambia estado de una reserva                   |
| `prepararCheckoutAction`            | Prepara el checkout (cliente)                  |
| `confirmarCheckoutAction`           | Confirma y crea pedidos por negocio (cliente)  |
| `recalcularTotalesAction`           | Recalcula subtotal + IVA + envío                |
| `getOpcionesLogisticaAction`        | Lista opciones de envío de un negocio          |
| `listarPedidosDeUsuarioAction`      | Lista pedidos del usuario con checkout         |
| `getPedidoAction`                   | Obtiene un pedido con validación de propiedad  |
| `cambiarEstadoPedidoAction`         | Cambia estado (NEGOCIO, LOGISTICA, ADMIN)      |
| `estaAbiertoHoyAction`              | Verifica si el negocio está abierto hoy        |
| `listarAreasAction`                 | Lista áreas activas                            |
| `listarSubareasAction`              | Lista subáreas activas                         |

## Reglas de negocio

1. **Corte horario**: después de las `HORA_CORTE_DISPONIBILIDAD` (22:00) local,
   no se vende para el mismo día.
2. **Fechas pasadas**: no se puede establecer disponibilidad para fechas pasadas.
3. **Ownership**: solo el dueño del negocio puede modificar datos, horarios,
   productos, servicios, inventario, disponibilidad, logística, pedidos y
   reservas de su negocio. ADMIN siempre tiene acceso.
4. **Reservas**: las reservas consumen cupos de servicio de forma inmediata.
5. **Pedidos**: al crear un pedido, se reservan las unidades en
   `disponibilidadProducto`.
6. **Solicitud de alta**: un usuario no puede tener más de una solicitud pendiente
   ni un negocio ACTIVO simultaneamente.
7. **Aprobación**: al aprobar, se crea el negocio en estado ACTIVO, se asignan
   horarios por defecto y se promueve el rol a NEGOCIO.

---

# Checkout con Logística Elegible (Fase 1, Punto 4)

## Visión General

El checkout formaliza el proceso de compra. Un carrito puede contener items de
varios negocios; el checkout los **agrupa por negocio** y, por cada grupo, el
cliente elige **entrega a domicilio** (con una `OpcionLogistica` del negocio) o
**recogida en tienda**. Al confirmar, se crea **un `Pedido` por negocio** en una
transacción Prisma atómica.

## Decisiones de diseño

- **Un Pedido por negocio** (no pedido padre/hijo): cada negocio factura,
  asigna logística y evoluciona de estado independientemente.
- **Snapshot de precios y dirección**: el `precioUnitario` y `direccionEntrega`
  se guardan en el pedido al momento de la compra, no como referencias vivas.
- **Idempotencia**: `prepararCheckout` genera un `checkoutToken` almacenado en
  caché (30 min). `confirmarCheckout` lo valida para prevenir duplicados.
- **No se implementa pasarela de pago** en este punto. El checkout termina con
  el pedido en estado `pendiente` y una pantalla de confirmación.

## Modelo de datos (Pedido)

| Campo | Tipo | Notas |
|---|---|---|
| `negocioId` | `String` | Requerido, indexado — el negocio al que pertenece |
| `tipoEntrega` | `TipoEntrega` | `DOMICILIO` (default) \| `RECOGIDA_TIENDA` |
| `opcionLogisticaId` | `String?` | Null si recogida |
| `costoEnvio` | `Float` | 0 si recogida |
| `direccionEntrega` | `String?` | Snapshot, nullable |
| `fechaEntrega` | `DateTime?` | Del carrito / selector de fecha |
| `notas` | `String?` | Instrucciones del cliente |
| `negocioIds` | `Json` | Array de IDs para compatibilidad legacy |

## Servicios de negocio

| Servicio | Responsabilidad |
|---|---|
| `CheckoutService` | `prepararCheckout` (agrupa, valida disponibilidad), `confirmarCheckout` (transacción, crea pedidos), `recalcularTotales` (IVA + envío) |
| `LogisticaService` | `listOpcionesParaCheckout` (opciones activas por negocio), `validarOpcion` (ownership + activo), `calcularCostoEnvio` |
| `PedidosService` | `listPedidosDeUsuario`, `getPedido` (con validación de propiedad) |
| `DashboardNegocioService` | `listarPedidos` filtra por `negocioId` (no por items) |

## Server Actions (`src/lib/actions.ts`)

| Action | Descripción |
|---|---|
| `prepararCheckoutAction` | Prepara el checkout, devuelve DTO agrupado + token |
| `confirmarCheckoutAction` | Confirma el checkout, crea pedidos en transacción |
| `recalcularTotalesAction` | Recalcula subtotal, IVA, envío según selección |
| `getOpcionesLogisticaAction` | Lista opciones de envío activas de un negocio |
| `listarPedidosDeUsuarioAction` | Lista pedidos del usuario con negocio, tipo entrega, envío |
| `getPedidoAction` | Obtiene un pedido con validación de propiedad |
| `cambiarEstadoPedidoAction` | Cambia estado (NEGOCIO, LOGISTICA, ADMIN) |

## API Routes

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/checkout/preparar` | POST | Devuelve el DTO de checkout agrupado |
| `/api/checkout/confirmar` | POST | Crea los pedidos en transacción |
| `/api/checkout/recalcular` | POST | Recalcula totales |
| `/api/negocios/[id]/opciones-logistica` | GET | Lista opciones de envío (público, cacheado) |
| `/api/pedidos` | GET | Lista pedidos con `negocio`, `tipoEntrega`, `costoEnvio`, `opcionLogistica` |

## Códigos de error

| Código | HTTP | Condición |
|---|---|---|
| `CARRITO_VACIO` | 400 | El carrito está vacío |
| `SIN_DISPONIBILIDAD` | 409 | Un item no tiene disponibilidad |
| `OPCION_INVALIDA` | 400 | La opción logística no pertenece al negocio |
| `DIRECCION_REQUERIDA` | 400 | Falta dirección para entrega a domicilio |
| `CONFLICTO` | 409 | Token inválido, items inconsistentes |
| `NO_AUTORIZADO` | 403 | Rol insuficiente |

| `/api/admin/facturas/[id]`         | GET   | Detalle de factura (ONAT)                    |

### Server Actions (`src/lib/actions.ts`)

| Action                              | Descripción                                    |
| ----------------------------------- | ---------------------------------------------- |
| `getDatosFiscalesAction`            | Obtiene datos fiscales del negocio             |
| `actualizarDatosFiscalesAction`     | Actualiza NIT, régimen, tasa, prefijo, etc.   |
| `getFacturaAction`                  | Detalle de una factura                         |
| `descargarFacturaAction`            | Exporta factura a HTML                         |
| `simularIVAAction`                  | Simula cálculo de IVA para preview             |
| `emitirFactura`                     | Emite factura desde un pedido (ONAT)           |
| `listarFacturas`                    | Lista facturas (filtra por usuario/negocio)   |

### Servicios de negocio

| Servicio                         | Responsabilidad                                      |
| -------------------------------- | ---------------------------------------------------- |
| `IVAService`                     | Cálculo de IVA cubano (10%), pure functions          |
| `CheckoutService`                | Integra IVAService, snapshots fiscales en Pedido     |
| `FacturaService`                 | Emisión, listado, descarga de facturas (ONAT)        |
| `NegocioService`                 | getDatosFiscales, actualizarDatosFiscales, KPIs      |
| `CatalogService`                 | CRUD con tratamientoIVA y tasaIVAOverride             |

### IVA cubano (10%)

| Concepto               | Detalle                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `RegimenFiscal`        | `GENERAL` (aplica IVA), `SIMPLIFICADO`, `EXENTO`, `NO_SUJETO` |
| `ModoPrecio`           | `IVA_INCLUIDO` (precio con IVA), `IVA_AGREGADO` (IVA suma)  |
| `TratamientoIVA`       | `GRAVADO` (aplica IVA), `EXENTO`, `NO_SUJETO`               |
| Tasa por defecto       | 10%                                                        |
| Negocios no GRAVADOS   | No pueden tener productos con `tratamientoIVA: GRAVADO`     |
| Formato factura        | `PR-AAAA-NNNNNN` (prefijo configurable por negocio)         |

## Frontend

### Ruta `/checkout` (client)
Asistente de pasos: Resumen → Entrega → Confirmar.
- `GrupoNegocioCard`: card por negocio con items, subtotal, selector de entrega.
- `SelectorEntrega`: radio DOMICILIO/RECOGIDA_TIENDA + select de opción logística + input dirección.
- `ResumenTotales`: subtotal, IVA, envío, total (con `aria-live="polite"`).
- `PasoCheckout`: indicador visual de pasos con `aria-current`.
- `SelectorFechaEntrega`: adaptación del `SelectorFechaDisponibilidad`.

### Ruta `/checkout/confirmacion`
Muestra los pedidos creados, total general, enlaces a `/pedidos`.

### `/carrito`
Botón "Iniciar checkout" (navega a `/checkout`). Deshabilitado si hay items
sin disponibilidad. Muestra aviso si el carrito tiene items de N negocios.

### `/pedidos`
Agregada columna "Negocio". Modal de detalle muestra tipo de entrega, costo de
envío, dirección y opción logística.

### Panel de negocio `/dashboard/negocio/pedidos`
Tabla con columnas: Pedido, Cliente, Tipo Entrega, Envío, Productos, Total, Estado.
Permite cambiar el estado del pedido.

---

# Sistema de Pagos (Fase 1, Punto 5)

> **Contexto Cuba:** No se integran pasarelas como Stripe o PayPal. El flujo es
> manual/semi-automático: efectivo, transferencia bancaria, pago móvil.

## Visión General

Un **Pago** está asociado 1:1 a un **Pedido**. El cliente selecciona un método de
pago al confirmar el checkout (o posteriormente), sube referencia/comprobante si
es necesario, y el negocio/admin confirma la recepción del pago.

Estado inicial: `PENDIENTE`. Transiciones: `EN_PROCESO` → `COMPLETADO` →
`REEMBOLSADO` o `FALLIDO`. Cualquiera puede `CANCELAR` si está `PENDIENTE`.

## Modelos de datos

| Modelo  | Campos clave |
| ------- | ------------- |
| `Pago`  | `pedidoId` 1:1, `metodo` (enum), `estado` (enum, default PENDIENTE), `monto`, `moneda`, `referencia` (deprecado), `idTransferencia` (`@unique`), `entidadPago`, `fechaTransferencia`, `idTransferenciaReembolso`, `fechaReembolso`, `comprobanteUrl`, `notasCliente`, `notasNegocio`, `confirmadoPorId`, `confirmadoEn`, `codigoEntregaHash`, `codigoEntregaExpira`, `codigoEntregaIntentos`, `codigoEntregaRegeneraciones`, `codigoEntregaUsadoEn`, `codigoEntregaBloqueado`, `confirmacionManual`, `motivoConfirmacionManual` |
| `Pedido` | agrega `estadoPago` (String, default "PENDIENTE", denormalizado) |

### Enums

| Enum           | Valores |
| -------------- | ------- |
| `MetodoPago`   | `EFECTIVO_CONTRA_ENTREGA`, `TRANSFERENCIA_BANCARIA`, `PAGO_MOVIL`, `TARJETA` (reservado) |
| `EstadoPago`   | `PENDIENTE`, `EN_PROCESO`, `COMPLETADO`, `FALLIDO`, `REEMBOLSADO`, `CANCELADO` |

Métodos disponibles: `EFECTIVO_CONTRA_ENTREGA`, `TRANSFERENCIA_BANCARIA`,
`PAGO_MOVIL`. `TARJETA` está reservado (no disponible).

## Servicios de negocio

| Servicio        | Responsabilidad |
| --------------- | --------------- |
| `PagoService`   | CRUD de pagos: crear (PENDIENTE/EN_PROCESO), subir comprobante (EN_PROCESO), confirmar (COMPLETADO), rechazar (FALLIDO), reembolsar (REEMBOLSADO), cancelar (CANCELADO), getResumenPagos KPIs, conciliación por idTransferencia |

### Reglas de negocio

- `crearPagoParaPedido`: valida propiedad (CLIENTE dueño o NEGOCIO dueño del negocio),
  valida coherencia método ↔ tipo de entrega, verifica que no exista ya un pago.
  Estado inicial: `PENDIENTE` (EFECH) o `EN_PROCESO` (si método requiere
   comprobante y se subió referencia).
- `confirmarPago`: solo NEGOCIO dueño o ADMIN. Sincroniza `pedido.estadoPago`.
- `rechazarPago`: solo NEGOCIO dueño o ADMIN. Requiere motivo (mínimo 3 caracteres).
- `reembolsarPago`: solo ADMIN. Estado `COMPLETADO` → `REEMBOLSADO`. Opcionalmente
  registra `idTransferenciaReembolso` + `fechaReembolso`.
- `cancelarPago`: CLIENTE dueño, NEGOCIO dueño, o ADMIN. Estado `PENDIENTE` →
  `CANCELADO`.
- `subirComprobante`: CLIENTE dueño o ADMIN. Pasa a `EN_PROCESO`. Valida formato de
  `idTransferencia` según `entidadPago` (ver sección de Conciliación abajo).
- `PedidosService.actualizarEstado`: cancelar un pedido `COMPLETADO` requiere
  reembolso previo.

### Conciliación de transferencias (Fase 1, Punto 5)

El campo `Pago.idTransferencia` es **`@unique`** — actúa como ID de operación
de la transferencia o pago móvil. Se usa para reconciliar pagos recibidos en
cuentas bancarias con pedidos en el sistema.

**Entidades soportadas y formatos esperados:**

| Entidad            | Formato esperado (regex)        |
| ------------------ | ------------------------------- |
| Transfermovil      | `TM-YYYY-NNNNNN`                |
| EnZona             | `EZ-YYYY-NNNNNN`                |
| BPA                | `BPA-YYYY-NNNNNN`               |
| BancoMetropolitano | `BM-YYYY-NNNNNN`                |
| BPI                | `BPI-YYYY-NNNNNN`               |

**Flujo de conciliación:**

1. El cliente sube `idTransferencia` + `entidadPago` + `fechaTransferencia`
   al subir el comprobante (`subirComprobanteAction` / `crearPagoParaPedido`).
2. `PagoService.validarIdTransferencia` valida el formato. Si falla → 400
   `VALIDACION`.
3. `PagoService.existeIdTransferencia` verifica unicidad antes de submit (API
   `/api/pagos/verificar-id`). P2002 → 409 `DUPLICADO`.
4. `PagoService.buscarPagoPorIdTransferencia` busca el pago por ID (conciliación
   inversa: el negocio introduce el ID del movimiento bancario y el sistema
   encuentra el pedido asociado).
5. Al reembolsar (`reembolsarPago`), se registra `idTransferenciaReembolso` +
   `fechaReembolso`.
6. En la factura (`FacturaService.emitirFactura`), se hace *snapshot* de
   `idTransferencia`, `entidadPago`, `fechaTransferencia` desde el Pago y se
   muestra en el HTML descargable.

**Campo `referencia` (deprecado):**
`Pago.referencia` se redefine como "número de tarjeta/cuenta destino". No es el
ID de operación. Los nuevos pagos usan `idTransferencia` como ID canónico.
`PagoService` detecta pagos con `referencia` que parezcan IDs de operación
(transferencias/pagos móviles sin `idTransferencia`) y los logguea para
revisión manual durante el seed.

## API Routes

| Endpoint | Método | Descripción |
| -------- | ------ | ----------- |
| `/api/pagos` | GET | Lista pagos del usuario (con filtros `estado`, `metodo`, `entidadPago`, `idTransferencia`, `page`, `limit`) o pago de un pedido (`?pedidoId=...`) |
| `/api/pagos` | POST | Crea un nuevo pago para un pedido (`crearPagoAction`) |
| `/api/pagos/verificar-id` | GET | Verifica unicidad/disponibilidad de un `idTransferencia` (`?idTransferencia=...`) |
| `/api/pagos/[id]` | GET | Obtiene detalle completo de un pago |
| `/api/pagos/[id]` | POST | Acciones: `confirmar`, `rechazar`, `reembolsar`, `cancelar`, `subir_comprobante`, `confirmar_con_codigo`, `validar_codigo`, `obtener_codigo`, `regenerar_codigo` |
| `/api/pagos/[id]/recibo` | GET | Genera recibo HTML descargable |
| `/api/negocio/pagos` | GET | Lista pagos del negocio del usuario autenticado |
| `/api/admin/pagos` | GET | Lista todos los pagos + resumen KPIs (admin only; filtros `estado`, `metodo`, `entidadPago`, `idTransferencia`) |
| `/api/admin/pagos/por-entidad` | GET | KPIs de pagos agrupados por entidadPago para un negocio (`?negocioId=...`) |
| `/api/negocios/[id]/pagos` | GET | Lista pagos de un negocio por ID |

## Server Actions

| Action | Rol requerido | Descripción |
| ------ | ------------- | ----------- |
| `crearPagoAction` | CLIENTE/ADMIN | Crea pago para un pedido (incluye `idTransferencia`, `entidadPago`, `fechaTransferencia`) |
| `subirComprobanteAction` | CLIENTE/ADMIN | Sube referencia/comprobante + `idTransferencia`/`entidadPago` |
| `confirmarPagoAction` | NEGOCIO/ADMIN | Confirma pago → COMPLETADO |
| `rechazarPagoAction` | NEGOCIO/ADMIN | Rechaza pago → FALLIDO |
| `reembolsarPagoAction` | ADMIN | Reembolsa pago → REEMBOLSADO (registra `idTransferenciaReembolso`) |
| `cancelarPagoAction` | CLIENTE/NEGOCIO/ADMIN | Cancela pago → CANCELADO |
| `getPagoAction` | CLIENTE/NEGOCIO/ADMIN | Detalle de pago |
| `getPagoDePedidoAction` | CLIENTE/NEGOCIO/ADMIN | Pago de un pedido |
| `listPagosDeUsuarioAction` | CLIENTE/ADMIN | Lista paginada (filtros `estado`, `metodo`, `entidadPago`, `idTransferencia`) |
| `listPagosDeNegocioAction` | NEGOCIO/ADMIN | Lista por negocio (filtros `estado`, `metodo`, `entidadPago`, `idTransferencia`) |
| `getResumenPagosAction` | NEGOCIO/ADMIN | KPIs de pagos |
| `getResumenPagosPorEntidadAction` | NEGOCIO/ADMIN | KPIs por entidadPago |
| `verificarIdTransferenciaAction` | público | Verifica disponibilidad de ID de transferencia |
| `buscarPagoPorIdTransferenciaAction` | CLIENTE/NEGOCIO/ADMIN | Busca pago por ID de transferencia (conciliación) |
| `getCodigoEntregaAction` | CLIENTE | Obtiene el código de entrega desde caché (solo dueño) |
| `regenerarCodigoEntregaAction` | CLIENTE/ADMIN | Regenera código (max 3 veces, requiere motivo) |
| `validarCodigoEntregaAction` | NEGOCIO/ADMIN | Valida código (no devuelve el código plano) |
| `confirmarPagoConCodigoAction` | NEGOCIO/ADMIN | Confirma pago con código correcto → COMPLETADO |

## Componentes UI

| Componente | Ruta | Descripción |
| ---------- | ---- | ----------- |
| `EstadoPagoBadge` | `src/components/pagos/` | Badge con color según estado |
| `MetodoPagoSelector` | `src/components/pagos/` | Selector de método de pago |
| `ComprobanteForm` | `src/components/pagos/` | Formulario de referencia/comprobante |
| `ReciboPago` | `src/components/pagos/` | Vista de recibo de pago |
| `AccionesPago` | `src/components/pagos/` | Botones según rol y estado; incluye modal de confirmación con código para EFECTIVO_CONTRA_ENTREGA |
| `CodigoEntregaCard` | `src/components/pagos/` | Muestra código de entrega (solo CLIENTE dueño); con regeneración y bloqueo |
| `ResumenPagos` | `src/components/pagos/` | Tarjetas KPI de resumen |

## Rutas frontend

| Ruta | Descripción |
| ---- | ----------- |
| `/pagos` | Lista de pagos del usuario; soporta `?pedidoId=` para ver pago de un pedido |
| `/pagos/[id]` | Detalle de pago con recibo, acciones y formulario de comprobante |
| `/pagos/[id]/recibo` (API) | Recibo HTML descargable |
| `/admin/pagos` | Panel admin con resumen KPIs y tabla de pagos |
| `/negocio/pagos` | Panel negocio con filtros de estado |
| `/pedidos` | Lista de pedidos con columna `estadoPago` y enlace a pago |
| `/checkout/confirmacion` | Muestra estado de pago del pedido con enlace a `/pagos?pedidoId=`; incluye código de entrega para EFECTIVO_CONTRA_ENTREGA |

## Tests

- **Vitest** (`src/tests/pagos.test.ts`): 30 tests cubriendo crearPagoParaPedido,
  subirComprobante, confirmarPago, rechazarPago, reembolsarPago, cancelarPago,
  getResumenPagos, validación de idTransferencia/entidadPago, conciliación
  (buscarPagoPorIdTransferencia, existeIdTransferencia) y KPIs porEntidad.
- **Vitest** (`src/tests/pagos-efectivo.test.ts`): 15 tests cubriendo generación,
  validación, confirmación con código, regeneración, bloqueo y expiración.
- **Playwright** (`visual-tests/`): tests de accesibilidad y regresión visual
  para `/pagos`, `/pagos/[id]`, `/negocio/pagos`, `/admin/pagos`.
- **E2E** (`tests/payment-flow.test.mjs`): flujo de navegación y acciones de pago.

## Código de confirmación para EFECTIVO_CONTRA_ENTREGA

### Resumen

Para pagos **EFECTIVO_CONTRA_ENTREGA**, el sistema genera un código de 6 dígitos
que el CLIENTE muestra al negocio para confirmar la recepción del pago en efectivo.

### Flujo

1. **Generación automática:** Al crear un pago `EFECTIVO_CONTRA_ENTREGA` en
   estado `PENDIENTE` (vía `crearPagoParaPedido` o `confirmarCheckout`), se
   genera un código, se hashea con **bcrypt** (12 rounds) y se almacena el hash
   en `codigoEntregaHash`. El código plano se cachea en memoria (TTL 7 días).
2. **Visualización (CLIENTE):** La página de detalle de pago (`/pagos/[id]`)
   muestra el código al CLIENTE dueño mediante `CodigoEntregaCard`. El código se
   obtiene de la caché, nunca de la DB.
3. **Validación (NEGOCIO/ADMIN):** El negocio introduce el código en un modal
   (`AccionesPago` → botón "Confirmar con código"). Se llama a
   `validarCodigoEntrega` que verifica el hash con `bcrypt.compare`.
4. **Confirmación:** Si el código es correcto, `confirmarConCodigoEntrega`
   marca el pago como `COMPLETADO`, registra `codigoEntregaUsadoEn` y
   consume el código (lo elimina de la caché).

### Reglas de seguridad

- El código plano **nunca** se almacena en la DB (solo el hash bcrypt).
- El código plano **nunca** se devuelve al NEGOCIO ni ADMIN. Solo el CLIENTE
  dueño del pedido puede verlo.
- Intentos fallidos: máximo **5**. Al superarlo, `codigoEntregaBloqueado = true`.
- **7 días** de expiración (`codigoEntregaExpira`).
- Máximo **3 regeneraciones** (`codigoEntregaRegeneraciones`), requiere motivo
  mínimo de 20 caracteres.
- Bloqueo se despeja al regenerar o al confirmar con código correcto.

### Script de migración retroactiva

`scripts/generar-codigos-entrega-pendientes.ts` genera códigos para pagos
`EFECTIVO_CONTRA_ENTREGA` existentes sin código:
```
npx tsx scripts/generar-codigos-entrega-pendientes.ts
```

---

# Correcciones de typos (Fase 2, Punto 7)

## Resumen

Durante la auditoría de calidad se detectaron y corrigieron **typos silenciosos** en
dos servicios críticos. Estos errores no rompían la compilación de TypeScript pero
causaban comportamientos incorrectos en runtime.

## Typos corregidos

| Archivo | Línea | Typo | Tipo | Impacto | Corrección |
|---------|-------|------|------|---------|------------|
| `ReservaService.ts` | ~20 | `fechaHoraFincio` (en `CrearReservaParams`) | typo en interfaz pública | medio — propaga a todos los consumidores | Renombrado a `fechaHoraInicio` |
| `ReservaService.ts` | ~56 | `const fechaIni = new Date` (sin `()`) | runtime bug | alto — `fechaIni` era la función constructora `Date`, no una instancia | Corregido a `new Date(datos.fechaHoraInicio)` |
| `ReservaService.ts` | ~106 | `fechaHoraFin: fechaIni` en `prisma.reserva.create()` | wrong field mapping | alto — la fecha de inicio se guardaba en `fechaHoraFin` | Corregido a `fechaHoraInicio: fechaIni, fechaHoraFin: fechaFin` |
| `PedidosService.ts` | — | `fechaIni` sin `new Date()` | runtime bug | alto | No presente en la versión actual (ya corregido) |
| `PedidosService.ts` | — | `pedidos` usado para singular | nomenclatura | bajo — confusión en lectura | Verificado: `pedidos` (array) y `pedido` (singular) usados consistentemente |

## Decisión: migración directa (sin alias deprecado)

El typo `fechaHoraFincio` estaba en la interfaz `CrearReservaParams`, que es una
interfaz **interna del proyecto** (no expuesta a clientes externos). Todos los
consumidores fueron identificados y actualizados:

- `src/services/ReservaService.ts` — definición de la interfaz
- `src/lib/actions.ts` — función `crearReserva`
- `src/app/api/reservas/route.ts` — endpoint API
- `src/tests/integration.test.ts` — tests existentes
- `src/tests/disponibilidad.test.ts` — tests de disponibilidad

No se añadió un alias `@deprecated` porque el alcance es interno y el riesgo de
romper consumidores externos es nulo.

## Tests de regresión añadidos

Archivo: `src/tests/regresion-typos.test.ts` (21 tests)

- **Type-level**: `@ts-expect-error` verifica en compilación (`tsc --noEmit`) que
  `fechaHoraFincio` no existe en `CrearReservaParams`. Si se reintroduce,
  `tsc` falla con "Unused '@ts-expect-error' directive".
- **Runtime**: `toBeInstanceOf(Date)` y `typeof getTime === "function"` verifican
  que `fechaIni` es una instancia de `Date`, no la función constructora.
- **Integración**: flujo completo `crearReserva → listarReservas` y
  `crearPedido → getPedido → listPedidosDeUsuario`, verificando fechas como
  instancias de `Date` en la base de datos.
- **Nomenclatura**: test funcional que verifica `pedidos` (plural) es un array
  y cada elemento es un `pedido` (singular) con propiedades correctas.

## Cobertura

| Archivo | Cobertura |
|---------|-----------|
| `ReservaService.ts` | 98.1% statements, 100% funciones |
| `PedidosService.ts` | 84.2% statements, 87.5% funciones |

> `crearDesdeCarrito` en `PedidosService` no está cubierto por estos tests porque
> delega toda la lógica a `CheckoutService` (cubierto en `checkout.test.ts`).
> No modifica fechas ni nombres afectados por los typos.

---

# Capa de autenticación

> Ver también: `docs/SERVICE_ARCHITECTURE.md` (sección "Capa de autenticación" —
> versión detallada) y `docs/admin-generic.md` (políticas de admin genérico).

## Visión general

- **NextAuth.js 5.0.0-beta.32** (Credentials provider, strategy: JWT)
- `maxAge` global: 30 días
- `rememberMe`: true → 30 días; false → 24h (JWT `exp` override)
- `updateAge: 1h` — el `session` callback valida `sessionVersion` contra BD
- `NEXTAUTH_SECRET` validado en build (`src/lib/auth/validate-env.ts`)
- bcrypt 12 rounds (`BCRYPT_ROUNDS` en `src/lib/auth/constants.ts`)

### Roles

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Acceso completo al panel admin |
| `CLIENTE` | Rol por defecto en registro público |
| `NEGOCIO` | Propietario/gestor de negocio (solo via solicitud + aprobación) |
| `LOGISTICA` | Proveedor logístico |

**Workaround C8 (Etapa 3):** un usuario con rol `CLIENTE` que es dueño de un
`Negocio` (`Negocio.userId === user.id`) puede acceder a rutas `/negocio`
mediante `esPropietarioDeAlgunNegocio()` en `NegocioService`. Multi-rol real N:N
diferido a **Fase 4**.

### Flujos

#### Registro

- Endpoint: `POST /api/auth/registro` → `src/app/api/auth/registro/route.ts`
- Siempre crea `CLIENTE` (forzado server-side; el campo `rol` en el body es ignorado)
- Normaliza email y username a lowercase
- Política de contraseña: 10+ chars, letra, número, lista negra (~50 entries)
- bcrypt 12 rounds (`BCRYPT_ROUNDS`)
- Evento: `REGISTRO_USUARIO`
- Para obtener `NEGOCIO`: solicitud via `/negocios/solicitar` + aprobación admin

#### Login

- Credentials provider → `src/lib/auth/credentials-authorize.ts`
- Normaliza identifier (email/username) a lowercase
- Query busca por `email` o `username` con `isActive: true`
- `isActive: false` → login falla con "Credenciales inválidas" (anti-enumeración)
- `mustChangePassword: true` → login permitido pero middleware redirige a `/perfil/cambiar-password`
- bcrypt compare (12 rounds)
- Eventos: `LOGIN_EXITOSO`, `LOGIN_FALLIDO`, `LOGIN_FALLIDO_USUARIO_INACTIVO`
- Mensajes de error genéricos (anti-enumeración)

#### Reset de contraseña

1. `POST /api/auth/recuperar` → `src/app/api/auth/recuperar/route.ts`
   - Genera token UUID (alta entropía)
   - **Hashea** con SHA-256 (`hashToken` de `src/lib/auth/token-hash.ts`) antes de guardar
   - Expiración: 1 hora, single-use
   - No loggea el token
   - Evento: `PASSWORD_RESET_SOLICITADO`
2. `POST /api/auth/resetear` → `src/app/api/auth/resetear/route.ts`
   - Token recibido en POST body (nunca en query string)
   - `verifyToken` (SHA-256 + `timingSafeEqual`) valida el hash
   - Actualiza password con bcrypt 12 rounds
   - Incrementa `sessionVersion`
   - Evento: `PASSWORD_RESET_COMPLETADO`

#### Cambio de password

- `POST /api/perfil` (action: `cambiarPassword`) → `src/lib/actions.ts`
- Valida password actual con `bcrypt.compare`
- Aplica `validarPassword` (política centralizada)
- bcrypt 12 rounds para el nuevo hash
- Incrementa `sessionVersion: { increment: 1 }`
- Si era `mustChangePassword: true`, lo pone a `false` y registra `PASSWORD_CAMBIADO_OBLIGATORIO`
- Evento: `PASSWORD_CAMBIADO`
- Fuerza re-login (el JWT anterior es invalidado en el próximo `updateAge`)

#### Logout

- Client-side (limpia cookies de sesión)
- `sessionVersion` no se incrementa en logout (solo en cambios de estado)
- La próxima vez que el JWT expirado intente refresh, el `session` callback
  detecta el mismatch de `sessionVersion` y invalida

## Seguridad implementada

| Medida | Implementación | Archivo |
|--------|---------------|---------|
| bcrypt 12 rounds | `BCRYPT_ROUNDS = 12` constante | `src/lib/auth/constants.ts` |
| Password policy | 10 chars + letra + número + lista negra | `src/lib/auth/password-policy.ts` |
| `isActive` bloquea login | Filtrado en `credentialsAuthorize` | `src/lib/auth/` |
| `mustChangePassword` | Middleware redirige a cambio obligado | `src/middleware.ts` |
| `NEXTAUTH_SECRET` validado | Build fails en prod si < 32 chars | `src/lib/auth/validate-env.ts` |
| Token reset hasheado | SHA-256 + `timingSafeEqual` | `src/lib/auth/token-hash.ts` |
| Anti-enumeración | Mensajes genéricos en login y recuperación | todos los endpoints |
| Auditoría de auth | 10+ eventos en `AuditLog` | `src/services/utils/audit.ts` |
| `sessionVersion` | Invalida JWT tras cambio de password/rol | `src/lib/actions.ts` |
| Normalización | lowercase en email/username | todos los endpoints |

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
| `PASSWORD_CAMBIADO` | Cambio de password vía API |
| `PASSWORD_CAMBIADO_OBLIGATORIO` | Password cambiada con `mustChangePassword: true` |
| `ROL_CAMBIADO` | Asignación de rol ADMIN |
| `ROL_MIGRADO_AUTOREGISTRO` | Migración B1 (degradado NEGOCIO → CLIENTE) |
| `ACCOUNT_DELETED` | Eliminación de cuenta |
| `SESSION_INVALIDATED` | `sessionVersion` mismatch detectado |

### Tests de arquitectura

`src/tests/architecture-auth.test.ts` — 10 tests de análisis estático que verifican:

1. Registro solo permite `CLIENTE`
2. Formulario de registro sin selector de rol
3. Todo `/api/admin/*` valida rol `ADMIN`
4. Mutaciones usan `assertPertenencia`
5. Tokens de reset se hashean
6. No hay `console.log` con tokens/passwords/secrets
7. Servicios no importan Next.js
8. Helpers de auth no importan Next.js
9. `sessionVersion` se incrementa al cambiar password
10. bcrypt usa 12 rounds en producción

## Matriz rutas ↔ roles

| Ruta | Rol | Notas |
|------|-----|-------|
| `/auth/login` | público | Credentials provider |
| `/auth/registro` | público | Siempre `CLIENTE` |
| `/auth/recuperar` | público | POST, token en body |
| `/auth/resetear/[token]` | público | Token en POST body, no en query string |
| `/perfil/cambiar-password` | auth requerido | Si `mustChangePassword`, es la única ruta accesible |
| `/cliente/*` | CLIENTE | Catálogo, carrito, pedidos, pagos |
| `/negocio/*` | NEGOCIO, ADMIN | También CLIENTE si dueño de negocio (workaround C8) |
| `/negocios/solicitar` | CLIENTE | Solicitud de alta de negocio |
| `/admin/*` | ADMIN | Panel de administración |
| `/api/admin/*` | ADMIN | Endpoints protegidos con `requireRole` |
| `/logistica/*` | LOGISTICA, ADMIN | Asignación y seguimiento de pedidos |

## Pendientes (Fase 3/4)

- ⏳ **Rate limiting** — login, registro, recuperación (`[TODO Fase 3]`)
- ⏳ **Lockout** por intentos fallidos (`failedLoginAttempts`, `lockedUntil` — campos ya en schema)
- ⏳ **2FA** para admin (TOTP)
- ⏳ **Email verification** real (requiere proveedor SMTP)
- ⏳ **Multi-rol N:N** (`NegocioUsuario` — workaround actual: dueño accede a `/negocio`)
- ⏳ **Structured logging** (winston/pino)
- ⏳ **Logout revocation** server-side (base: `sessionVersion`)

Cada uno con `TODO` en el código correspondiente.

---

# Migración a Nest.js (Fase 4)

## Estado actual (auditoría: Fase 2, Punto 8)

### `nest-compat.ts` — NO EXISTE

El archivo `src/services/nest-compat.ts`, mencionado en esta documentación como
"adaptadores para Nest.js DI", **no existe en el repositorio**. No está en disco,
no aparece en la historia de git, y **ningún archivo lo importa**.

**Decisión (Estrategia B):** No se crea código preparativo para Nest.js ahora,
porque sería código muerto. La migración real se implementará en Fase 4 con
providers Nest.js que consuman los servicios directamente.

> **TODO (Fase 4):** Crear `src/infrastructure/nestjs/` con:
> - `tokens.ts` — tokens de inyección (`Symbol()` para cada servicio y abstracción).
> - `providers.ts` — array de providers Nest.js que instancien los servicios con
>   sus dependencias inyectadas.
> - `nestjs.module.ts` — módulo Nest.js que exporte los providers.
>
> Los servicios ya son framework-agnostic (verificado por
> `src/tests/architecture.test.ts`), así que el adaptador de DI será el único
> código nuevo necesario.

### `ServiceRegistry.ts` — NO EXISTE

Tampoco existe `ServiceRegistry.ts` en `src/services/`. No hay registro de
servicios ni resolución de dependencias vía patrón Registry. La documentación
mencionaba este archivo pero **nunca fue creado**.

Los servicios se instancian **directamente con `new`** en:
- `src/lib/actions.ts` (module-level singletons)
- Algunas Server Actions y API Routes

**Decisión (Estrategia B):** No se crea un ServiceRegistry ahora. En Fase 4,
Nest.js provee su propio contenedor DI, que reemplazará las instancias
manuales de `new Service()`.

### `InMemoryEventBus` — PREPARADO, NO USADO

`src/infrastructure/eventBus/InMemoryEventBus.ts` existe y está exportado desde
`src/infrastructure/index.ts`. Sin embargo, **ningún servicio publica eventos ni
se suscribe a handlers**.

- `IEventBus.ts` documenta: "Not currently used in production but part of the
  infrastructure layer for future microservices migration."
- `getEventBus()` / `resetEventBus()` existen como singleton factory.
- **Estado:** scaffolding preparado para Fase 4. No se elimina porque el
  archivo `IEventBus` y `InMemoryEventBus` son interfaces/literatura válidas
  que no causan código muerto confuso (están claramente documentados).

> **TODO (Fase 4):** Conectar `IEventBus` a servicios que emitan eventos de
> dominio (p.ej. `PedidoCreado`, `PagoConfirmado`) y reemplazar `InMemoryEventBus`
> por RabbitMQ/Kafka.

### Verificación de framework-agnostic

**VERIFICADO POR TEST:** `src/tests/architecture.test.ts` verifica que
`src/services/` no importa `next/` ni `@nestjs/*`. El test pasa.

**Servicios importan de:**
- `@/lib/db/prisma` — Prisma client singleton
- `@/generated/prisma/client` — tipos Prisma
- `@/infrastructure` — `ICache`, `getCache`, `cacheKeys`, `cacheTTL`
- `@/shared/*` — tipos y utilidades compartidas
- Imports relativos entre servicios (`@/services/DisponibilidadService`, etc.)

### Riesgos identificados para la migración

Estos son los obstáculos que habría que abordar al migrar a Nest.js en Fase 4:

1. **Acoplamiento interno de dependencias:** Algunos servicios crean sus
   dependencias internamente con `new` (p.ej. `CartService` crea
   `DisponibilidadService` internamente, `CheckoutService` crea `CartService`,
   `LogisticaService`, `PagoService`, `IVAService`). Para Nest.js DI, estos
   constructores deberían aceptar las dependencias inyectadas en lugar de
   crearlas internamente.

2. **Prisma importado directamente:** Todos los servicios importan
   `prisma` de `@/lib/db/prisma` (singleton). No hay una abstracción
   `IDatabase`. Para Nest.js, se podría inyectar `PrismaService` (extendiendo
   `PrismaClient`) como provider.

3. **Cache injectable pero opcional:** Algunos servicios aceptan `cache?: ICache`
   en el constructor, pero por defecto usan `getCache()` (singleton). En Nest.js,
   el cache se inyectaría siempre vía DI.

4. **Server Actions como punto de entrada:** El acceso principal a servicios es
   a través de `src/lib/actions.ts`. En Nest.js, esto se reemplazaría con
   controllers + routers.

### Estrategia real de migración (Fase 4)

**Fase 4:** Se migrarán los servicios de `src/services/` a microservicios
Nest.js. Los pasos serían:

1. **Crear providers Nest.js** — Para cada servicio en `src/services/`, definir
   un provider con token `Symbol` que instancie el servicio inyectando
   `ICache`, `IEventBus`, y `PrismaClient`.

2. **Refactorizar constructores** — Convertir dependencias creadas internamente
   (`new DisponibilidadService()`) a inyección de constructor. Esto NO cambia
   el comportamiento, solo el cómo se pasan las dependencias.

3. **Crear módulos Nest.js** — Un módulo por bounded context (Catalog, Checkout,
   Pagos, Negocio, etc.) que declare sus providers y exporte los servicios
   necesarios.

4. **Mover Server Actions a Controllers** — `src/lib/actions.ts` se reemplaza
   por controllers REST o gRPC en los módulos correspondientes.

5. **Migrar DB a PostgreSQL** — Cambiar `DATABASE_URL` a PostgreSQL. El código
   Prisma es idéntico; solo cambia la cadena de conexión.

6. **Reemplazar InMemoryEventBus** — Por RabbitMQ/Kafka según el bounded
   context. Los eventos de dominio definidos en Fase 4 usarán `IEventBus`.

7. **Server Actions → API** — Los endpoints REST se exponen directamente desde
   los controllers Nest.js, eliminando `src/lib/actions.ts`.

**No hay código preparativo ahora** — la migración requiere decisiones de
arquitectura (microservicios vs monolito Nest.js, boundaries, eventos de
dominio) que se tomarán en Fase 4. Mantener providers sin usar sería código
muerto.
