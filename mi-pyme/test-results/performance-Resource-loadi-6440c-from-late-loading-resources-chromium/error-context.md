# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance.test.mjs >> Resource loading >> no layout shifts from late-loading resources
- Location: visual-tests/performance.test.mjs:177:3

# Error details

```
Error: page.evaluate: TypeError: Promise resolver undefined is not a function
    at new Promise (<anonymous>)
    at eval (eval at evaluate (:311:30), <anonymous>:2:14)
    at UtilityScript.evaluate (<anonymous>:313:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - navigation [ref=e3]:
      - generic [ref=e5]:
        - link "Mi-Pyme" [ref=e11] [cursor=pointer]:
          - /url: /
        - generic [ref=e12]:
          - link "Catálogo" [ref=e13] [cursor=pointer]:
            - /url: /catalogo
          - link "Servicios" [ref=e14] [cursor=pointer]:
            - /url: /servicios
          - link "Contacto" [ref=e15] [cursor=pointer]:
            - /url: /contacto
        - generic [ref=e16]:
          - generic [ref=e17]:
            - button "Cambiar a modo oscuro" [ref=e18]:
              - generic [ref=e21]: Sistema
            - generic [ref=e22]: Modo claro activado
            - button "Opciones de tema" [ref=e23]
          - link [ref=e26] [cursor=pointer]:
            - /url: /auth/login
            - button "Iniciar sesión" [ref=e27]
          - link [ref=e28] [cursor=pointer]:
            - /url: /auth/registro
            - button "Registrarse" [ref=e29]
    - generic [ref=e35]:
      - generic [ref=e36]: "Plataforma #1 para PYMEs"
      - heading "Mi-Pyme" [level=1] [ref=e40]
      - paragraph [ref=e41]: Tu plataforma integral para negocios locales. Catálogo, reservas, logística, facturación y ventas en un solo lugar.
      - generic [ref=e42]:
        - link [ref=e43] [cursor=pointer]:
          - /url: /auth/registro
          - button "Comenzar gratis" [ref=e44]
        - link [ref=e47] [cursor=pointer]:
          - /url: /catalogo
          - button "Explorar catálogo" [ref=e48]
      - generic [ref=e49]:
        - generic [ref=e50]: Gratis para comenzar
        - generic [ref=e55]: Sin tarjeta de crédito
        - generic [ref=e60]: Soporte 24/7
    - generic [ref=e67]:
      - generic [ref=e68]: "Ordenar por:"
      - combobox "Ordenar resultados" [ref=e72]:
        - option "Más populares" [selected]
        - option "Menos populares"
        - option "A - Z"
        - option "Z - A"
    - generic [ref=e74]:
      - generic [ref=e75]:
        - heading "Explora por Áreas" [level=2] [ref=e76]
        - paragraph [ref=e77]: Descubre negocios organizados por categorías para encontrar exactamente lo que necesitas
      - link [ref=e79] [cursor=pointer]:
        - /url: /catalogo?area=servicios
        - generic [ref=e83]:
          - heading "Servicios" [level=3] [ref=e88]
          - paragraph [ref=e89]: /servicios
          - generic [ref=e90]: Ver más
    - generic [ref=e94]:
      - generic [ref=e95]:
        - heading "Negocios Destacados" [level=2] [ref=e96]
        - paragraph [ref=e97]: Conoce los mejores negocios de la plataforma
      - generic [ref=e102]:
        - heading "Spa Premium" [level=3] [ref=e103]
        - generic [ref=e104]:
          - generic [ref=e105]: Servicios
          - generic [ref=e109]: 1 subáreas
        - link "Ver productos" [ref=e112] [cursor=pointer]:
          - /url: /catalogo?negocioId=cmuvy7s3l00038b526tqysa12
    - generic [ref=e116]:
      - generic [ref=e117]:
        - heading "Servicios Populares" [level=2] [ref=e118]
        - paragraph [ref=e119]: Reserva los servicios más solicitados por la comunidad
      - generic [ref=e121]:
        - generic [ref=e122]:
          - img "Manicura" [ref=e123]
          - generic [ref=e124]: Disponible
        - generic [ref=e127]:
          - heading "Manicura" [level=3] [ref=e128]
          - paragraph [ref=e129]: Servicio de manicura
          - generic [ref=e130]:
            - link "Reservar ahora" [ref=e131] [cursor=pointer]:
              - /url: /reservas?servicioId=cmuvy7s7b000a8b52u0aooeuc
            - link [ref=e134] [cursor=pointer]:
              - /url: /catalogo?servicioId=cmuvy7s7b000a8b52u0aooeuc
              - button "Ver más" [ref=e135]
        - generic [ref=e137]:
          - generic [ref=e138]: 60 min
          - generic [ref=e142]: "5"
    - generic [ref=e150]:
      - heading "¿Listo para empezar?" [level=2] [ref=e151]
      - paragraph [ref=e152]: Únete a cientos de negocios que ya confían en Mi-Pyme para gestionar su operación diaria.
      - generic [ref=e153]:
        - link [ref=e154] [cursor=pointer]:
          - /url: /auth/registro
          - button "Crear cuenta gratis" [ref=e155]
        - link [ref=e158] [cursor=pointer]:
          - /url: /contacto
          - button "Contactar ventas" [ref=e159]
    - paragraph [ref=e162]: Mi-Pyme - Plataforma para pequeños comercios
  - button "Open Next.js Dev Tools" [ref=e168] [cursor=pointer]
  - alert [ref=e172]
```