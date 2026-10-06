# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance.test.mjs >> Performance metrics >> catalogo - CLS < 0.1
- Location: visual-tests/performance.test.mjs:43:5

# Error details

```
Error: page.evaluate: TypeError: Promise resolver undefined is not a function
    at new Promise (<anonymous>)
    at eval (eval at evaluate (:311:30), <anonymous>:2:16)
    at UtilityScript.evaluate (<anonymous>:313:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - link [ref=e5] [cursor=pointer]:
          - /url: /
          - button "Volver al inicio" [ref=e6]
        - generic [ref=e10]:
          - button "Cambiar a modo oscuro" [ref=e11]:
            - generic [ref=e14]: Sistema
          - generic [ref=e15]: Modo claro activado
          - button "Opciones de tema" [ref=e16]
      - heading "Catálogo de Mi-Pyme" [level=1] [ref=e19]
      - paragraph [ref=e20]: Descubre productos y servicios de negocios de confianza.
      - region [ref=e21]:
        - heading "Filtros" [level=2] [ref=e22]
        - generic [ref=e23]:
          - generic [ref=e24]:
            - generic [ref=e25]: Buscar
            - searchbox "Buscar en catálogo" [ref=e26]
          - generic [ref=e27]:
            - generic [ref=e28]: Área
            - combobox "Filtrar por área" [ref=e29]:
              - option "Todas las áreas" [selected]
              - option "Servicios"
          - generic [ref=e30]:
            - generic [ref=e31]: Disponible hoy
            - combobox "Filtrar por disponibilidad" [ref=e32]:
              - option "Cualquiera" [selected]
              - option "Sí"
              - option "No"
          - button "Aplicar filtros" [ref=e34]: Aplicar
    - generic [ref=e35]:
      - heading "Productos" [level=2] [ref=e37]: Productos (1)
      - list "Productos" [ref=e38]:
        - listitem [ref=e39]:
          - generic "Kit de Belleza" [ref=e40]:
            - generic [ref=e41]:
              - img "Kit de Belleza" [ref=e42]
              - generic [ref=e43]: Disponible
            - generic [ref=e44]:
              - heading "Kit de Belleza" [level=3] [ref=e46]
              - paragraph [ref=e47]: Kit completo de belleza
              - generic [ref=e49]:
                - status [ref=e50]: Disponible hoy · 100 unidad(es)
                - button "Agregar Kit de Belleza al carrito" [ref=e51]: Agregar al carrito
                - link "Ver detalle de Kit de Belleza" [ref=e52] [cursor=pointer]:
                  - /url: /catalogo/cmuvy7s7500088b5218u3fial
                  - text: Ver detalle
            - generic [ref=e54]:
              - generic [ref=e55]: $25.50
              - generic [ref=e56]: Spa Premium · unidad
    - generic [ref=e57]:
      - heading "Servicios" [level=2] [ref=e59]: Servicios (1)
      - list "Servicios" [ref=e60]:
        - listitem [ref=e61]:
          - generic "Manicura" [ref=e62]:
            - generic [ref=e63]:
              - img "Manicura" [ref=e64]
              - generic [ref=e65]: Disponible
            - generic [ref=e66]:
              - heading "Manicura" [level=3] [ref=e68]
              - paragraph [ref=e69]: Servicio de manicura
              - generic [ref=e71]:
                - status [ref=e72]: "Cupos disponibles: 5"
                - button "Reservar Manicura" [ref=e73]: Reservar
            - generic [ref=e75]:
              - generic [ref=e76]: "60 min · Capacidad: 5"
              - generic [ref=e77]: Spa Premium
  - button "Open Next.js Dev Tools" [ref=e83] [cursor=pointer]
  - alert [ref=e87]
```