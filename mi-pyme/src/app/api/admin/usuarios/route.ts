import { NextResponse } from "next/server";
import {
  crearUsuarioAdminAction,
  listarUsuariosAdminAction,
} from "@/lib/actions";
import { readJsonBody, routeErrorResponse } from "@/lib/api/route-error";
import { requireRole } from "@/lib/auth/requireRole";
import { Rol } from "@/lib/auth/roles";
import type {
  CrearUsuarioAdminInput,
  RolUsuarioAdmin,
} from "@/services/AdminUserService";

const roles: readonly RolUsuarioAdmin[] = ["ADMIN", "CLIENTE", "NEGOCIO", "LOGISTICA"];
const estados = ["ACTIVO", "INACTIVO", "ELIMINADO", "TODOS"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalStringFields(
  value: Record<string, unknown>,
  fields: readonly string[]
): boolean {
  return fields.every(
    (field) => value[field] === undefined || typeof value[field] === "string"
  );
}

function isCreateUserInput(value: unknown): value is CrearUsuarioAdminInput {
  if (
    !isRecord(value) ||
    typeof value.nombre !== "string" ||
    typeof value.email !== "string" ||
    typeof value.password !== "string" ||
    typeof value.rol !== "string" ||
    !roles.some((role) => role === value.rol)
  ) {
    return false;
  }
  if (
    (value.username !== undefined && typeof value.username !== "string") ||
    (value.confirmarCrearAdmin !== undefined &&
      typeof value.confirmarCrearAdmin !== "boolean") ||
    (value.forzarCambioPassword !== undefined &&
      typeof value.forzarCambioPassword !== "boolean")
  ) {
    return false;
  }
  if (value.negocio !== undefined) {
    if (
      !isRecord(value.negocio) ||
      !isOptionalStringFields(value.negocio, [
        "nombre",
        "descripcion",
        "areaId",
        "provincia",
        "municipio",
        "telefono",
        "emailContacto",
        "direccion",
      ])
    ) {
      return false;
    }
  }
  if (value.logistica !== undefined) {
    if (
      !isRecord(value.logistica) ||
      !isOptionalStringFields(value.logistica, [
        "nombre",
        "zonaCobertura",
        "contacto",
      ]) ||
      (value.logistica.alcanceNacional !== undefined &&
        typeof value.logistica.alcanceNacional !== "boolean")
    ) {
      return false;
    }
  }
  return true;
}

export async function GET(request: Request) {
  try {
    await requireRole([Rol.ADMIN]);
    const params = new URL(request.url).searchParams;
    const requestedRole = params.get("rol");
    const requestedState = params.get("estado");
    const rol = roles.find((value) => value === requestedRole);
    const estado = estados.find((value) => value === requestedState);
    if (requestedRole && !rol) {
      return NextResponse.json({ error: "El rol indicado no es válido" }, { status: 400 });
    }
    if (requestedState && !estado) {
      return NextResponse.json({ error: "El estado indicado no es válido" }, { status: 400 });
    }
    return NextResponse.json(
      await listarUsuariosAdminAction({
        rol,
        estado,
        desde: params.get("desde") ?? undefined,
        hasta: params.get("hasta") ?? undefined,
      })
    );
  } catch (error: unknown) {
    return routeErrorResponse(error, "GET /api/admin/usuarios");
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([Rol.ADMIN]);
    const body = await readJsonBody(request);
    if (!isCreateUserInput(body)) {
      return NextResponse.json({ error: "Datos de usuario no válidos" }, { status: 400 });
    }
    const result = await crearUsuarioAdminAction(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    return routeErrorResponse(error, "POST /api/admin/usuarios");
  }
}
