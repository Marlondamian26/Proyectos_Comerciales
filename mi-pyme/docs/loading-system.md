# Sistema de estados de carga

Los estados de carga mantienen la estructura aproximada del contenido esperado, evitan saltos visuales y anuncian el estado a tecnologías de asistencia.

## Componentes

- `Skeleton` ofrece las variantes `text`, `rect`, `circle`, `avatar`, `badge`, `product-card` y `table-row`. `width`, `height` y `lines` son opcionales; las variantes existentes siguen siendo compatibles.
- `ProductGridSkeleton`, `ServiceGridSkeleton`, `TablePageSkeleton`, `DashboardPageSkeleton`, `FormPageSkeleton`, `DetailPageSkeleton` y `CheckoutPageSkeleton` representan patrones de página reutilizables.
- `LoadingRegion` añade `role="status"`, `aria-live="polite"` y `aria-busy="true"` al fallback, dejando los placeholders fuera del árbol accesible.
- `BrandLoader` se usa como fallback global y conserva una marca visible mientras la aplicación prepara el contenido.
- `Button` acepta `loadingText` opcional. Sin él, mantiene el texto original y comunica el estado ocupado mediante `aria-busy`; el estado loading deshabilita el botón.

Los skeletons usan colores de superficie semánticos para conservar el contraste en tema claro y oscuro. La animación shimmer se desactiva con `prefers-reduced-motion`.

## Rutas

El `loading.tsx` de raíz aporta un fallback de marca. Las rutas principales cuentan con fallbacks contextuales para catálogo, servicios, carrito/checkout, pedidos, pagos, facturas, reservas, perfil, notificaciones y autenticación. Los dashboards y secciones de gestión reutilizan loaders de dashboard, formulario o tabla según el grupo de rutas.

El `loading.tsx` de un segmento crea el límite de Suspense para su página y descendientes, pero no cubre la espera de un `layout.tsx` del mismo segmento. En rutas protegidas, la autenticación de los layouts puede terminar antes de que aparezca el fallback. No se debe debilitar la autorización para mostrar un skeleton antes; si se necesita cubrir esa espera, debe diseñarse dentro del layout y preservar sus comprobaciones.

Un `Suspense` interno solo produce streaming cuando su contenido puede suspender. No envolver JSX ya resuelto ni reemplazar estados de error/vacío por skeletons. Los fallbacks de acciones client-side son independientes de los loaders de navegación y deben reflejar la acción concreta.

## Verificación

Pruebas unitarias: `npm test -- src/tests/loading-components.test.tsx`. Tipo y estilo: `npx tsc --noEmit` y `npm run lint`.
