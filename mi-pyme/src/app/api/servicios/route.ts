import { NextResponse } from "next/server";
import { listarServicios } from "@/lib/actions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filtros = {
      ...(searchParams.get("areaId") && {
        areaId: searchParams.get("areaId")!,
      }),
      ...(searchParams.get("subareaId") && {
        subareaId: searchParams.get("subareaId")!,
      }),
      ...(searchParams.get("negocioId") && {
        negocioId: searchParams.get("negocioId")!,
      }),
      ...(searchParams.get("activo") !== null && {
        activo: searchParams.get("activo") === "true",
      }),
    };

    const servicios = await listarServicios(filtros);
    return NextResponse.json(servicios);
  } catch (error) {
    console.error("Error fetching servicios:", error);
    return NextResponse.json(
      { error: "Failed to fetch servicios" },
      { status: 500 }
    );
  }
}
