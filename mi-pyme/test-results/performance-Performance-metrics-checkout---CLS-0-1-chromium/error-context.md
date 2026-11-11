# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance.test.mjs >> Performance metrics >> checkout - CLS < 0.1
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
  - banner [ref=e2]:
    - navigation "Navegación principal" [ref=e3]:
      - link "Mi-Pyme - Ir al inicio" [ref=e4] [cursor=pointer]:
        - /url: /
        - img "Mi-Pyme" [ref=e5]
      - generic [ref=e6]:
        - link "Iniciar sesión" [ref=e7] [cursor=pointer]:
          - /url: /auth/login
        - link "Registrarse" [ref=e8] [cursor=pointer]:
          - /url: /auth/registro
  - generic [ref=e9]:
    - generic [ref=e15]:
      - heading "Unete" [level=1] [ref=e20]
      - paragraph [ref=e21]: Crea tu cuenta y comienza a disfrutar de todos los beneficios de Mi-Pyme.
    - generic [ref=e24]:
      - generic [ref=e25]:
        - generic [ref=e26]:
          - heading "Crea tu cuenta" [level=2] [ref=e27]
          - paragraph [ref=e28]: Completa el formulario para registrarte
        - generic [ref=e29]:
          - button "Cambiar a modo oscuro" [ref=e30]:
            - generic [ref=e33]: Sistema
          - generic [ref=e34]: Modo claro activado
          - button "Opciones de tema" [ref=e35]
      - link "Volver a inicio" [ref=e39] [cursor=pointer]:
        - /url: /
      - generic [ref=e43]:
        - generic [ref=e44]:
          - text: Nombre completo
          - textbox "Nombre completo" [ref=e50]:
            - /placeholder: Juan Perez
        - generic [ref=e51]:
          - text: Nombre de usuario
          - textbox "Nombre de usuario" [ref=e57]:
            - /placeholder: juanperez123
        - generic [ref=e58]:
          - text: Email
          - textbox "Email" [ref=e64]:
            - /placeholder: tu@ejemplo.com
        - generic [ref=e65]:
          - text: Contrasena
          - generic [ref=e66]:
            - textbox "Contrasena" [ref=e71]:
              - /placeholder: Minimo 10 caracteres
            - button "Mostrar contrasena" [ref=e72]
        - generic [ref=e76]:
          - text: Confirmar contrasena
          - generic [ref=e77]:
            - textbox "Confirmar contrasena" [ref=e82]:
              - /placeholder: Repite la contrasena
            - button "Mostrar contrasena" [ref=e83]
        - generic [ref=e87]:
          - generic [ref=e88]:
            - text: Provincia
            - textbox "Provincia" [ref=e94]:
              - /placeholder: La Habana
          - generic [ref=e95]:
            - text: Municipio
            - textbox "Municipio" [ref=e101]:
              - /placeholder: Playa
        - generic [ref=e102]:
          - checkbox "¿Tienes un negocio? Marca esta opción y, tras registrarte, podrás solicitar unirte a Mi-Pyme como negocio o logística." [ref=e104]
          - generic [ref=e105]:
            - text: ¿Tienes un negocio?
            - generic [ref=e106]: Marca esta opción y, tras registrarte, podrás solicitar unirte a Mi-Pyme como negocio o logística.
        - generic [ref=e107]:
          - checkbox "He leído y acepto los Términos y Condiciones y la Política de Privacidadde Mi-Pyme." [ref=e109]
          - generic [ref=e110]:
            - text: He leído y acepto los
            - link "Términos y Condiciones" [ref=e111] [cursor=pointer]:
              - /url: /terminos
            - text: y la
            - link "Política de Privacidad" [ref=e112] [cursor=pointer]:
              - /url: /privacidad
            - text: de Mi-Pyme.
        - button "Registrar" [disabled]
      - paragraph [ref=e113]:
        - text: Ya tienes cuenta?
        - link "Inicia sesion" [ref=e114] [cursor=pointer]:
          - /url: /auth/login
      - generic [ref=e115]:
        - paragraph [ref=e116]: ¿Tienes un negocio?
        - link "Solicita unirte a Mi-Pyme" [ref=e117] [cursor=pointer]:
          - /url: /negocios/solicitar
  - button "Open Next.js Dev Tools" [ref=e123] [cursor=pointer]
  - alert [ref=e127]
```