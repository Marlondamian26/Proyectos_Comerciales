/**
 * Proveedor de email para desarrollo.
 *
 * No envía emails reales: loggea el contenido a la consola. Ideal para pruebas
 * y entornos locales donde no se dispone de SMTP.
 */
import type { IEmailProvider, EmailDestino, ResultadoEnvio } from "./IEmailProvider";

export class ConsoleEmailProvider implements IEmailProvider {
  async enviar(email: EmailDestino): Promise<ResultadoEnvio> {
    const esProd = process.env.NODE_ENV === "production";
    const timestamp = new Date().toISOString();

    console.log(`[EmailProvider:Console] ${timestamp}`);
    console.log("  Para  :", email.to);
    console.log("  Asunto:", email.subject);
    console.log("  --- HTML ---");
    console.log(esProd ? "[contenido oculto en producción]" : email.html);
    console.log("  --- Texto ---");
    console.log(email.text ?? "(sin texto)");
    console.log("[fin email]");

    return { ok: true, mensajeId: `console-${Date.now()}` };
  }
}
