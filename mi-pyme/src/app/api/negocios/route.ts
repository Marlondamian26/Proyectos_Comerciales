import { NextResponse } from "next/server";
import { listarNegocios } from "@/lib/actions";

export async function GET() {
  try {
    const negocios = await listarNegocios();
    return NextResponse.json(negocios);
  } catch (error) {
    console.error("Error fetching negocios:", error);
    return NextResponse.json(
      { error: "Failed to fetch negocios" },
      { status: 500 }
    );
  }
}
