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
  : process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL (or DIRECT_URL) must be set for Prisma.");
}

export default defineConfig({
  schema: isTest ? "prisma/schema.test.prisma" : "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
    shadowDatabaseUrl: isTest ? undefined : process.env.SHADOW_DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
