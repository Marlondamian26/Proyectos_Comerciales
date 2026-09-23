# Contributing a Mi-Pyme

Guía rápida para contribuir al desarrollo de la plataforma e-commerce Mi-Pyme.

## Cómo empezar

```bash
# Instalar dependencias
npm install

# Aplicar migraciones de base de datos
npx prisma migrate dev

# Iniciar servidor de desarrollo
npm run dev
```

## Tests

```bash
# Tests unitarios (Vitest)
npm test

# Tests específicos de arquitectura (auth)
npx vitest run src/tests/architecture-auth.test.ts

# Tests de accesibilidad (Playwright)
npm run test:a11y

# Tests visuales (Playwright)
npm run test:visual:comprehensive

# Tests e2e (Playwright)
npm run test:e2e
```

## Build

```bash
npm run build
npx tsc --noEmit
npm run lint
```

## Migraciones de base de datos

```bash
# Crear una nueva migración
npx prisma migrate dev --name nombre_de_la_migracion

# Aplicar migraciones en producción
npx prisma migrate deploy
```

## Scripts de migración manual

Después de deploy, ejecutar manualmente los siguientes scripts según corresponda:

| Script | Comando | Descripción |
|--------|---------|-------------|
| Normalizar emails/usernames | `npx tsx scripts/normalizar-emails-usernames.ts` | Convierte a lowercase emails y usernames. Detiene si hay colisiones. |
| Migrar negocios autoregistrados | `npx tsx scripts/migrar-negocios-autoregistrados.ts` | Degrada a CLIENTE usuarios NEGOCIO sin negocio activo asociado. |
| Generar códigos de entrega pendientes | `npx tsx scripts/generar-codigos-entrega-pendientes.ts` | Genera códigos para pagos EFECTIVO_CONTRA_ENTREGA sin código. |

Ver `docs/auth-migration.md` para orden de ejecución y verificación.

## Seguridad

Todas las contribuciones que toquen autenticación deben pasar el
**checklist de seguridad** incluido en las pull requests. Ver:
- `CLAUDE.md` → "Reglas de Autenticación y Seguridad (Etapa 5)"
- `docs/admin-generic.md`
- `SERVICE_ARCHITECTURE.md` → "Capa de autenticación"
- Tests de arquitectura: `src/tests/architecture-auth.test.ts`

## Nomenclatura

- Español para dominio (entidades, reglas de negocio).
- Inglés para infraestructura (tecnologías, patrons de arquitectura).
- Plural para arrays, singular para entidades individuales.
