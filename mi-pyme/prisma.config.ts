import { defineConfig } from "prisma/config";

const isTest = process.env.NODE_ENV === "test";

export default defineConfig({
  schema: isTest ? "prisma/schema.test.prisma" : "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
    shadowDatabaseUrl: process.env.DIRECT_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
