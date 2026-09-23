# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **ReservaService.ts**: `const fechaIni = new Date` (sin paréntesis) → `new Date(datos.fechaHoraInicio)`.
  El typo asignaba la función constructora `Date` en lugar de una instancia, causando
  `TypeError: fechaIni.getTime is not a function` en runtime.
- **ReservaService.ts**: Interfaz `CrearReservaParams` — campo `fechaHoraFincio` corregido a `fechaHoraInicio`.
  El typo se propagaba a todos los consumidores (actions.ts, API routes, tests).
- **ReservaService.ts**: En `prisma.reserva.create()` se usaba `fechaHoraFin: fechaIni` en lugar de
  `fechaHoraInicio: fechaIni, fechaHoraFin: fechaFin`. Corregido mapeo de campos.
- **PedidosService.ts**: Sangría extra en `actualizarEstado` (línea 234) — corregida a 2 espacios.

### Added

- **src/tests/regresion-typos.test.ts**: Tests de regresión para los typos corregidos.
  Incluye tests de tipo (`@ts-expect-error` para `fechaHoraFincio`) y tests de runtime
  (`toBeInstanceOf(Date)` / `typeof getTime === "function"`).
- Tests de integración para `ReservaService` (crearReserva → listarReservas) y
  `PedidosService` (getPedido → listPedidosDeUsuario → actualizarEstado).
- Documentación en `SERVICE_ARCHITECTURE.md` con detalle de typos, impacto y decisión
  de migración directa.
- Normas de calidad tipos en `AGENTS.md` y `CLAUDE.md` para prevenir reintroducción de typos.

### Security

- No security changes in this release.
