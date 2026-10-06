# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance.test.mjs >> Performance metrics >> servicios - CLS < 0.1
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
  - generic [ref=e6] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e7]
    - generic [ref=e11]:
      - button "Open issues overlay" [ref=e12]:
        - generic [ref=e13]:
          - generic [aria-hidden] [ref=e14]: "0"
          - generic [ref=e15]: "1"
        - generic [ref=e16]: Issue
      - button "Collapse issues badge" [ref=e17]
  - alert [ref=e20]
  - main [ref=e21]:
    - generic [ref=e23]:
      - button "Cambiar a modo oscuro" [ref=e24]:
        - generic [ref=e27]: Sistema
      - generic [ref=e28]: Modo claro activado
      - button "Opciones de tema" [ref=e29]
    - generic [ref=e32]:
      - generic [ref=e36]:
        - heading "Algo salió mal" [level=1] [ref=e37]
        - paragraph [ref=e38]: Ocurrió un error inesperado. Por favor, inténtalo de nuevo.
      - generic [ref=e39]:
        - button "Reintentar" [ref=e40]
        - button "Volver al inicio" [ref=e46]
```