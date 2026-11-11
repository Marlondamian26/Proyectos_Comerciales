/**
 * Interfaz del proveedor de email.
 *
 * Framework-agnostic: cualquier implementación (console, SMTP, mock) sigue este
 * contrato. En producción se usará SMTPEmailProvider; en dev, ConsoleEmailProvider.
 */
export interface EmailDestino {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface ResultadoEnvio {
  ok: boolean;
  mensajeId?: string;
  error?: string;
}

export interface IEmailProvider {
  /**
   * Envía un email. Nunca debe bloquecar el flujo principal: si falla,
   * el llamador (EmailQueue) decide el manejo de reintentos.
   */
  enviar(email: EmailDestino): Promise<ResultadoEnvio>;
}
