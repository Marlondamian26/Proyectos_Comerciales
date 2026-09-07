import { NextResponse } from "next/server";
import { listarProductos } from "@/lib/actions";

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
      ...(searchParams.get("disponibleHoy") !== null && {
        disponibleHoy: searchParams.get("disponibleHoy") === "true",
      }),
    };

    const productos = await listarProductos(filtros);
    return NextResponse.json(productos);
  } catch (error) {
    console.error("Error fetching productos:", error);
    return NextResponse.json(
      { error: "Failed to fetch productos" },
      { status: 500 }
    );
  }
}
