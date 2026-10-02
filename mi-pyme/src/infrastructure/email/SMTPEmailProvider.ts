/**
 * Proveedor de email para producción vía SMTP con nodemailer.
 *
 * Configuración vía env vars:
 *   - SMTP_HOST     (default "localhost")
 *   - SMTP_PORT     (default 587)
 *   - SMTP_SECURE   (default "false" — TLS sobre puerto 587)
 *   - SMTP_USER     (usuario SMTP)
 *   - SMTP_PASSWORD (password SMTP)
 *   - SMTP_FROM     (remitente, default "no-reply@mi-pyme.local")
 *
 * Si no hay creds configuradas en producción, se lanza un error que el
 * EmailQueue captura; las notificaciones in-app siguen funcionando.
 */
import type { IEmailProvider, EmailDestino, ResultadoEnvio } from "./IEmailProvider";
import { getLogger } from "./logger";
import type { Transporter } from "nodemailer";
import { createTransport } from "nodemailer";
import type { Transporter as TransporterType } from "nodemailer";

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
  from: string;
}

export class SMTPEmailProvider implements IEmailProvider {
  private config: SMTPConfig;
  private transporter: TransporterType | null = null;

  constructor(config?: Partial<SMTPConfig>) {
    this.config = {
      host: config?.host ?? process.env.SMTP_HOST ?? "localhost",
      port: Number(config?.port ?? process.env.SMTP_PORT ?? 587),
      secure: config?.secure ?? process.env.SMTP_SECURE === "true",
      auth: {
        user: config?.auth?.user ?? process.env.SMTP_USER ?? "",
        pass: config?.auth?.pass ?? process.env.SMTP_PASSWORD ?? "",
      },
      from: config?.from ?? process.env.SMTP_FROM ?? "no-reply@mi-pyme.local",
    };
  }

  private async ensureTransporter(): Promise<TransporterType> {
    if (!this.transporter) {
      this.transporter = createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth.user
          ? { user: this.config.auth.user, pass: this.config.auth.pass }
          : undefined,
      });
    }
    return this.transporter;
  }

  async enviar(email: EmailDestino): Promise<ResultadoEnvio> {
    const logger = getLogger();
    const transporter = await this.ensureTransporter();

    try {
      const info = await transporter.sendMail({
        from: this.config.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      logger.info("Email enviado", {
        para: email.to,
        mensajeId: info.messageId,
      });

      return {
        ok: true,
        mensajeId: info.messageId,
      };
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : String(err);
      logger.error("Error enviando email", {
        para: email.to,
        error: mensaje,
      });
      return { ok: false, error: mensaje };
    }
  }
}
