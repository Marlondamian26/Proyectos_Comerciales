import { test, expect } from "@playwright/test";

test.describe("B3: Reset password flow (POST-only endpoints)", () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post("/api/test/reset-admin", {
      data: { password: "12345678", mustChangePassword: true },
    });
    await page.context().clearCookies();
  });

  test("admin → solicitar recuperacion → recibir token → resetear password → login con nueva password", async ({
    page,
    request,
  }) => {
    const recuperarRes = await request.post("/api/auth/recuperar", {
      data: { email: "admin@mi-pyme.local" },
    });
    const recuperarBody = await recuperarRes.json();
    expect(recuperarBody.success).toBe(true);
    expect(recuperarBody.token).toBeDefined();

    await page.goto(`/auth/resetear/${recuperarBody.token}`);
    await page.waitForURL(/\/auth\/resetear\//);

    const res = await page.waitForResponse((response) =>
      response.url().includes("/api/auth/resetear/validar")
    );
    const validationData = await res.json();
    expect(validationData.valid).toBe(true);

    await page.fill("#password", "NewSecurePass123");
    await page.fill("#confirmPassword", "NewSecurePass123");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Contrasena actualizada")).toBeVisible();

    await page.click('button[type="submit"]');

    await page.waitForURL("/auth/login");

    await page.fill('#identifier', "admin@mi-pyme.local");
    await page.fill('#password', "NewSecurePass123");
    await page.click('button[type="submit"]');

    await page.waitForURL("/perfil/cambiar-password");
    await expect(
      page.locator("text=Debes cambiar tu contraseña")
    ).toBeVisible();
  });

  test("should show error when new passwords do not match", async ({
    page,
    request,
  }) => {
    const recuperarRes = await request.post("/api/auth/recuperar", {
      data: { email: "admin@mi-pyme.local" },
    });
    const recuperarBody = await recuperarRes.json();

    await page.goto(`/auth/resetear/${recuperarBody.token}`);
    await page.waitForURL(/\/auth\/resetear\//);
    await page.waitForResponse((response) =>
      response.url().includes("/api/auth/resetear/validar")
    );

    await page.fill("#password", "ValidPassword123");
    await page.fill("#confirmPassword", "DifferentPassword123");

    await page.click('button[type="submit"]');

    await expect(page.locator("text=Las contrasenas no coinciden")).toBeVisible();
  });

  test("should reject weak password (too short) with requirements message", async ({
    page,
    request,
  }) => {
    const recuperarRes = await request.post("/api/auth/recuperar", {
      data: { email: "admin@mi-pyme.local" },
    });
    const recuperarBody = await recuperarRes.json();

    await page.goto(`/auth/resetear/${recuperarBody.token}`);
    await page.waitForURL(/\/auth\/resetear\//);
    await page.waitForResponse((response) =>
      response.url().includes("/api/auth/resetear/validar")
    );

    await page.fill("#password", "Ab1");
    await page.fill("#confirmPassword", "Ab1");

    await expect(page.locator("#password-requirements")).toBeVisible();
    await expect(
      page.locator("text=Mínimo 10 caracteres")
    ).toBeVisible();
  });

  test("should reject blacklisted password on reset", async ({
    page,
    request,
  }) => {
    const recuperarRes = await request.post("/api/auth/recuperar", {
      data: { email: "admin@mi-pyme.local" },
    });
    const recuperarBody = await recuperarRes.json();

    await page.goto(`/auth/resetear/${recuperarBody.token}`);
    await page.waitForURL(/\/auth\/resetear\//);
    await page.waitForResponse((response) =>
      response.url().includes("/api/auth/resetear/validar")
    );

    await page.fill("#password", "password123");
    await page.fill("#confirmPassword", "password123");

    await expect(page.locator("#password-requirements")).toBeVisible();
    await expect(
      page.locator("text=Contraseña demasiado común")
    ).toBeVisible();
  });
});

test.describe("B4: sessionVersion invalidation on password change", () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post("/api/test/reset-admin", {
      data: { password: "12345678", mustChangePassword: false },
    });
    await page.context().clearCookies();
  });

  test("after password change, old session is invalidated (redirected to login)", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    await page.fill('#identifier', "admin@mi-pyme.local");
    await page.fill('#password', "12345678");
    await page.click('button[type="submit"]');
    await page.waitForURL("/admin");

    await page.goto("/perfil/cambiar-password");
    await page.waitForURL("/perfil/cambiar-password");

    await page.fill('input[autocomplete="current-password"]', "12345678");
    await page.fill('input[autocomplete="new-password"]', "NewPassword456");
    await page.fill('input[autocomplete="new-password"]', "NewPassword456");

    await page.click('button[type="submit"]');

    await page.waitForURL("/auth/login");
    await expect(
      page.locator("text=Contraseña cambiada correctamente")
    ).toBeVisible();
  });

  test("after password change, old password no longer works", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    await page.fill('#identifier', "admin@mi-pyme.local");
    await page.fill('#password', "12345678");
    await page.click('button[type="submit"]');
    await page.waitForURL("/admin");

    await page.goto("/perfil/cambiar-password");
    await page.fill('input[autocomplete="current-password"]', "12345678");
    await page.fill('input[autocomplete="new-password"]', "Br4ndN3wPass!");
    await page.fill('input[autocomplete="new-password"]', "Br4ndN3wPass!");
    await page.click('button[type="submit"]');
    await page.waitForURL("/auth/login");

    await page.fill('#identifier', "admin@mi-pyme.local");
    await page.fill('#password', "12345678");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Credenciales invalidas")).toBeVisible();
  });

  test("after mustChangePassword change, old session still valid (only password change invalidates)", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    await page.fill('#identifier', "admin@mi-pyme.local");
    await page.fill('#password', "12345678");
    await page.click('button[type="submit"]');
    await page.waitForURL("/admin");

    await page.reload();
    await expect(page).toHaveURL("/admin");
  });
});

