# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance.test.mjs >> Performance metrics >> contacto - CLS < 0.1
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
    - generic [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - link "Volver al inicio" [ref=e7] [cursor=pointer]:
            - /url: /
          - generic [ref=e11]:
            - button "Cambiar a modo oscuro" [ref=e12]:
              - generic [ref=e15]: Sistema
            - generic [ref=e16]: Modo claro activado
            - button "Opciones de tema" [ref=e17]
        - heading "Contacto" [level=1] [ref=e20]
        - paragraph [ref=e21]: ¿Tienes preguntas o necesitas ayuda? Nuestro equipo está listo para ayudarte.
      - generic [ref=e22]:
        - generic [ref=e25]:
          - heading "Email" [level=3] [ref=e30]
          - paragraph [ref=e31]: Escríbenos y te responderemos en menos de 24 horas.
          - link "soporte@mi-pyme.com" [ref=e32] [cursor=pointer]:
            - /url: mailto:soporte@mi-pyme.com
        - generic [ref=e35]:
          - heading "Teléfono" [level=3] [ref=e39]
          - paragraph [ref=e40]: Lun-Vie de 9:00 a 18:00 hs.
          - link "+54 9 11 1234-5678" [ref=e41] [cursor=pointer]:
            - /url: tel:+5491112345678
        - generic [ref=e44]:
          - heading "Oficina" [level=3] [ref=e49]
          - paragraph [ref=e50]: Av. Corrientes 1234, Buenos Aires, Argentina.
          - text: CABA, Argentina
    - generic [ref=e53]:
      - generic [ref=e54]:
        - heading "Envíanos un mensaje" [level=2] [ref=e59]
        - paragraph [ref=e60]: Completa el formulario y nos pondremos en contacto contigo a la brevedad.
        - generic [ref=e61]:
          - generic [ref=e62]:
            - generic [ref=e63]:
              - text: Nombre
              - textbox "Nombre" [ref=e64]:
                - /placeholder: Tu nombre
            - generic [ref=e65]:
              - text: Email
              - textbox "Email" [ref=e66]:
                - /placeholder: tu@email.com
          - generic [ref=e67]:
            - text: Asunto
            - textbox "Asunto" [ref=e68]:
              - /placeholder: ¿En qué podemos ayudarte?
          - generic [ref=e69]:
            - text: Mensaje
            - textbox "Mensaje" [ref=e70]:
              - /placeholder: Cuéntanos más detalles...
          - button "Enviar mensaje" [ref=e71]
      - generic [ref=e75]:
        - generic [ref=e84]:
          - heading "Horario de atención" [level=3] [ref=e85]
          - paragraph [ref=e86]: "Lunes a Viernes: 9:00 - 18:00 hs"
          - paragraph [ref=e87]: "Sábados: 9:00 - 13:00 hs"
        - generic [ref=e96]:
          - heading "Soporte técnico" [level=3] [ref=e97]
          - paragraph [ref=e98]: "Para problemas técnicos, envía un email a:"
          - link "tech@mi-pyme.com" [ref=e99] [cursor=pointer]:
            - /url: mailto:tech@mi-pyme.com
        - generic [ref=e107]:
          - heading "Ventas" [level=3] [ref=e108]
          - paragraph [ref=e109]: "Para consultas sobre planes y precios:"
          - link "+54 9 11 1234-5678" [ref=e110] [cursor=pointer]:
            - /url: tel:+5491112345678
  - button "Open Next.js Dev Tools" [ref=e116] [cursor=pointer]
  - alert [ref=e120]
```