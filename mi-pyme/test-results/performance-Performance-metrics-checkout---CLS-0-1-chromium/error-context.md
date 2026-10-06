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
  - generic [ref=e2]:
    - generic [ref=e8]:
      - heading "Unete" [level=1] [ref=e13]
      - paragraph [ref=e14]: Crea tu cuenta y comienza a disfrutar de todos los beneficios de Mi-Pyme.
    - generic [ref=e17]:
      - generic [ref=e18]:
        - generic [ref=e19]:
          - heading "Crea tu cuenta" [level=2] [ref=e20]
          - paragraph [ref=e21]: Completa el formulario para registrarte
        - generic [ref=e22]:
          - button "Cambiar a modo oscuro" [ref=e23]:
            - generic [ref=e26]: Sistema
          - generic [ref=e27]: Modo claro activado
          - button "Opciones de tema" [ref=e28]
      - link "Volver a inicio" [ref=e32] [cursor=pointer]:
        - /url: /
      - generic [ref=e36]:
        - generic [ref=e37]:
          - text: Nombre completo
          - textbox "Nombre completo" [ref=e43]:
            - /placeholder: Juan Perez
        - generic [ref=e44]:
          - text: Nombre de usuario
          - textbox "Nombre de usuario" [ref=e50]:
            - /placeholder: juanperez123
        - generic [ref=e51]:
          - text: Email
          - textbox "Email" [ref=e57]:
            - /placeholder: tu@ejemplo.com
        - generic [ref=e58]:
          - text: Contrasena
          - generic [ref=e59]:
            - textbox "Contrasena" [ref=e64]:
              - /placeholder: Minimo 10 caracteres
            - button "Mostrar contrasena" [ref=e65]
        - generic [ref=e69]:
          - text: Confirmar contrasena
          - generic [ref=e70]:
            - textbox "Confirmar contrasena" [ref=e75]:
              - /placeholder: Repite la contrasena
            - button "Mostrar contrasena" [ref=e76]
        - generic [ref=e80]:
          - generic [ref=e81]:
            - text: Provincia
            - textbox "Provincia" [ref=e87]:
              - /placeholder: Buenos Aires
          - generic [ref=e88]:
            - text: Municipio
            - textbox "Municipio" [ref=e94]:
              - /placeholder: La Plata
        - button "Registrar" [ref=e95]
      - paragraph [ref=e96]:
        - text: Ya tienes cuenta?
        - link "Inicia sesion" [ref=e97] [cursor=pointer]:
          - /url: /auth/login
      - generic [ref=e98]:
        - paragraph [ref=e99]: ¿Tienes un negocio?
        - link "Solicita unirte a Mi-Pyme" [ref=e100] [cursor=pointer]:
          - /url: /negocios/solicitar
  - button "Open Next.js Dev Tools" [ref=e106] [cursor=pointer]
  - alert [ref=e110]
```