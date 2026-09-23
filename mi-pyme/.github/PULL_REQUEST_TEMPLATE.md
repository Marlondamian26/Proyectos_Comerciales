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

## Checklist general

- [ ] Los tests existentes pasan.
- [ ] `npm run build` compila sin errores.
- [ ] Sin `console.log` de debug.
- [ ] Sin dependencias nuevas sin justificar.
- [ ] Documentación actualizada.
