import { NextResponse } from "next/server";
import { Rol } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/requireRole";
import { getPagoAction } from "@/lib/actions";

const metodoLabels: Record<string, string> = {
  EFECTIVO_CONTRA_ENTREGA: "Efectivo contra entrega",
  TRANSFERENCIA_BANCARIA: "Transferencia bancaria",
  PAGO_MOVIL: "Pago móvil",
  TARJETA: "Tarjeta",
};

const estadoLabels: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  COMPLETADO: "Completado",
  FALLIDO: "Fallido",
  REEMBOLSADO: "Reembolsado",
  CANCELADO: "Cancelado",
};

function formatearMoneda(monto: number, moneda: string): string {
  return new Intl.NumberFormat("es-CU", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 2,
  }).format(monto);
}

function formatearFecha(fecha: Date | string | null): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const pago = result;

    const metodoLabel = metodoLabels[pago.metodo] ?? pago.metodo;
    const estadoLabel = estadoLabels[pago.estado] ?? pago.estado;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Recibo de Pago #${pago.id.slice(-8)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f9f9f9; color: #333; }
    .recibo { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: #f0f0f0; padding: 24px; border-bottom: 2px solid #ddd; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; color: #222; }
    .header .sub { margin-top: 4px; font-size: 14px; color: #666; }
    .content { padding: 24px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .campo-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .campo-valor { font-size: 15px; font-weight: 600; color: #222; margin-top: 2px; }
    .seccion { margin-bottom: 24px; }
    .seccion:last-child { margin-bottom: 0; }
    .seccion h2 { font-size: 16px; font-weight: 600; color: #444; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
    .monto { font-size: 28px; font-weight: 700; color: #222; }
    .footer { background: #f8f8f8; padding: 16px 24px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="recibo">
    <div class="header">
      <h1>Recibo de Pago</h1>
      <div class="sub">Pago #${pago.id.slice(-8)} • Pedido #${pago.pedido.id.slice(-8)}</div>
    </div>
    <div class="content">
      <div class="seccion">
        <h2>Resumen del pago</h2>
        <div class="grid">
          <div>
            <div class="campo-label">Método de pago</div>
            <div class="campo-valor">${metodoLabel}</div>
          </div>
          <div>
            <div class="campo-label">Estado</div>
            <div class="campo-valor">${estadoLabel}</div>
          </div>
          <div>
            <div class="campo-label">Monto</div>
            <div class="campo-valor monto">${formatearMoneda(Number(pago.monto), pago.moneda)}</div>
          </div>
          <div>
            <div class="campo-label">Moneda</div>
            <div class="campo-valor">${pago.moneda}</div>
          </div>
          <div>
            <div class="campo-label">Fecha de creación</div>
            <div class="campo-valor">${formatearFecha(pago.createdAt)}</div>
          </div>
          <div>
            <div class="campo-label">Confirmado</div>
            <div class="campo-valor">${formatearFecha(pago.confirmadoEn)}</div>
          </div>
        </div>
      </div>

      ${pago.referencia ? `
      <div class="seccion">
        <h2>Referencia</h2>
        <div class="campo-valor">${pago.referencia}</div>
      </div>
      ` : ""}

      <div class="seccion">
        <h2>Pedido #${pago.pedido.id.slice(-8)}</h2>
        <div class="grid">
          <div>
            <div class="campo-label">Negocio</div>
            <div class="campo-valor">${pago.pedido.negocio.nombre}</div>
          </div>
          <div>
            <div class="campo-label">Total del pedido</div>
            <div class="campo-valor">${formatearMoneda(Number(pago.pedido.total), pago.moneda)}</div>
          </div>
          <div>
            <div class="campo-label">Tipo de entrega</div>
            <div class="campo-valor">${pago.pedido.tipoEntrega === "DOMICILIO" ? "Domicilio" : "Recogida en tienda"}</div>
          </div>
          <div>
            <div class="campo-label">Dirección de entrega</div>
            <div class="campo-valor">${pago.pedido.direccionEntrega ?? "—"}</div>
          </div>
          <div>
            <div class="campo-label">Cliente</div>
            <div class="campo-valor">${pago.pedido.usuario.nombre ?? pago.pedido.usuario.email}</div>
          </div>
          ${pago.factura ? `
          <div>
            <div class="campo-label">Factura</div>
            <div class="campo-valor">${pago.factura.numero}</div>
          </div>
          ` : ""}
        </div>
      </div>

      ${pago.notasCliente ? `
      <div class="seccion">
        <h2>Notas del cliente</h2>
        <div class="campo-valor">${pago.notasCliente}</div>
      </div>
      ` : ""}

      ${pago.notasNegocio ? `
      <div class="seccion">
        <h2>Observaciones del negocio</h2>
        <div class="campo-valor">${pago.notasNegocio}</div>
      </div>
      ` : ""}
    </div>
    <div class="footer">
      Recibo generado el ${formatearFecha(new Date().toISOString())}
    </div>
  </div>
</body>
</html>`;

    const filename = `recibo-pago-${pago.id.slice(-8)}.html`;
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    console.error("Error generating recibo:", err);
    return NextResponse.json(
      { error: "Error al generar recibo" },
      { status: 500 }
    );
  }
}
