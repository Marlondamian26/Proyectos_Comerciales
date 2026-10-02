import type { IEmailProvider } from "./IEmailProvider";
import { ConsoleEmailProvider } from "./ConsoleEmailProvider";
import { SMTPEmailProvider } from "./SMTPEmailProvider";
import { EMAIL_PROVIDER_CONSOLE, EMAIL_PROVIDER_SMTP } from "@/core/constants";

let providerInstance: IEmailProvider | null = null;

/**
 * Resuelve el proveedor de email según la variable de entorno `EMAIL_PROVIDER`.
 *  - `smtp` (prod): SMTPEmailProvider con nodemailer.
 *  - `console` o sin valor (dev): ConsoleEmailProvider.
 *
 * En producción, si se solicita `smtp` pero faltan credenciales, se lanza un
 * error que el EmailQueue captura; las notificaciones in-app siguen funcionando.
 */
export function getEmailProvider(): IEmailProvider {
  if (providerInstance) return providerInstance;

  const provider = process.env.EMAIL_PROVIDER ?? EMAIL_PROVIDER_CONSOLE;

  switch (provider) {
    case EMAIL_PROVIDER_SMTP:
      providerInstance = new SMTPEmailProvider();
      break;
    case EMAIL_PROVIDER_CONSOLE:
    default:
      providerInstance = new ConsoleEmailProvider();
      break;
  }

  return providerInstance;
}

export function setEmailProvider(provider: IEmailProvider): void {
  providerInstance = provider;
}

export { ConsoleEmailProvider, SMTPEmailProvider };
export type { IEmailProvider };
