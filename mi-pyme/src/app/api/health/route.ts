/**
 * Health check endpoint for container orchestration.
 *
 * Returns:
 * - 200 OK if the application is healthy
 * - 503 Service Unavailable if any dependency is unhealthy
 *
 * This endpoint is designed to be compatible with:
 * - Docker health checks
 * - Kubernetes liveness/readiness probes
 * - Load balancer health checks
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCache } from "@/infrastructure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthCheck {
  status: "healthy" | "unhealthy";
  latency?: number;
  error?: string;
}

interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    cache: HealthCheck;
    memory: HealthCheck;
  };
  version: string;
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const checks: HealthResponse["checks"] = {
    database: { status: "unhealthy" },
    cache: { status: "unhealthy" },
    memory: { status: "unhealthy" },
  };

  // Database check
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: "healthy",
      latency: Date.now() - start,
    };
  } catch (err) {
    checks.database = {
      status: "unhealthy",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Cache check
  try {
    const start = Date.now();
    const testKey = "_healthcheck_" + Date.now();
    await getCache().set(testKey, { test: true });
    const value = await getCache().get<{ test: boolean }>(testKey);
    await getCache().del(testKey);
    checks.cache = {
      status: value?.test === true ? "healthy" : "unhealthy",
      latency: Date.now() - start,
    };
  } catch (err) {
    checks.cache = {
      status: "unhealthy",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Memory check
  try {
    const usage = process.memoryUsage();
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
    checks.memory = {
      status: heapUsedPercent < 90 ? "healthy" : "unhealthy",
      latency: Math.round(heapUsedPercent),
    };
  } catch (err) {
    checks.memory = {
      status: "unhealthy",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const allHealthy = Object.values(checks).every(
    (c) => c.status === "healthy"
  );

  const response: HealthResponse = {
    status: allHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    version: process.env.npm_package_version || "0.1.0",
  };

  return NextResponse.json(response, {
    status: allHealthy ? 200 : 503,
  });
}