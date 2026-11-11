import { test, expect } from "@playwright/test";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

test.describe("A5: lastLoginAt actualizado en login exitoso (E2E)", () => {
  test.beforeEach(async () => {
    await prisma.user.updateMany({
      where: { email: "e2e-lastlogin@test.com" },
      data: { lastLoginAt: null },
    });
    await prisma.user.updateMany({
      where: { email: "e2e-inactive@test.com" },
      data: { lastLoginAt: null },
    });
  });

  test("login exitoso actualiza lastLoginAt", async ({ page }) => {
    const before = await prisma.user.findUnique({
      where: { email: "e2e-lastlogin@test.com" },
      select: { lastLoginAt: true },
    });
    expect(before!.lastLoginAt).toBeNull();

    await page.goto("/auth/login");
    await page.fill('#identifier', "e2e-lastlogin@test.com");
    await page.fill('#password', "lastlogin123");
    await page.click('button[type="submit"]');

    await page.waitForURL("/cliente");
    await expect(page).toHaveURL("/cliente");

    const after = await prisma.user.findUnique({
      where: { email: "e2e-lastlogin@test.com" },
      select: { lastLoginAt: true },
    });
    expect(after!.lastLoginAt).not.toBeNull();

    const diff = Date.now() - new Date(after!.lastLoginAt!).getTime();
    expect(diff).toBeLessThan(10000);
    expect(diff).toBeGreaterThan(-1000);
  });

  test("login fallido por usuario inactivo no actualiza lastLoginAt", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    await page.fill('#identifier', "e2e-inactive@test.com");
    await page.fill('#password', "e2e-inactive-pass");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Credenciales invalidas")).toBeVisible();

    const after = await prisma.user.findUnique({
      where: { email: "e2e-inactive@test.com" },
      select: { lastLoginAt: true },
    });
    expect(after!.lastLoginAt).toBeNull();
  });

  test("login fallido por password incorrecto no actualiza lastLoginAt", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    await page.fill('#identifier', "e2e-lastlogin@test.com");
    await page.fill('#password', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Credenciales invalidas")).toBeVisible();

    const after = await prisma.user.findUnique({
      where: { email: "e2e-lastlogin@test.com" },
      select: { lastLoginAt: true },
    });
    expect(after!.lastLoginAt).toBeNull();
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});