test.describe("B7: CLIENTE negocio owner can access /negocio routes", () => {
  test.beforeEach(async ({ request }) => {
    await request.post("/api/test/reset-admin", {
      data: { password: "12345678", mustChangePassword: false },
    });
  });

  test("cliente who owns a negocio can navigate to /negocio", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    await page.fill('#identifier', "e2e-cliente-negocio@test.com");
    await page.fill('#password', "E2eCliente123");
    await page.click('button[type="submit"]');

    await page.waitForURL("/cliente");

    await page.goto("/negocio");
    await page.waitForURL("/negocio");

    await expect(page).toHaveURL(/\/negocio/);
  });

  test("cliente who does NOT own a negocio cannot access /negocio (redirected)", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    await page.fill('#identifier', "admin@mi-pyme.local");
    await page.fill('#password', "12345678");
    await page.click('button[type="submit"]');
    await page.waitForURL("/admin");

    await page.goto("/negocio");

    await expect(page).not.toHaveURL(/\/negocio/);
  });
});

test.describe("B5: Password policy on registration page", () => {
  test("should display password requirements when typing weak password", async ({
    page,
  }) => {
    await page.goto("/auth/registro");

    await page.fill("#password", "weak");

    await expect(page.locator("#password-requirements")).toBeVisible();
    await expect(
      page.locator("text=Mínimo 10 caracteres")
    ).toBeVisible();
  });

  test("should show password requirements when typing blacklisted password", async ({
    page,
  }) => {
    await page.goto("/auth/registro");

    await page.fill("#password", "password123");

    await expect(page.locator("#password-requirements")).toBeVisible();
    await expect(
      page.locator("text=Contraseña demasiado común")
    ).toBeVisible();
  });

  test("should show 'Solicita unirte a Mi-Pyme' CTA for negocio registration", async ({
    page,
  }) => {
    await page.goto("/auth/registro");

    await expect(
      page.locator("text=¿Tienes un negocio?")
    ).toBeVisible();
    await expect(
      page.locator('a[href="/negocios/solicitar"]')
    ).toBeVisible();
  });

  test("should not include role selector in registration form", async ({
    page,
  }) => {
    await page.goto("/auth/registro");

    await expect(
      page.locator('label:has-text("Rol")')
    ).not.toBeVisible();
    await expect(
      page.locator('select[name="rol"]')
    ).not.toBeVisible();
  });
});
