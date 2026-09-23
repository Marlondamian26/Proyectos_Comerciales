<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Normas de Calidad de Código

## Verificación de typos y patrones de Date

Antes de commitear, verifica:

1. **`new Date` siempre lleva paréntesis `()`.** `const x = new Date` asigna la
   función constructora, no una instancia. Busca patrones sospechosos:
   ```bash
   grep -rn "new Date[^(]" src/ --include="*.ts" --include="*.tsx"
   ```

2. **Las interfaces públicas (`*Params`, `*DTO`) deben revisarse ortográficamente.**
   Typos en nombres de campos como `fechaHoraFincio` (debe ser `fechaHoraInicio`)
   se propagan a todos los consumidores y son difíciles de detectar.

3. **Nomenclatura consistente singular/plural.** Usa plural (`pedidos`, `reservas`)
   para arrays y singular (`pedido`, `reserva`) para entidades individuales.

4. **Verifica con `tsc --noEmit`** que no hay errores de tipo tras los cambios.

## Autenticación y seguridad

> **Reglas completas en `CLAUDE.md` → "Reglas de Autenticación y Seguridad (Etapa 5)"**
>
> Resumen de prohibiciones críticas:
> - Registro público **siempre** `CLIENTE` (nunca `NEGOCIO`/`ADMIN`/`LOGISTICA`).
> - Tokens de reset **siempre** hasheados (SHA-256) antes de guardar.
> - **Nunca** tokens en query strings (`?token=...`); usar POST body o headers.
> - **Nunca** loggear passwords, tokens, secrets ni `NEXTAUTH_SECRET`.
> - Mutaciones **siempre** validan propiedad (`assertPertenencia`).
> - `isActive: false` y `mustChangePassword` bloquean login.
> - `/api/admin/*` **siempre** validan rol `ADMIN`.
> - bcrypt **siempre** 12 rounds (`BCRYPT_ROUNDS`).
> - `sessionVersion` se incrementa al cambiar password, rol o estado de cuenta.
> - Normalizar emails/usernames a lowercase.
>
> **Tests de arquitectura**: `src/tests/architecture-auth.test.ts` verifica
> automáticamente que ninguna de estas reglas se ha revertido. Si un test falla,
> es una regresión real.
