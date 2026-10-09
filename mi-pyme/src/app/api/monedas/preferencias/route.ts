import { NextResponse } from "next/server";
import { PrecioService } from "@/services/PrecioService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId requerido" }, { status: 400 });
  }

  const preference = await import("@/lib/db/prisma").then((m) => m.default.preferenciaMonedaUsuario.findUnique({
    where: { userId },
    select: { moneda: true },
  }));

  return NextResponse.json({ userId, moneda: preference?.moneda ?? "CUP" });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const userId = typeof payload?.userId === "string" ? payload.userId : null;
  const moneda = typeof payload?.moneda === "string" ? payload.moneda : "CUP";

  if (!userId) {
    return NextResponse.json({ error: "userId requerido" }, { status: 400 });
  }

  const service = new PrecioService();
  const result = await service.guardarPreferenciaMoneda(userId, moneda);
  return NextResponse.json(result);
}
