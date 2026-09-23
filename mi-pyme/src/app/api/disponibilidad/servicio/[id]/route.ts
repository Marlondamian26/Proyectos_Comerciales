import { NextResponse } from "next/server";
import { BusinessError } from "@/shared/types";
import { getCuposServicioAction } from "@/lib/actions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get("fecha");

    const result = await getCuposServicioAction(
      id,
      fecha ? new Date(fecha) : undefined
    );
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error fetching cupos servicio:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
