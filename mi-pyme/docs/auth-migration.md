# Scripts de Migración de Auth

> **Estado:** los scripts listados aquí se ejecutan **manualmente** tras deploy.
> No son parte del seed automático ni de las migraciones de Prisma.

## Orden de ejecución

| # | Script | Comando | Fase | Cuándo ejecutar |
|---|--------|---------|------|-----------------|
| 1 | `normalizar-emails-usernames.ts` | `npx tsx scripts/normalizar-emails-usernames.ts` | Etapa 2 | Tras migrar datos de un sistema legacy con emails/usernames no normalizados |
| 2 | `migrar-negocios-autoregistrados.ts` | `npx tsx scripts/migrar-negocios-autoregistrados.ts` | Etapa 3 | Después de aplicar el fix B1 (eliminar autoregistro como NEGOCIO) |
| 3 | `migrar-negocios-estado.ts` | `npx tsx scripts/migrar-negocios-estado.ts` | Fase 1 | Al migrar a schema con campo `estado` y `HorarioNegocio` |
| 4 | `generar-codigos-entrega-pendientes.ts` | `npx tsx scripts/generar-codigos-entrega-pendientes.ts` | Fase 1, Punto 5 | Después de añadir `codigoEntregaHash` a pagos EFECTIVO_CONTRA_ENTREGA existentes |

**Recomendado:** ejecutar en este orden durante maintenance windows. Cada script
es idempotente — puedes ejecutarlo de nuevo sin riesgo si ya se aplicó.

---

## 1. `normalizar-emails-usernames.ts`

**Fase:** Etapa 2.

### Qué hace

Recorre todos los usuarios y convierte `email` y `username` a lowercase. Detiene
la ejecución si detecta colisiones (dos usuarios que, tras normalizar, tendrían
el mismo email o username).

### Por qué es manual

Las colisiones requieren intervención humana (¿cuál conserva el email? ¿el otro
cambia?). Por eso el script no hace `UPDATE` automático si hay choque.

### Cómo verificar

```sql
-- No debe devolver filas (todo en lowercase)
SELECT id, email, username FROM "User"
WHERE email != LOWER(email) OR username != LOWER(username);
```

### Rollback

No aplica. La normalización es irreversible (no se puede recuperar el case original),
pero los datos normalizados son correctos. Si hay colisiones, el script detiene
antes de modificar nada.

---

## 2. `migrar-negocios-autoregistrados.ts`

**Fase:** Etapa 3, corrección B1.

### Qué hace

Recorre todos los usuarios con `rol = "NEGOCIO"` y clasifícalos:

| Caso | Acción |
|------|--------|
| Tiene Negocio asociado con estado `ACTIVO` | Mantiene `NEGOCIO` (es legítimo) |
| No tiene Negocio asociado | Degrada a `CLIENTE` |
| Tiene Negocio en `PENDIENTE_APROBACION` o `RECHAZADO` | Degrada a `CLIENTE` |

Registra cada migración en `AuditLog` con evento `ROL_MIGRADO_AUTOREGISTRO`.

### Por qué es manual

Modifica datos de usuarios. Debe ejecutarse después de haber aplicado el fix de
que el registro público no acepte roles privilegiados.

### Cómo verificar

```sql
-- Usuarios NEGOCIO que NO tienen negocio ACTIVO deben haber sido degradados
SELECT u.id, u.email, u.rol
FROM "User" u
WHERE u.rol = 'NEGOCIO'
  AND NOT EXISTS (
    SELECT 1 FROM "Negocio" n
    WHERE n.userId = u.id AND n.estado = 'ACTIVO'
  );
```

```sql
-- Ver eventos de auditoría
SELECT * FROM "AuditLog"
WHERE eventType = 'ROL_MIGRADO_AUTOREGISTRO'
ORDER BY timestamp DESC;
```

### Rollback

No aplica. Los usuarios degradados pueden ser promovidos a `NEGOCIO` manualmente
por un admin si es apropiado (solicitud de alta + aprobación).

---

## 3. `migrar-negocios-estado.ts`

**Fase:** Fase 1, Punto 3.

### Qué hace

- Asigna `estado: "ACTIVO"` y `aprobadoEn: now()` a negocios que no tengan estado.
- Crea `HorarioNegocio` por defecto (L-V 08:00-18:00, S 08:00-13:00, D cerrado)
  para negocios sin horarios.

### Cómo verificar

```sql
-- Todos los negocios activos deben tener estado ACTIVO
SELECT id, nombre, estado FROM "Negocio" WHERE activo = true AND estado != 'ACTIVO';

-- Verificar horarios
SELECT n.id, n.nombre, COUNT(h.id) as horarios_count
FROM "Negocio" n
LEFT JOIN "HorarioNegocio" h ON h.negocioId = n.id
GROUP BY n.id, n.nombre
HAVING COUNT(h.id) = 0;
```

### Rollback

Reinicia la base de datos desde backup. La migración es destructiva (asigna
estado y crea horarios).

---

## 4. `generar-codigos-entrega-pendientes.ts`

**Fase:** Fase 1, Punto 5 (pagos).

### Qué hace

Genera códigos de entrega (6 dígitos, hasheados con bcrypt 12 rounds) para pagos
`EFECTIVO_CONTRA_ENTREGA` en estado `PENDIENTE` que no tienen `codigoEntregaHash`.

### Cómo verificar

```sql
-- Pagos sin código de entrega que deberían tenerlo
SELECT id, pedidoId, estado, metodo
FROM "Pago"
WHERE metodo = 'EFECTIVO_CONTRA_ENTREGA'
  AND estado = 'PENDIENTE'
  AND codigoEntregaHash IS NULL;
```

Después de ejecutar, la query anterior no debe devolver filas.

### Rollback

No aplicable — los códigos son generados en memoria (TTL 7 días en caché). El
código plano no se almacena en DB (solo el hash). Los clientes pueden regenerar
el código si es necesario.

---

## Checklist de post-deploy

- [ ] Ejecutar scripts 1-4 en orden.
- [ ] Verificar queries de validación (arriba) devuelven 0 filas.
- [ ] Verificar eventos de auditoría en `AuditLog`.
- [ ] Confirmar que `npm test` pasa (incluyendo `architecture-auth.test.ts`).
- [ ] Confirmar que `npm run build` compila sin errores.
