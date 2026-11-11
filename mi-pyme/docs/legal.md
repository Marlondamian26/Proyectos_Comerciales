# Documentos Legales de Mi-Pyme

## Documentos implementados

| Documento | Ruta | Estado | Última actualización |
|---|---|---|---|
| Política de Privacidad | `/privacidad` | ✅ Implementado | Noviembre de 2026 |
| Términos y Condiciones | `/terminos` | ✅ Implementado | Noviembre de 2026 |
| Política de Devoluciones | `/devoluciones` | ✅ Implementado | Noviembre de 2026 |
| Política de Cookies | — | ⏳ Fase posterior | — |
| Aviso Legal | — | ⏳ Fase posterior | — |

## Marco legal aplicable

- **Ley No. 149/2022** de Protección de Datos Personales (Cuba)
- **Ley No. 113/2012** del Sistema Tributario (ONAT, conservación de datos fiscales por 5 años)
- **Decreto-Ley No. 370/2018** (informatización de la sociedad)

## Implementación técnica

### Componente reutilizable
- `src/components/legal/LegalDocument.tsx` — Componente con layout consistente, tipografía (Tailwind Typography), navegación de retorno, y pie de contacto.

### Páginas
- `src/app/privacidad/page.tsx` — 12 secciones (responsable, datos, finalidad, base legal, destinatarios, transferencias internacionales, conservación, derechos, seguridad, menores, cambios, contacto).
- `src/app/terminos/page.tsx` — 18 secciones (operador, objeto, aceptación, registro, roles, publicación, compra/pago, envío, devoluciones, facturación, responsabilidad, propiedad intelectual, conducta, suspensión, disputas, modificaciones, legislación, contacto).
- `src/app/devoluciones/page.tsx` — 12 secciones (alcance, plazos, condiciones, no devolvibles, proceso, costos, reembolsos, cancelaciones, defectuosos, servicios, disputas, contacto).

### Registro de usuarios
- Checkbox obligatorio de aceptación de Términos y Condiciones y Política de Privacidad en `src/app/auth/registro/page.tsx`.
- Validación en servidor en `src/lib/actions.ts` (`registrarUsuario` rechaza si `aceptaTerminos` es falso).
- Campos `aceptoTerminosEn` y `aceptoTerminosVersion` en el modelo `User` de Prisma para demostrar consentimiento informado (Ley 149/2022).

### Checkout
- Aviso de Términos y Condiciones y Política de Privacidad antes del botón "Confirmar y pagar" en `src/app/checkout/page.tsx`.

### Footer
- Enlaces legales en el footer de `src/app/page.tsx` (sección "Legal" + línea inferior).

### SEO y metadatos
- Cada página legal tiene `metadata` con `title`, `description` y `robots: { index: true, follow: true }`.

## Pendientes

- [ ] **Revisión por abogado** antes de lanzamiento público (crítico).
- [ ] Implementar Política de Cookies (fase posterior).
- [ ] Implementar banner de cookies si se añaden analytics.
- [ ] Aviso legal si se opera en España.
- [ ] Registro de actividades de tratamiento (obligatorio Ley 149/2022 si hay >250 empleados o datos sensibles).
- [ ] Designación de DPO (Delegado de Protección de Datos) si escala.

## Contacto

- Legal: legal@mi-pyme.cu
- Soporte: soporte@mi-pyme.cu

## ⚠️ Advertencia importante

Los textos implementados son **una base adaptada al contexto cubano**, pero:

1. **NO son documentos legales definitivos.**
2. **DEBEN ser revisados por un abogado** antes del lanzamiento público.
3. **Especialmente crítico:** cláusulas de responsabilidad, plazos y condiciones de devoluciones, cumplimiento exacto de la Ley 149/2022, y transferencia internacional de datos.

**Recomendación:** contratar una revisión legal antes de promocionar Mi-Pyme públicamente.
