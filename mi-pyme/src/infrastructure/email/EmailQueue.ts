/**
 * EmailQueue — cola in-memory para envío asíncrono de emails.
 *
 * Diseñada para no bloquear: `NotificacionService.emitir` encola y retorna
 * inmediatamente. Los emails se procesan en background vía `setImmediate`.
 *
 * Reintentos: 3 intentos con backoff exponencial (1s, 2s, 4s).
 *
 * TODO (Fase 4): migrar a cola persistente en BD cuando se adote
 * RabbitMQ/Kafka reemplazando el InMemoryEventBus.
 */
import { getLogger } from "./logger";
import { getEmailProvider } from "./EmailService";
import type { EmailDestino } from "./IEmailProvider";
import prisma from "@/lib/db/prisma";
import type { Notificacion } from "@/generated/prisma/client";

export interface EmailJob {
  notificacionId: string;
  to: string;
  asunto: string;
  html: string;
  text?: string;
}

const MAX_INTENTOS = 3;
const BACKOFF_BASE_MS = 1000;

type EstadoJob = "pendiente" | "procesando" | "completado" | "fallido";

interface JobInternal {
  job: EmailJob;
  intento: number;
  estado: EstadoJob;
  ultimoError?: string;
}

export class EmailQueue {
  private cola: JobInternal[] = [];
  private procesando = false;
  private logger = getLogger();

  encolar(job: EmailJob): void {
    this.cola.push({ job, intento: 0, estado: "pendiente" });
    void this.procesarAsync();
  }

  /**
   * Procesa un job con reintentos y backoff exponencial.
   * Retorna void — nunca relanza; los errores se registran en la Notificacion.
   */
  private async procesarJob(internal: JobInternal): Promise<void> {
    const { job } = internal;
    internal.estado = "procesando";

    try {
      const provider = getEmailProvider();
      const resultado = await provider.enviar({
        to: job.to,
        subject: job.asunto,
        html: job.html,
        text: job.text,
      });

      if (resultado.ok) {
        internal.estado = "completado";
        await this.registrarExito(job.notificacionId, resultado.mensajeId);
        this.logger.info("Email enviado exitosamente", {
          notificacionId: job.notificacionId,
          para: job.to,
          mensajeId: resultado.mensajeId,
        });
      } else {
        throw new Error(resultado.error ?? "Error desconocido del proveedor");
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : String(err);
      internal.intento += 1;
      internal.ultimoError = mensaje;

      this.logger.warn("Intento de envío de email fallido", {
        notificacionId: job.notificacionId,
        intento: internal.intento,
        error: mensaje,
      });

      if (internal.intento >= MAX_INTENTOS) {
        internal.estado = "fallido";
        await this.registrarFallo(job.notificacionId, mensaje);
        this.logger.error("Email falló tras reintentos agotados", {
          notificacionId: job.notificacionId,
          intentos: internal.intento,
          error: mensaje,
        });
      } else {
        const delay = BACKOFF_BASE_MS * Math.pow(2, internal.intento - 1);
        internal.estado = "pendiente";
        setTimeout(() => {
          if (this.cola.includes(internal)) {
            void this.procesarJob(internal);
          }
        }, delay);
      }
    }
  }

  private async procesarAsync(): Promise<void> {
    if (this.procesando) return;
    this.procesando = true;

    try {
      while (this.cola.length > 0) {
        const pendiente = this.cola.find((c) => c.estado === "pendiente");
        if (!pendiente) break;

        await this.procesarJob(pendiente);

        if (pendiente.estado === "pendiente") {
          break;
        }
        this.cola = this.cola.filter((c) => c !== pendiente || c.estado === "pendiente");
      }
    } catch (err) {
      this.logger.error("Error inesperado procesando cola de emails", {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      this.procesando = false;
    }
  }

  private async registrarExito(notificacionId: string, mensajeId?: string): Promise<void> {
    try {
      await prisma.notificacion.update({
        where: { id: notificacionId },
        data: {
          emailEnviado: true,
          emailEnviadoEn: new Date(),
          emailError: null,
        },
      });
    } catch (err) {
      this.logger.error("Error registrando éxito de email en BD", {
        notificacionId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private async registrarFallo(notificacionId: string, error: string): Promise<void> {
    try {
      await prisma.notificacion.update({
        where: { id: notificacionId },
        data: {
          emailError: error,
        },
      });
    } catch (err) {
      this.logger.error("Error registrando fallo de email en BD", {
        notificacionId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /** Cantidad de jobs pendientes o procesando (para debugging). */
  get tamanio(): number {
    return this.cola.length;
  }

  /** Limpia la cola (útil en tests). */
  limpiar(): void {
    this.cola = [];
    this.procesando = false;
  }
}

let emailQueueInstance: EmailQueue | null = null;

export function getEmailQueue(): EmailQueue {
  if (!emailQueueInstance) {
    emailQueueInstance = new EmailQueue();
  }
  return emailQueueInstance;
}

export function resetEmailQueue(): void {
  if (emailQueueInstance) {
    emailQueueInstance.limpiar();
  }
  emailQueueInstance = null;
}
