import { NextResponse } from "next/server";
import { listarAreas } from "@/lib/actions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const search = searchParams.get("search") ?? undefined;

    const areas = await listarAreas();

    let filteredAreas = areas;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredAreas = areas.filter(
        (area) =>
          area.nombre.toLowerCase().includes(searchLower) ||
          area.slug.toLowerCase().includes(searchLower)
      );
    }

    const total = filteredAreas.length;
    const offset = (page - 1) * limit;
    const paginatedAreas = filteredAreas.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginatedAreas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching areas:", error);
    return NextResponse.json(
      { error: "Failed to fetch areas" },
      { status: 500 }
    );
  }
}
