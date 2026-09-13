# Mi-Pyme - Arquitectura de Servicios

## Visión General

Este proyecto esta preparado para una futura migracion a microservicios usando Nest.js.
La arquitectura actual combina Next.js (App Router) con una capa de servicios
framework-agnostic que puede ser reutilizada por Nest.js sin cambios.

## Estructura de Directorios

```
src/
├── services/              # Capa de servicios de negocio
│   ├── Service.ts         # Clase base abstracta
│   ├── CatalogService.ts  # Catalogo (areas, subareas, negocios, productos, servicios)
│   ├── CartService.ts     # Carrito de compras
│   ├── ReservaService.ts  # Reservas de servicios
│   ├── PedidosService.ts  # Pedidos y logistica
│   ├── FacturaService.ts  # Facturación
│   ├── ReportesService.ts # Reportes y analiticas
│   ├── ServiceRegistry.ts # Registry de servicios (singleton)
│   └── nest-compat.ts     # Adaptores para Nest.js DI
├── infrastructure/        # Abstracciones de infraestructura
│   ├── Cache (ICache, MemoryCache, PersistentCache)
│   ├── EventBus (IEventBus, InMemoryEventBus)
│   └── Database (IDatabaseClient)
├── core/                  # Configuración centralizada
│   └── config.ts          # Variables de entorno con Zod
├── shared/                # Tipos compartidos
│   └── types.ts           # DTOs, errores de negocio, paginacion
└── lib/                   # Capa legacy (Next.js especifica)
    ├── actions.ts         # Server Actions (thin wrappers)
    ├── db/prisma.ts       # Cliente Prisma singleton
    ├── cache/             # Cache wrapper
    └── auth/              # Autenticacion NextAuth
```

## Patron de Servicios

Cada servicio:
- Extiende `Service` (clase base abstracta)
- Es framework-agnostic (no depende de Next.js)
- Usa interfaces de infraestructura (ICache, IEventBus)
- Lanza `BusinessError` (errores tipados, seguros para exponer)
- Es testable unitariamente (inyeccion de dependencias)

## Uso en Next.js (Server Actions)

```typescript
// src/lib/actions.ts (thin wrappers)
import { services } from "@/services/ServiceRegistry";

export async function listarAreas() {
  return services.catalogService.listarAreas();
}

export async function anadirItemCarrito向后Id: string, datos: AddItemParams) {
  return services.cartService.anadirItem向后Id, datos);
}
```

## Uso en Nest.js (futuro)

```typescript
// Nest.js controller
@Controller('catalog')
export class CatalogController {
  constructor(private catalog: NestCatalogService) {}

  @Get('areas')
  async listarAreas() {
    return this.catalog.listarAreas();
  }
}
```

## Migracion a Nest.js

Para migrar a microservicios con Nest.js, seguir estos pasos:

1. **Extraer servicios** - Los servicios en `src/services/` ya son framework-agnostic
2. **Configurar DI** - Usar `nest-compat.ts` como base para los providers
3. **Configurar transport** - Reemplazar `InMemoryEventBus` por RabbitMQ/Kafka
4. **Configurar base de datos** - Usar `DATABASE_URL_POSTGRES` para PostgreSQL
5. **Desplegar** - Usar Dockerfile + docker-compose.yml

## Health Checks

El endpoint `/api/health` proporciona:
- Verificación de base de datos
- Verificación de cache
- Verificación de memoria
- Uptime y version

Compatible con Docker HEALTHCHECK y Kubernetes probes.

## Containerizacion

- `Dockerfile` - Produccion (multi-stage)
- `Dockerfile.dev` - Desarrollo con hot reload
- `docker-compose.yml` - Servicios de desarrollo

## CI/CD

Ver `.github/workflows/ci-cd.yml`:
- Build y test en cada PR
- Build de Docker en main/tags
- Deploy configurable