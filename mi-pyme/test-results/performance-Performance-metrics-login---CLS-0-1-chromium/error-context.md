# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance.test.mjs >> Performance metrics >> login - CLS < 0.1
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
      - generic [ref=e9]:
        - heading "Mi-Pyme" [level=1] [ref=e14]
        - paragraph [ref=e15]: La plataforma integral para gestionar tu negocio, productos y logistica en un solo lugar.
      - generic [ref=e16]:
        - generic [ref=e17]: Gestiona tu catalogo de productos
        - generic [ref=e23]: Optimiza tu logistica
        - generic [ref=e31]: Analisis y reportes en tiempo real
    - generic [ref=e40]:
      - generic [ref=e41]:
        - generic [ref=e42]:
          - heading "Bienvenido de nuevo" [level=2] [ref=e43]
          - paragraph [ref=e44]: Inicia sesion en tu cuenta
        - generic [ref=e46]:
          - button "Cambiar a modo oscuro" [ref=e47]:
            - generic [ref=e50]: Sistema
          - generic [ref=e51]: Modo claro activado
          - button "Opciones de tema" [ref=e52]
      - link "Volver a inicio" [ref=e56] [cursor=pointer]:
        - /url: /
      - generic [ref=e60]:
        - generic [ref=e61]:
          - text: Email o Usuario
          - textbox "Email o Usuario" [ref=e67]:
            - /placeholder: tu@ejemplo.com o usuario
        - generic [ref=e68]:
          - text: Contrasena
          - generic [ref=e69]:
            - textbox "Contrasena" [ref=e74]:
              - /placeholder: Tu contrasena
            - button "Mostrar contrasena" [ref=e75]
        - generic [ref=e79]:
          - generic [ref=e80] [cursor=pointer]:
            - checkbox "Recordarme" [ref=e81]
            - generic [ref=e82]: Recordarme
          - link "Olvidaste tu contrasena?" [ref=e83] [cursor=pointer]:
            - /url: /auth/recuperar
        - button "Iniciar Sesion" [ref=e84]
      - paragraph [ref=e85]:
        - text: No tienes cuenta?
        - link "Registrate" [ref=e86] [cursor=pointer]:
          - /url: /auth/registro
  - button "Open Next.js Dev Tools" [ref=e92] [cursor=pointer]
  - alert [ref=e96]
```