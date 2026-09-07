import { NextResponse } from "next/server";
import { listarSubareas } from "@/lib/actions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const areaId = searchParams.get("areaId") ?? undefined;
    const subareas = await listarSubareas(areaId);
    return NextResponse.json(subareas);
  } catch (error) {
    console.error("Error fetching subareas:", error);
    return NextResponse.json(
      { error: "Failed to fetch subareas" },
      { status: 500 }
    );
  }
}
