import { PrismaClient } from "@/generated/prisma/client";
import path from "path";
import { fileURLToPath } from "node:url";

declare global {
  var __prisma: PrismaClient | undefined;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "..", "..", "..", "data", "mipyme.db");

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath}`,
      },
    },
  });
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = createPrismaClient();
  }
  prisma = global.__prisma;
}

export { cachedQuery } from "@/infrastructure";

export default prisma;