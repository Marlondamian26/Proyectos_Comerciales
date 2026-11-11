import { NextResponse } from "next/server";
import { crearSolicitudRolAction } from "@/lib/actions";
import { readJsonBody, routeErrorResponse } from "@/lib/api/route-error";
import type { SolicitudAltaDTO } from "@/shared/negocio.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSolicitudInput(value: unknown): value is SolicitudAltaDTO {
  if (!isRecord(value) || typeof value.nombreNegocio !== "string") return false;
  if (value.tipo !== undefined && value.tipo !== "NEGOCIO" && value.tipo !== "LOGISTICA") {
    return false;
  }
  for (const key of [
    "descripcion",
    "areaId",
    "provincia",
    "municipio",
    "telefono",
    "emailContacto",
    "direccion",
  ]) {
    if (value[key] !== undefined && value[key] !== null && typeof value[key] !== "string") {
      return false;
    }
  }
  if (
    value.subareaIds !== undefined &&
    (!Array.isArray(value.subareaIds) ||
      !value.subareaIds.every((item) => typeof item === "string"))
  ) {
    return false;
  }
  if (
    value.tiposEnvio !== undefined &&
    (!Array.isArray(value.tiposEnvio) ||
      !value.tiposEnvio.every((item) => typeof item === "string"))
  ) {
    return false;
  }
  return value.alcanceNacional === undefined || typeof value.alcanceNacional === "boolean";
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    if (!isSolicitudInput(body)) {
      return NextResponse.json({ error: "Datos de solicitud no válidos" }, { status: 400 });
    }
    const result = await crearSolicitudRolAction(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    return routeErrorResponse(error, "POST /api/solicitudes-rol");
  }
}
