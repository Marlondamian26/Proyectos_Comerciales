import { NextResponse } from "next/server";
import { BusinessError } from "@/shared/types";

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      throw new BusinessError("El cuerpo JSON no es válido", "JSON_INVALIDO", 400);
    }
    throw error;
  }
}

export function routeErrorResponse(error: unknown, context: string) {
  if (error instanceof BusinessError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }

  if (error instanceof Error && error.message === "No autorizado") {
    return NextResponse.json({ error: "Autenticación requerida" }, { status: 401 });
  }
  if (error instanceof Error && error.message === "Acceso denegado") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  console.error(`[${context}]`, error);
  return NextResponse.json(
    { error: "Ocurrió un error interno al procesar la solicitud" },
    { status: 500 }
  );
}
