/**
 * Configuration module for Mi-Pyme.
 *
 * Centralizes all environment variables and application settings.
 * Can be used by any service (Server Actions, Nest.js, etc.) without
 * tight coupling to Next.js.
 */

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("file:./data/mipyme.db"),
  DATABASE_URL_POSTGRES: z.string().optional(),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url().optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  CACHE_TTL_SECONDS: z.coerce.number().default(600),
  CACHE_CHECKPERIOD_SECONDS: z.coerce.number().default(120),
  CACHE_PERSISTENCE_PATH: z.string().default("./data/cache/cache.json"),
  RESERVATION_TTL_MINUTES: z.coerce.number().default(15),
  TAX_RATE: z.coerce.number().default(0.10),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default("info"),
  LOG_FORMAT: z.enum(["json", "text"]).default("text"),
  ENABLE_CACHE: z.coerce.boolean().default(true),
  ENABLE_RATE_LIMIT: z.coerce.boolean().default(true),
  ENABLE_HEALTH_CHECKS: z.coerce.boolean().default(true),
  MESSAGE_BROKER_URL: z.string().optional(),
  MESSAGE_BROKER_TYPE: z
    .enum(["rabbitmq", "kafka", "none"])
    .default("none"),
  METRICS_ENABLED: z.coerce.boolean().default(false),
  METRICS_PORT: z.coerce.number().default(9090).optional(),
  HEALTH_CHECK_ENABLED: z.coerce.boolean().default(true),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Invalid environment variables:", result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const config: EnvConfig = loadConfig();

export function getConfig<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
  return config[key];
}