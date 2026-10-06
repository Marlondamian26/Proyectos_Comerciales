/**
 * UptimeRobot keep-alive endpoint.
 *
 * Designed to be pinged periodically (e.g. every 5 minutes) by an external
 * monitor such as UptimeRobot to prevent the backend (serverless function) and
 * the database connection pool from idling out / sleeping on platforms that
 * scale-to-zero (Vercel, etc.).
 *
 * A single lightweight round-trip against the database (`SELECT 1`) is enough to:
 *   1. Keep the backend instance warm — the request executes the Node.js
 *      runtime, preventing scale-to-zero.
 *   2. Keep at least one database connection active, avoiding pooler timeouts
 *      (e.g. Supabase / PgBouncer idle-in-transaction / idle timeouts).
 *
 * Publicly accessible — intentionally excluded from the auth middleware so
 * UptimeRobot can reach it without a session. Cache-free and minimal.
 *
 * Returns:
 * - 200 OK with dependency latency when the database responds.
 * - 503 Service Unavailable if the database query fails.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface KeepAliveResponse {
  ok: boolean;
  timestamp: string;
  uptime: number;
  database: {
    status: "ok" | "error";
    latencyMs: number;
  };
  version: string;
}

export async function GET(): Promise<NextResponse<KeepAliveResponse>> {
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    const response: KeepAliveResponse = {
      ok: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: "ok",
        latencyMs: Date.now() - start,
      },
      version: process.env.npm_package_version || "0.1.0",
    };

    return NextResponse.json(response, { status: 200 });
  } catch (_err) {
    const response: KeepAliveResponse = {
      ok: false,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: "error",
        latencyMs: Date.now() - start,
      },
      version: process.env.npm_package_version || "0.1.0",
    };

    return NextResponse.json(response, { status: 503 });
  }
}
