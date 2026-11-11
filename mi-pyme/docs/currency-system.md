# Sistema de monedas y tasas TRMI

## Alcance

El proyecto ya soporta el modelo de monedas y precios para negocios, usuarios y catálogo a través de:

- `Moneda` enum en Prisma.
- `Negocio.monedaBase`, `Negocio.monedaVisualizacion`, `Negocio.conversionAutomatica`.
- `PrecioProducto` para precios por moneda.
- `TasaCambio` para guardar tasas por moneda y fuente.
- `PreferenciaMonedaUsuario` y `User.monedaPreferida` para la elección del cliente.

## Fuente de tasas

Las tasas se obtienen desde ElToque en la URL `https://tasas.eltoque.com/v1/trmi` y se cachean durante 1 hora. Si la API falla, el sistema usa valores por defecto:

- USD: 500
- EUR: 550
- MLC: 200

## Conversión

La lógica usa CUP como puente central:

- Si la moneda origen o destino es CUP, se convierte directamente.
- Si ambas son extranjeras, se convierten a través de CUP.

## Servicios principales

- `ExchangeRateService`: obtención, caché, sincronización y conversión de tasas.
- `PrecioService`: resolución de moneda del negocio/usuario y cálculo de precios visualizados.
- `CatalogService`: soporte de métodos `listarProductosConPrecioVisual` y `listarServiciosConPrecioVisual` sin romper el catálogo existente.

## Endpoints disponibles

- `GET /api/monedas`: devuelve la última tasa disponible.
- `POST /api/monedas`: fuerza la sincronización con ElToque.
- `GET /api/monedas/preferencias?userId=...`: obtiene la preferencia del usuario.
- `POST /api/monedas/preferencias`: guarda la preferencia del usuario.
