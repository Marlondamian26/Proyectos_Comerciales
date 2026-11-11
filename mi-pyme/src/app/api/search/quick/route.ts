import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import prisma from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 8;
const MIN_QUERY_LENGTH = 2;
const RATE_LIMIT_MS = 1000;
const RATE_LIMIT_MAX = 10;
const CACHE_TTL_MS = 5000;

const rateLimits = new Map<string, number[]>();
const cache = new Map<string, { data: unknown; timestamp: number }>();

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "***@***";
  const masked = name.length > 2 ? name[0] + "***" : "***";
  return `${masked}@${domain}`;
}

function getCacheKey(query: string, limit: number, offset: number, userRol: string): string {
  return `${userRol}:${query}:${limit}:${offset}`;
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const timestamps = rateLimits.get(identifier) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_MS);
  recent.push(now);
  rateLimits.set(identifier, recent);
  return recent.length <= RATE_LIMIT_MAX;
}

export async function GET(request: Request) {
  try {
    const startTime = performance.now();
    const session = await auth();
    const userRol = session?.user?.rol ?? null;

    if (!userRol) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Demasiadas solicitudes, intenta de nuevo" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10), 20);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    if (query.length < MIN_QUERY_LENGTH) {
      return NextResponse.json({
        query,
        results: { products: [], services: [], logistics: [], users: [] },
        meta: { took_ms: Math.round(performance.now() - startTime), limit, offset },
      });
    }

    const cacheKey = getCacheKey(query, limit, offset, userRol);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        ...(cached.data as object),
        meta: { took_ms: Math.round(performance.now() - startTime), limit, offset },
      });
    }

    const searchTerm = `%${query}%`;

    const [products, services, logistics, users] = await Promise.all([
      searchProducts(searchTerm, limit, offset),
      searchServices(searchTerm, limit, offset),
      userRol === Rol.ADMIN || userRol === Rol.CLIENTE
        ? searchBusinesses(searchTerm, limit, offset)
        : Promise.resolve([]),
      userRol === Rol.ADMIN ? searchUsers(searchTerm, limit, offset) : Promise.resolve([]),
    ]);

    const data = {
      query,
      results: { products, services, logistics, users },
      meta: { took_ms: Math.round(performance.now() - startTime), limit, offset },
    };

    cache.set(cacheKey, { data, timestamp: Date.now() });

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function searchProducts(searchTerm: string, limit: number, offset: number) {
  return prisma.producto.findMany({
    where: {
      activo: true,
      OR: [
        { nombre: { contains: searchTerm } },
        { descripcion: { contains: searchTerm } },
        { negocio: { nombre: { contains: searchTerm } } },
      ],
    },
    include: { negocio: { select: { nombre: true } } },
    take: limit,
    skip: offset,
    orderBy: { nombre: "asc" },
  });
}

async function searchServices(searchTerm: string, limit: number, offset: number) {
  return prisma.servicio.findMany({
    where: {
      activo: true,
      OR: [
        { nombre: { contains: searchTerm } },
        { descripcion: { contains: searchTerm } },
        { negocio: { nombre: { contains: searchTerm } } },
      ],
    },
    include: { negocio: { select: { nombre: true } } },
    take: limit,
    skip: offset,
    orderBy: { nombre: "asc" },
  });
}

async function searchBusinesses(searchTerm: string, limit: number, offset: number) {
  return prisma.negocio.findMany({
    where: {
      activo: true,
      nombre: { contains: searchTerm },
    },
    select: { id: true, nombre: true },
    take: limit,
    skip: offset,
    orderBy: { nombre: "asc" },
  });
}

async function searchUsers(searchTerm: string, limit: number, offset: number) {
  return prisma.user.findMany({
    where: {
      OR: [
        { nombre: { contains: searchTerm } },
        { email: { contains: searchTerm } },
        { username: { contains: searchTerm } },
      ],
    },
    select: { id: true, nombre: true, email: true, rol: true },
    take: limit,
    skip: offset,
    orderBy: { nombre: "asc" },
  }).then((users) =>
    users.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email_masked: maskEmail(u.email),
      rol: u.rol,
    }))
  );
}
