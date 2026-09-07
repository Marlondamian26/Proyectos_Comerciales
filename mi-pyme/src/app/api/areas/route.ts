import { NextResponse } from "next/server";
import { listarAreas } from "@/lib/actions";

export async function GET() {
  try {
    const areas = await listarAreas();
    return NextResponse.json(areas);
  } catch (error) {
    console.error("Error fetching areas:", error);
    return NextResponse.json(
      { error: "Failed to fetch areas" },
      { status: 500 }
    );
  }
}
