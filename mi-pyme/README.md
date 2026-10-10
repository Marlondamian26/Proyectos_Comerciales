# Mi-Pyme

La documentación principal y completa del proyecto se mantiene en el
[README de la raíz del repositorio](../README.md).

## Inicio rápido

Desde esta carpeta:

```bash
cp .env.example .env
# Completa .env con credenciales propias antes de usar base de datos o servicios externos.
npm ci
npm run dev
```

La aplicación estará disponible en <http://localhost:3000>.

## Referencias

- [Guía general, arquitectura, rutas, datos y estado del proyecto](../README.md)
- [Despliegue en Vercel y Supabase](./docs/deploy.md)
- [Arquitectura de servicios](./SERVICE_ARCHITECTURE.md)
- [Guía de autenticación y seguridad](./CLAUDE.md)
- [Convenciones de desarrollo](./AGENTS.md)
