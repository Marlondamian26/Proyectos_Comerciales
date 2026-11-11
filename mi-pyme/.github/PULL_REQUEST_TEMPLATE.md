## Checklist de seguridad (si el PR toca auth)

- [ ] ¿El endpoint valida rol (`requireRole` o equivalente)?
- [ ] ¿Valida propiedad del recurso (`assertPertenencia`)?
- [ ] ¿Tiene rate limiting o está marcado `[TODO Fase 3]`?
- [ ] ¿Registra en `AuditLog`?
- [ ] ¿Tiene test de regresión?
- [ ] ¿Está documentado en `SERVICE_ARCHITECTURE.md`?
- [ ] ¿Evita loggear tokens, passwords o secrets?
- [ ] ¿Los tests de arquitectura (`architecture-auth.test.ts`) pasan?
- [ ] Si añade/modifica campo de rol: ¿incrementa `sessionVersion`?
- [ ] Si añade/modifica password: ¿usa `validarPassword` y `BCRYPT_ROUNDS`?

## Checklist de accesibilidad y rendimiento

- [ ] `npm run test:a11y` — tests de accesibilidad pasan (light + dark mode).
- [ ] `npm run test:performance` — tests de LCP, CLS, console errors pasan.
- [ ] `npm run test:bundle` — bundle size dentro de límites.
- [ ] `npm run test:lighthouse` — Lighthouse CI sin errores.
- [ ] Si añade componentes nuevos: incluye tests de accesibilidad (axe-core).
- [ ] Si añade imágenes: usan `next/image` con `alt` descriptivo.
- [ ] Si cambia colores/temas: verifica contraste en light y dark mode.

## Checklist general

- [ ] Los tests existentes pasan (`npm run test`).
- [ ] `npm run build` compila sin errores.
- [ ] `npx tsc --noEmit` sin errores de tipo.
- [ ] `npm run lint` sin errores.
- [ ] Documentación actualizada (`CLAUDE.md`, `AGENTS.md`, `SERVICE_ARCHITECTURE.md`).
