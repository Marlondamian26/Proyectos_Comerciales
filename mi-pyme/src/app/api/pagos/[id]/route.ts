import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import {
  getPagoAction,
  confirmarPagoAction,
  rechazarPagoAction,
  reembolsarPagoAction,
  cancelarPagoAction,
  subirComprobanteAction,
  confirmarPagoConCodigoAction,
  validarCodigoEntregaAction,
  getCodigoEntregaAction,
  regenerarCodigoEntregaAction,
} from "@/lib/actions";
import { BusinessError } from "@/shared/types";

function handleError(err: unknown) {
  if (err instanceof BusinessError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status }
    );
  }
  const message = err instanceof Error ? err.message : String(err);
  console.error("Error in pagos/[id] API:", err);
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
    const { id } = await params;

    const result = await getPagoAction(id);

    if (result && typeof result === "object" && "error" in result) {
      return NextResponse.json(
        { error: result.error, code: result.codigo },
        { status: result.statusCode }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    return handleError(err);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole([Rol.CLIENTE, Rol.NEGOCIO, Rol.ADMIN]);
    const { id } = await params;
    const body = await request.json();
    const accion = body.accion;

    let result;

    switch (accion) {
      case "confirmar":
        result = await confirmarPagoAction(id, body.datos);
        break;
      case "rechazar":
        result = await rechazarPagoAction(id, body.motivo);
        break;
       case "reembolsar":
         result = await reembolsarPagoAction(id, body.motivo, body.datosReembolso);
         break;
       case "cancelar":
        result = await cancelarPagoAction(id);
        break;
      case "subir_comprobante":
        result = await subirComprobanteAction(id, body.datos);
        break;
      case "confirmar_con_codigo":
        result = await confirmarPagoConCodigoAction(id, body.codigo, body.datos);
        break;
      case "validar_codigo":
        result = await validarCodigoEntregaAction(id, body.codigo);
        break;
      case "obtener_codigo":
        result = await getCodigoEntregaAction(id);
        break;
      case "regenerar_codigo":
        result = await regenerarCodigoEntregaAction(id, body.motivo);
        break;
      default:
        return NextResponse.json(
          { error: "Acción no válida" },
          { status: 400 }
        );
    }

    if (result && typeof result === "object" && "error" in result) {
      return NextResponse.json(
        { error: result.error, code: result.codigo },
        { status: result.statusCode }
      );
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    return handleError(err);
  }
}
