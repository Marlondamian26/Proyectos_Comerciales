/**
 * Templates de email por tipo de notificación.
 *
 * Cada función devuelve { subject, html, text } listo para enviar.
 * No se loggea el contenido del email en producción.
 */
import type { TipoNotificacion } from "@/generated/prisma/client";
import type { Notificacion } from "@/shared/notificaciones.types";

export interface PlantillaEmail {
  subject: string;
  html: string;
  text: string;
}

interface ContextoTemplate {
  negocioNombre?: string;
  pedidoNumero?: string;
  clienteNombre?: string;
  monto?: string;
  fecha?: string;
  enlace?: string;
}

const URL_BASE = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

function link(href: string): string {
  return href.startsWith("http") ? href : `${URL_BASE}${href}`;
}

const plantillas: Record<
  TipoNotificacion,
  (ctx: ContextoTemplate) => PlantillaEmail
> = {
  PEDIDO_CREADO: (ctx) => ({
    subject: `Nuevo pedido${ctx.pedidoNumero ? ` #${ctx.pedidoNumero}` : ""} en ${ctx.negocioNombre ?? "tu negocio"}`,
    html: `<h2>¡Tienes un nuevo pedido!</h2><p>Hay un nuevo pedido${ctx.pedidoNumero ? ` <strong>#${ctx.pedidoNumero}</strong>` : ""} para <strong>${ctx.negocioNombre ?? "tu negocio"}</strong>.</p><p>Accede al detalle en tu panel de negocio.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Ver pedido</a></p>` : ""}`,
    text: `Tienes un nuevo pedido${ctx.pedidoNumero ? ` #${ctx.pedidoNumero}` : ""} para ${ctx.negocioNombre ?? "tu negocio"}.`,
  }),

  PEDIDO_ESTADO_CAMBIADO: (ctx) => ({
    subject: `Tu pedido${ctx.pedidoNumero ? ` #${ctx.pedidoNumero}` : ""} cambió de estado`,
    html: `<h2>Actualización de pedido</h2><p>Hola ${ctx.clienteNombre ?? "cliente"}, tu pedido${ctx.pedidoNumero ? ` <strong>#${ctx.pedidoNumero}</strong>` : ""} cambió de estado. Consulta el detalle en tu panel.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Ver pedido</a></p>` : ""}`,
    text: `Tu pedido${ctx.pedidoNumero ? ` #${ctx.pedidoNumero}` : ""} cambió de estado.`,
  }),

  PEDIDO_ASIGNADO_LOGISTICA: (ctx) => ({
    subject: `Pedido asignado a logística #${ctx.pedidoNumero ?? ""}`,
    html: `<h2>Pedido asignado</h2><p>Se te asignó el pedido ${ctx.pedidoNumero ?? ""} para gestionar su envío.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Ver detalle</a></p>` : ""}`,
    text: `Se te asignó el pedido ${ctx.pedidoNumero ?? ""} para gestionar su envío.`,
  }),

  RESERVA_CREADA: (ctx) => ({
    subject: `Nueva reserva en ${ctx.negocioNombre ?? "tu negocio"}`,
    html: `<h2>¡Nueva reserva!</h2><p>Hay una nueva reserva en <strong>${ctx.negocioNombre ?? "tu negocio"}</strong>.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Ver reserva</a></p>` : ""}`,
    text: `Nueva reserva en ${ctx.negocioNombre ?? "tu negocio"}.`,
  }),

  RESERVA_CANCELADA: (ctx) => ({
    subject: `Reserva cancelada`,
    html: `<h2>Reserva cancelada</h2><p>La reserva${ctx.pedidoNumero ? ` #${ctx.pedidoNumero}` : ""} ha sido cancelada.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Ver detalle</a></p>` : ""}`,
    text: `Reserva cancelada${ctx.pedidoNumero ? ` #${ctx.pedidoNumero}` : ""}.`,
  }),

  PAGO_COMPROBANTE_SUBIDO: (ctx) => ({
    subject: `Comprobante subido para pedido #${ctx.pedidoNumero ?? ""}`,
    html: `<h2>Comprobante subido</h2><p>El cliente ${ctx.clienteNombre ?? "ha subido"} el comprobante de pago para el pedido ${ctx.pedidoNumero ?? ""}.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Ver pago</a></p>` : ""}`,
    text: `Comprobante subido para pedido #${ctx.pedidoNumero ?? ""}.`,
  }),

  PAGO_CONFIRMADO: (ctx) => ({
    subject: `Pago confirmado — ${ctx.monto ?? "Pago"}`,
    html: `<h2>¡Pago confirmado!</h2><p>Hola ${ctx.clienteNombre ?? "cliente"}, tu pago${ctx.monto ? ` de <strong>${ctx.monto}</strong>` : ""} ha sido confirmado.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Ver pago</a></p>` : ""}`,
    text: `Tu pago${ctx.monto ? ` de ${ctx.monto}` : ""} ha sido confirmado.`,
  }),

  PAGO_RECHAZADO: (ctx) => ({
    subject: `Pago rechazado — pedido #${ctx.pedidoNumero ?? ""}`,
    html: `<h2>Pago rechazado</h2><p>Hola ${ctx.clienteNombre ?? "cliente"}, tu pago para el pedido ${ctx.pedidoNumero ? `#${ctx.pedidoNumero}` : ""} fue rechazado.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Ver detalle</a></p>` : ""}`,
    text: `Tu pago para el pedido ${ctx.pedidoNumero ? `#${ctx.pedidoNumero}` : ""} fue rechazado.`,
  }),

  PAGO_REEMBOLSADO: (ctx) => ({
    subject: `Pago reembolsado — ${ctx.monto ?? ""}`,
    html: `<h2>Pago reembolsado</h2><p>Hola ${ctx.clienteNombre ?? "cliente"}, tu pago${ctx.monto ? ` de <strong>${ctx.monto}</strong>` : ""} ha sido reembolsado.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Ver detalle</a></p>` : ""}`,
    text: `Tu pago${ctx.monto ? ` de ${ctx.monto}` : ""} ha sido reembolsado.`,
  }),

  CODIGO_ENTREGA_REGENERADO: (ctx) => ({
    subject: `Código de entrega regenerado`,
    html: `<h2>Código de entrega regenerado</h2><p>Hola ${ctx.clienteNombre ?? "cliente"}, se ha regenerado el código de entrega para tu pedido${ctx.pedidoNumero ? ` #${ctx.pedidoNumero}` : ""}.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Ver detalle</a></p>` : ""}`,
    text: `Se ha regenerado el código de entrega para tu pedido${ctx.pedidoNumero ? ` #${ctx.pedidoNumero}` : ""}.`,
  }),

  SOLICITUD_ALTA_CREADA: (ctx) => ({
    subject: `Nueva solicitud de alta de negocio`,
    html: `<h2>Nueva solicitud de alta</h2><p>Un nuevo negocio ha solicitado ser dado de alta en la plataforma.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Revisar solicitud</a></p>` : ""}`,
    text: `Nueva solicitud de alta de negocio.`,
  }),

  SOLICITUD_ALTA_APROBADA: (ctx) => ({
    subject: `¡Tu negocio fue aprobado!`,
    html: `<h2>Solicitud aprobada</h2><p>¡Felicidades! Tu negocio <strong>${ctx.negocioNombre ?? "ha sido aprobado"}</strong> está activo.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Ir a mi negocio</a></p>` : ""}`,
    text: `Tu negocio fue aprobado. ¡Ya puedes comenzar a vender!`,
  }),

  SOLICITUD_ALTA_RECHAZADA: (ctx) => ({
    subject: `Solicitud de alta rechazada`,
    html: `<h2>Solicitud rechazada</h2><p>Lo sentimos, tu solicitud de alta para <strong>${ctx.negocioNombre ?? "tu negocio"}</strong> fue rechazada.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Ver detalle</a></p>` : ""}`,
    text: `Tu solicitud de alta fue rechazada.`,
  }),

  DISPONIBILIDAD_AGOTADA: (ctx) => ({
    subject: `Disponibilidad agotada — ${ctx.negocioNombre ?? "tu negocio"}`,
    html: `<h2>Disponibilidad agotada</h2><p>No quedan cupos/disponibilidad para un producto/servicio en <strong>${ctx.negocioNombre ?? "tu negocio"}</strong>.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Ver detalle</a></p>` : ""}`,
    text: `Disponibilidad agotada en ${ctx.negocioNombre ?? "tu negocio"}.`,
  }),

  STOCK_BAJO: (ctx) => ({
    subject: `Stock bajo — ${ctx.negocioNombre ?? "tu negocio"}`,
    html: `<h2>Stock bajo</h2><p>Un producto en <strong>${ctx.negocioNombre ?? "tu negocio"}</strong> está cerca de agotarse. Revisa tu inventario.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Ver inventario</a></p>` : ""}`,
    text: `Stock bajo en ${ctx.negocioNombre ?? "tu negocio"}.`,
  }),

  TRANSPORTE_CONTRATADO: (ctx) => ({
    subject: `Transporte contratado — ${ctx.negocioNombre ?? "tu negocio"}`,
    html: `<h2>Transporte contratado</h2><p>Se ha contratado un servicio de transporte para <strong>${ctx.negocioNombre ?? "tu negocio"}</strong>.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Ver detalle</a></p>` : ""}`,
    text: `Transporte contratado para ${ctx.negocioNombre ?? "tu negocio"}.`,
  }),

  CUPON_PROXIMO_A_EXPIRAR: (ctx) => ({
    subject: `Tu cupón expira pronto`,
    html: `<h2>Cupón próximo a expirar</h2><p>Tu cupón en <strong>${ctx.negocioNombre ?? "tu negocio"}</strong> expira pronto. ¡Úsalo antes de que se vaya!</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Ver cupones</a></p>` : ""}`,
    text: `Tu cupón expira pronto en ${ctx.negocioNombre ?? "tu negocio"}.`,
  }),

  PROMOCION_AGOTADA: (ctx) => ({
    subject: `Promoción agotada — ${ctx.negocioNombre ?? "tu negocio"}`,
    html: `<h2>Promoción agotada</h2><p>Una de tus promociones en <strong>${ctx.negocioNombre ?? "tu negocio"}</strong> ha alcanzado su límite de usos.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Ver promociones</a></p>` : ""}`,
    text: `Promoción agotada en ${ctx.negocioNombre ?? "tu negocio"}.`,
  }),

  BIENVENIDA: (ctx) => ({
    subject: "¡Bienvenido a Mi-Pyme!",
    html: `<h2>¡Bienvenido, ${ctx.clienteNombre ?? "usuario"}!</h2><p>Gracias por registrarte en Mi-Pyme. Ya puedes explorar el catálogo, hacer pedidos y más.</p>${ctx.enlace ? `<p><a href="${link(ctx.enlace)}">Explorar</a></p>` : ""}`,
    text: `¡Bienvenido a Mi-Pyme!`,
  }),

  PASSWORD_CAMBIADO: (ctx) => ({
    subject: "Tu contraseña fue cambiada",
    html: `<h2>Contraseña actualizada</h2><p>Hola ${ctx.clienteNombre ?? "usuario"}, se cambió la contraseña de tu cuenta.</p>`,
    text: `Se cambió la contraseña de tu cuenta.`,
  }),

  LOGIN_NUEVO_DISPOSITIVO: (ctx) => ({
    subject: "Nuevo inicio de sesión",
    html: `<h2>Nuevo inicio de sesión</h2><p>Hola ${ctx.clienteNombre ?? "usuario"}, detectamos un inicio de sesión reciente (${ctx.fecha ?? ""}).</p>`,
    text: `Nuevo inicio de sesión detectado (${ctx.fecha ?? ""}).`,
  }),
};

