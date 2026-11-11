# Mi-Pyme

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel&logoColor=white)](https://mi-pyme-seven.vercel.app/)
[![CI](https://github.com/Marlondamian26/Proyectos_Comerciales/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Marlondamian26/Proyectos_Comerciales/actions/workflows/ci-cd.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=flat&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

> **TL;DR:** Mi-Pyme es un marketplace multi-negocio para PYMES cubanas. Permite a negocios locales vender productos y servicios, gestionar logística, pagos y facturación desde una sola plataforma. Construido con Next.js 16 + TypeScript + Prisma + PostgreSQL (Supabase), con conversión de divisas en tiempo real, notificaciones multicanal y cumplimiento legal (LFPDP). **[Ver demo →](https://mi-pyme-seven.vercel.app/)**

---

## Tabla de contenidos

- [Descripción](#descripción)
- [Características principales](#características-principales)
- [Stack tecnológico](#stack-tecnológico)
- [Instalación y desarrollo](#instalación-y-desarrollo)
- [Variables de entorno](#variables-de-entorno)
- [Deploy](#deploy)
- [Tests](#tests)
- [Documentación adicional](#documentación-adicional)
- [Legal](#legal)
- [Contacto](#contacto)

---

## Descripción

Mi-Pyme es una plataforma de comercio electrónico multi-negocio diseñada específicamente para PYMES cubanas. Permite a negocios locales vender productos y servicios, gestionar catálogos, reservas, logística, pagos y facturación desde una sola plataforma.

El proyecto está desplegado en producción en [Vercel](https://mi-pyme-seven.vercel.app/) y cuenta con documentación completa de arquitectura, despliegue y seguridad.

## Características principales

- **Marketplace multi-negocio:** múltiples PYMES operando en una misma plataforma con catálogos independientes.
- **Gestión de productos y servicios:** catálogos, precios, disponibilidad y reservas.
- **Logística y transporte:** seguimiento de envíos y rutas de entrega.
- **Pagos y facturación:** integración con métodos de pago y generación de comprobantes fiscales.
- **Autenticación y roles:** NextAuth.js con roles de cliente, negocio, logística y administrador.
- **UI/UX responsive:** optimizado para móvil (prioridad #1, 80%+ de accesos desde teléfono en Cuba), con touch targets ≥ 44×44px, texto ≥ 16px y cero overflow horizontal.
- **Conversión de divisas:** en tiempo real para el contexto cubano.
- **Documentos legales:** política de privacidad, términos y condiciones, y política de devoluciones.

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Framework | Next.js (App Router) | 16 |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS | 4 |
| ORM / Base de datos | Prisma + PostgreSQL (Supabase) | 6.19.3 |
| Autenticación | NextAuth.js | 5.0.0-beta.32 |
| Imágenes | Cloudinary | — |
| Emails transaccionales | Resend | — |
| Tests | Vitest + Playwright + @axe-core/playwright | — |
| Deploy | Vercel | — |

## Instalación y desarrollo

Desde esta carpeta:

```bash
cp .env.example .env
# Completa .env con credenciales propias antes de usar base de datos o servicios externos.
npm ci
npm run dev
```

La aplicación estará disponible en <http://localhost:3000>.

## Variables de entorno

Configura `.env` con las credenciales propias para base de datos (PostgreSQL/Supabase), NextAuth.js, Cloudinary y Resend antes de ejecutar la aplicación.

## Deploy

La aplicación está desplegada en [Vercel](https://mi-pyme-seven.vercel.app/). El despliegue se activa automáticamente mediante el workflow de GitHub Actions `ci-cd.yml`.

## Tests

```bash
npm run test              # Vitest (unitarios)
npm run test:a11y         # Playwright + Axe (accesibilidad WCAG 2.1 AA)
npm run test:visual       # Regresión visual
npm run test:lighthouse   # Lighthouse CI
```

## Documentación adicional

- [Guía general, arquitectura, rutas, datos y estado del proyecto](../README.md)
- [Despliegue en Vercel y Supabase](./docs/deploy.md)
- [Arquitectura de servicios](./SERVICE_ARCHITECTURE.md)
- [Guía de autenticación y seguridad](./CLAUDE.md)
- [Convenciones de desarrollo](./AGENTS.md)
- [Documentos legales](./docs/legal.md)

## Legal

Mi-Pyme cuenta con los siguientes documentos legales:

- [Política de Privacidad](https://mi-pyme-seven.vercel.app/privacidad)
- [Términos y Condiciones](https://mi-pyme-seven.vercel.app/terminos)
- [Política de Devoluciones](https://mi-pyme-seven.vercel.app/devoluciones)

Al registrarse, el usuario acepta estos documentos (checkbox obligatorio).

**⚠️ Advertencia:** los textos legales son una base adaptada al contexto cubano y **deben ser revisados por un abogado** antes del lanzamiento público. Véase `docs/legal.md`.

## Contacto

Para consultas sobre el proyecto, abrir un issue en este repositorio o contactar al mantenedor a través de GitHub.
