# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/auth-flow.test.mjs >> User Registration & Login Flow >> CLIENTE - full auth flow: register, login, logout, re-login
- Location: tests/auth-flow.test.mjs:14:5

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "/cliente"
Received string:    "http://localhost:3000/auth/registro?callbackUrl=%2Fcliente"
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
          - button "Cambiar a modo sistema" [ref=e23]:
            - generic [ref=e26]: Sistema
          - generic [ref=e27]: Siguiendo preferencia del sistema
          - button "Opciones de tema" [ref=e28]
      - link "Volver a inicio" [ref=e32] [cursor=pointer]:
        - /url: /
      - generic [ref=e36]:
        - generic [ref=e37]:
          - text: Nombre completo
          - textbox "Nombre completo" [ref=e43]:
            - /placeholder: Juan Perez
            - text: Cliente Test
        - generic [ref=e44]:
          - text: Nombre de usuario
          - textbox "Nombre de usuario" [ref=e50]:
            - /placeholder: juanperez123
            - text: cliente_test_1789256667802
        - generic [ref=e51]:
          - text: Email
          - textbox "Email" [ref=e57]:
            - /placeholder: tu@ejemplo.com
            - text: cliente_test_1789256667802@test.com
        - generic [ref=e58]:
          - text: Contrasena
          - generic [ref=e59]:
            - textbox "Contrasena" [ref=e64]:
              - /placeholder: Minimo 8 caracteres
              - text: Test123!
            - button "Mostrar contrasena" [ref=e65]
          - paragraph [ref=e77]: "Fortaleza: Fuerte"
        - generic [ref=e78]:
          - text: Confirmar contrasena
          - generic [ref=e79]:
            - textbox "Confirmar contrasena" [ref=e84]:
              - /placeholder: Repite la contrasena
              - text: Test123!
            - button "Mostrar contrasena" [ref=e85]
        - generic [ref=e89]:
          - generic [ref=e90]: Selecciona tu rol
          - generic [ref=e91]:
            - button "Cliente" [ref=e92]
            - button "Negocio" [ref=e101]
            - button "Logistica" [ref=e107]
            - button "Administrador" [ref=e115]
        - generic [ref=e121]:
          - generic [ref=e122]:
            - text: Provincia
            - textbox "Provincia" [ref=e128]:
              - /placeholder: Buenos Aires
              - text: Buenos Aires
          - generic [ref=e129]:
            - text: Municipio
            - textbox "Municipio" [ref=e135]:
              - /placeholder: La Plata
              - text: La Plata
        - button "Registrar" [ref=e136]
      - paragraph [ref=e137]:
        - text: Ya tienes cuenta?
        - link "Inicia sesion" [ref=e138] [cursor=pointer]:
          - /url: /auth/login
  - button "Open Next.js Dev Tools" [ref=e144] [cursor=pointer]
  - alert [ref=e148]: Unete
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | const ROLES = [
  4   |   { name: "CLIENTE", email: "cliente_test_" + Date.now() + "@test.com", password: "Test123!", username: "cliente_test_" + Date.now(), nombre: "Cliente Test", provincia: "Buenos Aires", municipio: "La Plata" },
  5   |   { name: "NEGOCIO", email: "negocio_test_" + Date.now() + "@test.com", password: "Test123!", username: "negocio_test_" + Date.now(), nombre: "Negocio Test", provincia: "Buenos Aires", municipio: "La Plata" },
  6   |   { name: "LOGISTICA", email: "logistica_test_" + Date.now() + "@test.com", password: "Test123!", username: "logistica_test_" + Date.now(), nombre: "Logistica Test", provincia: "Buenos Aires", municipio: "La Plata" },
  7   |   { name: "ADMIN", email: "admin_test_" + Date.now() + "@test.com", password: "Test123!", username: "admin_test_" + Date.now(), nombre: "Admin Test", provincia: "Buenos Aires", municipio: "La Plata" },
  8   | ];
  9   | 
  10  | const BASE_URL = "http://localhost:3000";
  11  | 
  12  | test.describe("User Registration & Login Flow", () => {
  13  |   for (const role of ROLES) {
  14  |     test(`${role.name} - full auth flow: register, login, logout, re-login`, async ({ page }) => {
  15  |       // ===== REGISTER =====
  16  |       await page.goto(`${BASE_URL}/auth/registro`);
  17  |       await page.waitForLoadState("networkidle");
  18  | 
  19  |       await page.fill('input[id="nombre"]', role.nombre);
  20  |       await page.fill('input[id="username"]', role.username);
  21  |       await page.fill('input[id="email"]', role.email);
  22  |       await page.fill('input[id="password"]', role.password);
  23  |       await page.fill('input[id="confirmPassword"]', role.password);
  24  |       await page.fill('input[id="provincia"]', role.provincia);
  25  |       await page.fill('input[id="municipio"]', role.municipio);
  26  | 
  27  |       // Seleccionar rol
  28  |       await page.click(`button:has-text("${role.name}")`);
  29  | 
  30  |       await page.click('button[type="submit"]');
  31  |       await page.waitForLoadState("networkidle");
  32  |       await page.waitForTimeout(8000);
  33  | 
  34  |       // Verificar que redirige al dashboard correspondiente
  35  |       let currentUrl = page.url();
  36  |       console.log(`${role.name} registration - Current URL:`, currentUrl);
  37  | 
  38  |       // Check for error message - look for the error div specifically
  39  |       const errorDiv = page.locator('.bg-destructive, [role="alert"]').first();
  40  |       if (await errorDiv.isVisible({ timeout: 3000 }).catch(() => false)) {
  41  |         const errorText = await errorDiv.textContent();
  42  |         console.log(`${role.name} registration error:`, errorText);
  43  |       } else {
  44  |         // Check for loading state
  45  |         const loadingBtn = page.locator('button:has-text("Creando cuenta..."), button:has-text("Registrar")');
  46  |         if (await loadingBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
  47  |           console.log(`${role.name} registration: still loading...`);
  48  |           await page.waitForTimeout(5000);
  49  |           currentUrl = page.url();
  50  |           console.log(`${role.name} registration after wait - Current URL:`, currentUrl);
  51  |         }
  52  |       }
  53  | 
  54  |       const expectedDashboard = {
  55  |         CLIENTE: "/cliente",
  56  |         NEGOCIO: "/negocio",
  57  |         LOGISTICA: "/logistica",
  58  |         ADMIN: "/admin",
  59  |       }[role.name];
  60  | 
> 61  |       expect(currentUrl).toContain(expectedDashboard);
      |                          ^ Error: expect(received).toContain(expected) // indexOf
  62  | 
  63  |       // ===== LOGOUT =====
  64  |       // Buscar botón de cerrar sesión
  65  |       const logoutButton = page.locator('button:has-text("Cerrar sesión"), a:has-text("Cerrar sesión"), [data-testid="logout"]');
  66  |       if (await logoutButton.isVisible()) {
  67  |         await logoutButton.click();
  68  |         await page.waitForLoadState("networkidle");
  69  |         await page.waitForTimeout(2000);
  70  |       } else {
  71  |         // Buscar en menú desplegable
  72  |         const userMenu = page.locator('[data-testid="user-menu"], button[aria-label="Menú de usuario"]').first();
  73  |         if (await userMenu.isVisible()) {
  74  |           await userMenu.click();
  75  |           await page.waitForTimeout(500);
  76  |           const logoutOption = page.locator('[role="menuitem"]:has-text("Cerrar sesión"), a:has-text("Cerrar sesión")');
  77  |           if (await logoutOption.isVisible()) {
  78  |             await logoutOption.click();
  79  |             await page.waitForLoadState("networkidle");
  80  |             await page.waitForTimeout(2000);
  81  |           }
  82  |         }
  83  |       }
  84  | 
  85  |       // Verificar que redirigió al login o home
  86  |       currentUrl = page.url();
  87  |       console.log(`${role.name} logout - Current URL:`, currentUrl);
  88  | 
  89  |       // ===== LOGIN =====
  90  |       await page.goto(`${BASE_URL}/auth/login`);
  91  |       await page.waitForLoadState("networkidle");
  92  | 
  93  |       await page.fill('input[id="identifier"]', role.email);
  94  |       await page.fill('input[id="password"]', role.password);
  95  |       await page.click('button[type="submit"]');
  96  |       await page.waitForLoadState("networkidle");
  97  |       await page.waitForTimeout(5000);
  98  | 
  99  |       currentUrl = page.url();
  100 |       console.log(`${role.name} login - Current URL:`, currentUrl);
  101 | 
  102 |       // Verificar que el login fue exitoso
  103 |       expect(currentUrl).not.toContain("/auth/login");
  104 |       expect(currentUrl).toContain(expectedDashboard);
  105 | 
  106 |       // Verificar que el usuario está loggeado
  107 |       const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Cerrar sesión"), a:has-text("Cerrar sesión")');
  108 |       await expect(userMenu.first()).toBeVisible({ timeout: 5000 });
  109 | 
  110 |       // ===== RE-LOGIN =====
  111 |       // Cerrar sesión otra vez
  112 |       const logoutButton2 = page.locator('button:has-text("Cerrar sesión"), a:has-text("Cerrar sesión"), [data-testid="logout"]');
  113 |       if (await logoutButton2.isVisible()) {
  114 |         await logoutButton2.click();
  115 |         await page.waitForLoadState("networkidle");
  116 |         await page.waitForTimeout(2000);
  117 |       } else {
  118 |         const userMenu2 = page.locator('[data-testid="user-menu"], button[aria-label="Menú de usuario"]').first();
  119 |         if (await userMenu2.isVisible()) {
  120 |           await userMenu2.click();
  121 |           await page.waitForTimeout(500);
  122 |           const logoutOption2 = page.locator('[role="menuitem"]:has-text("Cerrar sesión"), a:has-text("Cerrar sesión")');
  123 |           if (await logoutOption2.isVisible()) {
  124 |             await logoutOption2.click();
  125 |             await page.waitForLoadState("networkidle");
  126 |             await page.waitForTimeout(2000);
  127 |           }
  128 |         }
  129 |       }
  130 | 
  131 |       // Volver a hacer login
  132 |       await page.goto(`${BASE_URL}/auth/login`);
  133 |       await page.waitForLoadState("networkidle");
  134 |       await page.fill('input[id="identifier"]', role.email);
  135 |       await page.fill('input[id="password"]', role.password);
  136 |       await page.click('button[type="submit"]');
  137 |       await page.waitForLoadState("networkidle");
  138 |       await page.waitForTimeout(5000);
  139 | 
  140 |       // Verificar re-login exitoso
  141 |       currentUrl = page.url();
  142 |       console.log(`${role.name} re-login - Current URL:`, currentUrl);
  143 |       expect(currentUrl).not.toContain("/auth/login");
  144 |       expect(currentUrl).toContain(expectedDashboard);
  145 | 
  146 |       const userMenu2 = page.locator('[data-testid="user-menu"], button:has-text("Cerrar sesión"), a:has-text("Cerrar sesión")');
  147 |       await expect(userMenu2.first()).toBeVisible({ timeout: 5000 });
  148 |     });
  149 |   }
  150 | });
```