export function obtenerPlantilla(
  tipo: TipoNotificacion,
  ctx: ContextoTemplate
): PlantillaEmail {
  const fn = plantillas[tipo];
  if (!fn) {
    return {
      subject: "Notificación de Mi-Pyme",
      html: `<p>${ctx.enlace ? `<a href="${link(ctx.enlace)}">Ver detalle</a>` : "Tienes una novedad en Mi-Pyme."}</p>`,
      text: "Tienes una novedad en Mi-Pyme.",
    };
  }
  return fn(ctx);
}

/** Extrae el contexto de template desde una Notificacion persistida. */
export function contextoDesdeNotificacion(
  notificacion: Notificacion
): ContextoTemplate {
  const m = (notificacion.metadata ?? {}) as Record<string, unknown>;
  return {
    negocioNombre: typeof m.negocioNombre === "string" ? m.negocioNombre : undefined,
    pedidoNumero: typeof m.pedidoNumero === "string" ? m.pedidoNumero : undefined,
    clienteNombre: typeof m.clienteNombre === "string" ? m.clienteNombre : undefined,
    monto: typeof m.monto === "string" ? m.monto : undefined,
    fecha: typeof m.fecha === "string" ? m.fecha : undefined,
    enlace: notificacion.enlace ?? undefined,
  };
}
