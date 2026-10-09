import "dotenv/config";
import { defineConfig } from "prisma/config";

const args = process.argv.slice(2);
const schemaArgIndex = args.indexOf("--schema");
const explicitSchema =
  schemaArgIndex >= 0 ? args[schemaArgIndex + 1] : undefined;
const isTest =
  process.env.NODE_ENV === "test" ||
  (explicitSchema ? explicitSchema.includes("schema.test.prisma") : false);

const databaseUrl = isTest
  ? process.env.DATABASE_URL ?? "file:./data/mipyme.db"
  : process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "postgresql://postgres:postgres@localhost:5432/mipyme";
const shadowDatabaseUrl =
  !isTest && process.env.DIRECT_URL?.startsWith("postgres") ? process.env.DIRECT_URL : undefined;

export default defineConfig({
  schema: isTest ? "prisma/schema.test.prisma" : "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
    shadowDatabaseUrl,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
