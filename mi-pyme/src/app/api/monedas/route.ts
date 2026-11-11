import { NextResponse } from "next/server";
import { ExchangeRateService } from "@/services/ExchangeRateService";

export async function GET() {
  const service = new ExchangeRateService();
  const tasas = await service.getRates();

  return NextResponse.json({
    fuente: "ELTOQUE",
    tasas,
    actualizadoEn: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const shouldRefresh = Boolean(payload?.refresh ?? payload?.force ?? false);

  const service = new ExchangeRateService();
  const tasas = await service.syncFromElToque(shouldRefresh);

  return NextResponse.json({
    fuente: "ELTOQUE",
    tasas,
    actualizadoEn: new Date().toISOString(),
  });
}
