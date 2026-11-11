/**
 * PagoService - business logic for payment management (Fase 1 — Punto 5).
 *
 * Un Pago está ligado 1:1 a un Pedido. El flujo es manual/semiautomático:
 *   1. El cliente elige método de pago al confirmar checkout → Pago PENDIENTE.
 *   2. Si el método requiere comprobante (transferencia/pago móvil), el cliente
 *      sube referencia/comprobante → Pago EN_PROCESO.
 *   3. El negocio o admin confirma la recepción → Pago COMPLETADO.
 *   4. El admin puede reembolsar (COMPLETADO → REEMBOLSADO).
 *   5. Cualquiera puede cancelar si está PENDIENTE (CLIENTE dueño o ADMIN).
 *
 * No integra pasarelas reales. Ver TODO para Transfermóvil/EnZona o futura pasarela.
 *
 * Framework-agnostic: no Next.js imports.
 */
import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { ICache, getCache, cacheKeys, cachePrefixes, cacheTTL } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import { logAudit } from "./utils/audit";
import { assertPertenencia } from "./utils/permisos";
import { Prisma, Rol } from "@/generated/prisma/client";
import type {
  MetodoPago,
  EstadoPago,
  Pago,
  Pedido,
} from "@/generated/prisma/client";
import type {
  CrearPagoParams,
  SubirComprobanteParams,
  ConfirmarPagoParams,
  ListPagosFiltros,
  ResumenPagosDTO,
} from "@/shared/pagos.types";
import bcrypt from "bcryptjs";
import {
  CODIGO_PAGO_YA_EXISTE,
  CODIGO_ESTADO_INVALIDO,
  CODIGO_METODO_NO_DISPONIBLE,
  CODIGO_NO_AUTORIZADO,
  CODIGO_NO_ENCONTRADO,
  CODIGO_CONFLICTO,
  CODIGO_DUPLICADO,
  CODIGO_VALIDACION,
  MONEDA_DEFECTO,
  CODIGO_LONGITUD,
  CODIGO_DIAS_EXPIRACION,
  CODIGO_INTENTOS_MAXIMOS,
  CODIGO_REGENERACIONES_MAXIMAS,
  CODIGO_MOTIVO_MIN_CARACTERES,
  CODIGO_ERROR_INCORRECTO,
  CODIGO_ERROR_EXPIRADO,
  CODIGO_ERROR_BLOQUEADO,
  CODIGO_ERROR_LIMITE_REGENERACIONES,
  CODIGO_ERROR_METODO_INCORRECTO,
  CODIGO_ERROR_MOTIVO_REQUERIDO,
  ENTIDADES_PAGO_CON_TRANSFERENCIA,
  FORMATO_ID_TRANSFERENCIA,
} from "@/core/constants";

type PrismaTx = Prisma.TransactionClient;
type PagoConRelations = Pago & {
  pedido: Pedido & {
    negocio: { id: string; nombre: string; direccion: string | null };
    usuario: { id: string; email: string; nombre: string | null };
  };
  factura: { id: string; numero: string } | null;
};

export class PagoService extends Service {
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
  }

  /**
   * Valida que el usuario tenga acceso a un pago:
   * - CLIENTE: solo si el pedido le pertenece
   * - NEGOCIO: si el negocio del pedido le pertenece
   * - ADMIN: siempre
   */
  private async assertAccesoPago(
    pagoId: string,
    userId: string,
    rolActual?: string
  ): Promise<PagoConRelations> {
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        pedido: {
          include: {
            negocio: { select: { id: true, nombre: true, direccion: true } },
            usuario: { select: { id: true, email: true, nombre: true } },
          },
        },
        factura: { select: { id: true, numero: true } },
      },
    });

    if (!pago) {
      throw new BusinessError(
        "Pago no encontrado",
        CODIGO_NO_ENCONTRADO,
        404
      );
    }

    if (rolActual === Rol.ADMIN) {
      return pago as PagoConRelations;
    }

    if (rolActual === Rol.CLIENTE) {
      if (pago.pedido.usuarioId !== userId) {
        throw new BusinessError(
          "No tienes permiso para acceder a este pago",
          CODIGO_NO_AUTORIZADO,
          403
        );
      }
      return pago as PagoConRelations;
    }

    // NEGOCIO: validar que el negocio del pedido le pertenezca
    if (rolActual === Rol.NEGOCIO) {
      await assertPertenencia(userId, pago.pedido.negocioId, rolActual);
      return pago as PagoConRelations;
    }

    throw new BusinessError(
      "No tienes permiso para acceder a este pago",
      CODIGO_NO_AUTORIZADO,
      403
    );
  }

  /**
   * Valida coherencia método ↔ tipoEntrega.
   */
  private validarMetodoContraTipoEntrega(
    metodo: MetodoPago,
    tipoEntrega: "DOMICILIO" | "RECOGIDA_TIENDA"
  ): void {
    if (metodo === "EFECTIVO_CONTRA_ENTREGA") {
      // Solo válido para DOMICILIO o RECOGIDA_TIENDA (no aplicaría a otros)
      if (tipoEntrega !== "DOMICILIO" && tipoEntrega !== "RECOGIDA_TIENDA") {
        throw new BusinessError(
          "El efectivo contra entrega requiere entrega a domicilio o recogida en tienda",
          CODIGO_ESTADO_INVALIDO,
          409
        );
      }
     }
   }

   /**
    * Valida el formato del ID de transferencia según la entidad de pago.
    * Fases 1, Punto 5: Conciliación de transferencias.
    */
   private validarIdTransferencia(
     idTransferencia: string | undefined,
     entidadPago: string | undefined
   ): void {
     if (!idTransferencia) return;

     if (!entidadPago) {
       throw new BusinessError(
         "Debe especificar entidadPago cuando se proporciona idTransferencia",
         CODIGO_VALIDACION,
         400
       );
     }

     if (!ENTIDADES_PAGO_CON_TRANSFERENCIA.includes(entidadPago)) {
       throw new BusinessError(
         `entidadPago "${entidadPago}" no es válida para transferencias. Entidades permitidas: ${ENTIDADES_PAGO_CON_TRANSFERENCIA.join(", ")}`,
         CODIGO_VALIDACION,
         400
       );
     }

     const formato = FORMATO_ID_TRANSFERENCIA[entidadPago];
     if (formato && !formato.test(idTransferencia)) {
       throw new BusinessError(
         `El idTransferencia "${idTransferencia}" no cumple el formato esperado para ${entidadPago}`,
         CODIGO_VALIDACION,
         400
       );
     }
   }

   /**
    * Mapeo de errores de Prisma a BusinessError.
    * Captura P2002 (unique constraint) y P2025 (not found).
    */
   private mapearErrorPrisma(error: unknown): never {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
       if (error.code === "P2002") {
         throw new BusinessError(
           "Ya existe un pago con ese ID de transferencia",
           CODIGO_DUPLICADO,
           409
         );
       }
       if (error.code === "P2025") {
         throw new BusinessError(
           "Pago no encontrado",
           CODIGO_NO_ENCONTRADO,
           404
         );
       }
     }
     throw error;
   }

   /**
    * Sincroniza el estadoPago denormalizado en Pedido.
   */
  private async syncEstadoPagoPedido(
    pedidoId: string,
    estadoPago: EstadoPago,
    prismaClient: PrismaTx
  ): Promise<void> {
    await prismaClient.pedido.update({
      where: { id: pedidoId },
      data: { estadoPago },
    });
  }

  /**
   * Crea un Pago para un Pedido.
   * - Valida que el pedido pertenezca al usuario.
   * - Valida que no exista ya un Pago para ese pedido.
   * - Valida coherencia método ↔ tipoEntrega.
   * - Acepta un contexto transaccional opcional (para uso dentro de checkout).
   */
  async crearPagoParaPedido(
    pedidoId: string,
    metodo: MetodoPago,
    datos?: Partial<CrearPagoParams>,
    userId?: string,
    rolActual?: string,
    tx?: PrismaTx
  ): Promise<Pago> {
    const cliente = tx ?? prisma;

    // TARJETA está reservado, no disponible
    if (metodo === "TARJETA") {
      throw new BusinessError(
        "El método de pago TARJETA no está disponible aún. Próximamente.",
        CODIGO_METODO_NO_DISPONIBLE,
        400
      );
    }

    const pedido = await cliente.pedido.findUnique({
      where: { id: pedidoId },
      select: {
        id: true,
        usuarioId: true,
        negocioId: true,
        total: true,
        tipoEntrega: true,
        estadoPago: true,
      },
    });

    if (!pedido) {
      throw new BusinessError("Pedido no encontrado", CODIGO_NO_ENCONTRADO, 404);
    }

    // Validar propiedad si se pasa userId
    if (userId && rolActual !== Rol.ADMIN) {
      if (rolActual === Rol.CLIENTE && pedido.usuarioId !== userId) {
        throw new BusinessError(
          "No tienes permiso para crear pago de este pedido",
          CODIGO_NO_AUTORIZADO,
          403
        );
      }
      if (rolActual === Rol.NEGOCIO) {
        await assertPertenencia(userId, pedido.negocioId, rolActual);
      }
    }

    // Validar que no exista ya un Pago
    const pagoExistente = await cliente.pago.findUnique({
      where: { pedidoId: pedido.id },
      select: { id: true },
    });

    if (pagoExistente) {
      throw new BusinessError(
        "Ya existe un pago para este pedido",
        CODIGO_PAGO_YA_EXISTE,
        409
      );
    }

    // Validar coherencia método ↔ tipoEntrega
    const tipoEntregaStr = pedido.tipoEntrega as "DOMICILIO" | "RECOGIDA_TIENDA";
    this.validarMetodoContraTipoEntrega(metodo, tipoEntregaStr);

    // Determinar estado inicial
     let estadoInicial: EstadoPago = "PENDIENTE";
     const tieneDatosPago =
       datos?.referencia || datos?.comprobanteUrl || datos?.idTransferencia;

     if (
       (metodo === "TRANSFERENCIA_BANCARIA" || metodo === "PAGO_MOVIL") &&
       tieneDatosPago
     ) {
       estadoInicial = "EN_PROCESO";
     }

     if (
       (metodo === "TRANSFERENCIA_BANCARIA" || metodo === "PAGO_MOVIL") &&
       datos?.idTransferencia
     ) {
       this.validarIdTransferencia(datos.idTransferencia, datos.entidadPago ?? undefined);
     }

     const datosCodigoEntrega =
      metodo === "EFECTIVO_CONTRA_ENTREGA" && estadoInicial === "PENDIENTE"
        ? await this.generarDatosCodigoEntrega()
        : null;

    const pago = await cliente.pago.create({
      data: {
        pedidoId: pedido.id,
        metodo,
        estado: estadoInicial,
        monto: datos?.monto ?? pedido.total,
        moneda: datos?.moneda ?? MONEDA_DEFECTO,
        referencia: datos?.referencia ?? null,
        comprobanteUrl: datos?.comprobanteUrl ?? null,
        idTransferencia: datos?.idTransferencia ?? null,
        entidadPago: datos?.entidadPago ?? null,
        fechaTransferencia: datos?.fechaTransferencia ?? null,
        notasCliente: datos?.notasCliente ?? null,
        ...(datosCodigoEntrega?.data ?? {}),
      },
    });

    // Sincronizar estadoPago denormalizado
    await this.syncEstadoPagoPedido(pedido.id, estadoInicial, cliente);

    // Auditoría
    await logAudit(
      "PAGO_CREADO",
      userId ?? null,
      pago.id,
      {
        pedidoId: pedido.id,
        metodo,
        estado: estadoInicial,
        monto: Number(pago.monto),
        moneda: pago.moneda,
        ...(metodo === "EFECTIVO_CONTRA_ENTREGA" ? { codigoGenerado: true } : {}),
      }
    );

    // Cachear código plano para el CLIENTE si se generó
    if (datosCodigoEntrega) {
      await this.cache.set(
        cacheKeys.codigoEntrega.cache(pago.id),
        datosCodigoEntrega.codigoPlano,
        CODIGO_DIAS_EXPIRACION * 24 * 60 * 60
      );
    }

    // Invalidar cachés
    if (userId) {
      await this.cache.del(cacheKeys.pagos.usuario(userId));
    }
    await this.cache.del(cacheKeys.pagos.negocio(pedido.negocioId));

    return pago;
  }

  /**
   * Subir comprobante/referencia del cliente.
   * Solo el dueño del pedido. Solo si estado es PENDIENTE.
   * Pasa a EN_PROCESO.
   */
  async subirComprobante(
    pagoId: string,
    datos: SubirComprobanteParams,
    userId: string
  ): Promise<Pago> {
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        pedido: {
          include: {
            negocio: { select: { id: true } },
            usuario: { select: { id: true } },
          },
        },
      },
    });

    if (!pago) {
      throw new BusinessError("Pago no encontrado", CODIGO_NO_ENCONTRADO, 404);
    }

    // Solo el dueño del pedido puede subir comprobante
    if (pago.pedido.usuarioId !== userId) {
      throw new BusinessError(
        "No tienes permiso para subir comprobante de este pago",
        CODIGO_NO_AUTORIZADO,
        403
      );
    }

    if (pago.estado !== "PENDIENTE") {
      throw new BusinessError(
        "Solo se puede subir comprobante para pagos en estado PENDIENTE",
        CODIGO_ESTADO_INVALIDO,
        409
      );
    }

    this.validarIdTransferencia(datos.idTransferencia ?? undefined, datos.entidadPago ?? undefined);

    try {
      const pagoActualizado = await prisma.pago.update({
        where: { id: pagoId },
        data: {
          referencia: datos.referencia ?? pago.referencia,
          comprobanteUrl: datos.comprobanteUrl ?? pago.comprobanteUrl,
          idTransferencia: datos.idTransferencia ?? pago.idTransferencia,
          entidadPago: datos.entidadPago ?? pago.entidadPago,
          fechaTransferencia: datos.fechaTransferencia ?? pago.fechaTransferencia,
          notasCliente: datos.notasCliente ?? pago.notasCliente,
          estado: "EN_PROCESO",
        },
      });

      await this.syncEstadoPagoPedido(pago.pedidoId, "EN_PROCESO", prisma);

      await logAudit("PAGO_COMPROBANTE_SUBIDO", userId, pagoId, {
        referencia: datos.referencia ?? null,
        comprobanteUrl: datos.comprobanteUrl ?? null,
        idTransferencia: datos.idTransferencia ?? null,
        entidadPago: datos.entidadPago ?? null,
      });

      await this.cache.del(cacheKeys.pagos.usuario(userId));
      await this.cache.del(cacheKeys.pagos.negocio(pago.pedido.negocioId));

      return pagoActualizado;
    } catch (error) {
      this.mapearErrorPrisma(error);
    }
  }

  /**
   * Confirmar un pago como recibido.
   * Solo NEGOCIO dueño del pedido o ADMIN.
   * Estados válidos: PENDIENTE o EN_PROCESO.
   * Pasa a COMPLETADO.
   */
  async confirmarPago(
    pagoId: string,
    userId: string,
    datos?: ConfirmarPagoParams,
    rolActual?: string
  ): Promise<Pago> {
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        pedido: {
          include: {
            negocio: { select: { id: true, nombre: true } },
            usuario: { select: { id: true } },
          },
        },
      },
    });

    if (!pago) {
      throw new BusinessError("Pago no encontrado", CODIGO_NO_ENCONTRADO, 404);
    }

    if (rolActual !== Rol.ADMIN) {
      if (rolActual !== Rol.NEGOCIO) {
        throw new BusinessError(
          "No tienes permiso para confirmar este pago",
          CODIGO_NO_AUTORIZADO,
          403
        );
      }
      await assertPertenencia(userId, pago.pedido.negocioId, rolActual);
    }

    if (pago.estado !== "PENDIENTE" && pago.estado !== "EN_PROCESO") {
      throw new BusinessError(
        `No se puede confirmar un pago en estado ${pago.estado}`,
        CODIGO_ESTADO_INVALIDO,
        409
      );
    }

    const pagoActualizado = await prisma.pago.update({
      where: { id: pagoId },
      data: {
        estado: "COMPLETADO",
        confirmadoPorId: userId,
        confirmadoEn: new Date(),
        notasNegocio: datos?.notasNegocio ?? pago.notasNegocio,
      },
    });

    await this.syncEstadoPagoPedido(pago.pedidoId, "COMPLETADO", prisma);

    await logAudit("PAGO_CONFIRMADO", userId, pagoId, {
      negocioId: pago.pedido.negocioId,
      metodo: pago.metodo,
      monto: Number(pago.monto),
    });

    await this.cache.del(cacheKeys.pagos.usuario(pago.pedido.usuarioId));
    await this.cache.del(cacheKeys.pagos.negocio(pago.pedido.negocioId));

    return pagoActualizado;
  }

  /**
   * Rechazar un pago.
   * Solo NEGOCIO dueño del pedido o ADMIN.
   * Pasa a FALLIDO.
   */
  async rechazarPago(
    pagoId: string,
    userId: string,
    motivo: string,
    rolActual?: string
  ): Promise<Pago> {
    if (!motivo || motivo.trim().length < 3) {
      throw new BusinessError(
        "El motivo de rechazo es obligatorio (mínimo 3 caracteres)",
        CODIGO_VALIDACION,
        400
      );
    }

    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        pedido: {
          include: {
            negocio: { select: { id: true } },
            usuario: { select: { id: true } },
          },
        },
      },
    });

    if (!pago) {
      throw new BusinessError("Pago no encontrado", CODIGO_NO_ENCONTRADO, 404);
    }

    if (rolActual !== Rol.ADMIN) {
      if (rolActual !== Rol.NEGOCIO) {
        throw new BusinessError(
          "No tienes permiso para rechazar este pago",
          CODIGO_NO_AUTORIZADO,
          403
        );
      }
      await assertPertenencia(userId, pago.pedido.negocioId, rolActual);
    }

    if (pago.estado === "COMPLETADO" || pago.estado === "REEMBOLSADO") {
      throw new BusinessError(
        `No se puede rechazar un pago en estado ${pago.estado}`,
        CODIGO_ESTADO_INVALIDO,
        409
      );
    }

    const pagoActualizado = await prisma.pago.update({
      where: { id: pagoId },
      data: {
        estado: "FALLIDO",
        notasNegocio: motivo,
      },
    });

    await this.syncEstadoPagoPedido(pago.pedidoId, "FALLIDO", prisma);

    await logAudit("PAGO_RECHAZADO", userId, pagoId, {
      negocioId: pago.pedido.negocioId,
      motivo,
    });

    await this.cache.del(cacheKeys.pagos.usuario(pago.pedido.usuarioId));
    await this.cache.del(cacheKeys.pagos.negocio(pago.pedido.negocioId));

    return pagoActualizado;
  }

  /**
   * Reembolsar un pago.
   * - Solo ADMIN.
   * - Solo si estado es COMPLETADO.
   * - Pasa a REEMBOLSADO.
   * - Opcionalmente registra idTransferenciaReembolso + fechaReembolso.
   */
  async reembolsarPago(
    pagoId: string,
    userId: string,
    motivo: string,
    datosReembolso?: { idTransferenciaReembolso?: string | null; fechaReembolso?: Date | null }
  ): Promise<Pago> {
    if (!motivo || motivo.trim().length < 3) {
      throw new BusinessError(
        "El motivo del reembolso es obligatorio (mínimo 3 caracteres)",
        CODIGO_VALIDACION,
        400
      );
    }

    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        pedido: {
          include: {
            negocio: { select: { id: true } },
            usuario: { select: { id: true } },
          },
        },
      },
    });

    if (!pago) {
      throw new BusinessError("Pago no encontrado", CODIGO_NO_ENCONTRADO, 404);
    }

    if (pago.estado !== "COMPLETADO") {
      throw new BusinessError(
        `No se puede reembolsar un pago en estado ${pago.estado}. Solo se pueden reembolsar pagos COMPLETADOS.`,
        CODIGO_ESTADO_INVALIDO,
        409
      );
    }

    try {
      const pagoActualizado = await prisma.pago.update({
        where: { id: pagoId },
        data: {
          estado: "REEMBOLSADO",
          idTransferenciaReembolso: datosReembolso?.idTransferenciaReembolso ?? pago.idTransferenciaReembolso,
          fechaReembolso: datosReembolso?.fechaReembolso ?? pago.fechaReembolso,
          notasNegocio: `${pago.notasNegocio ?? ""}\n[REEMBOLSADO] ${motivo}`.trim(),
        },
      });

      await this.syncEstadoPagoPedido(pago.pedidoId, "REEMBOLSADO", prisma);

      await logAudit("PAGO_REEMBOLSADO", userId, pagoId, {
        negocioId: pago.pedido.negocioId,
        motivo,
        monto: Number(pago.monto),
        idTransferenciaReembolso: datosReembolso?.idTransferenciaReembolso ?? null,
      });

      await this.cache.del(cacheKeys.pagos.usuario(pago.pedido.usuarioId));
      await this.cache.del(cacheKeys.pagos.negocio(pago.pedido.negocioId));

      return pagoActualizado;
    } catch (error) {
      this.mapearErrorPrisma(error);
    }
  }

  /**
   * Cancelar un pago.
   * Solo el dueño del pedido o ADMIN.
   * Solo si estado es PENDIENTE.
   * Pasa a CANCELADO.
   */
  async cancelarPago(
    pagoId: string,
    userId: string,
    rolActual?: string
  ): Promise<Pago> {
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        pedido: {
          include: {
            negocio: { select: { id: true } },
            usuario: { select: { id: true } },
          },
        },
      },
    });

    if (!pago) {
      throw new BusinessError("Pago no encontrado", CODIGO_NO_ENCONTRADO, 404);
    }

    // Dueño del pedido o ADMIN
    if (rolActual !== Rol.ADMIN) {
      if (pago.pedido.usuarioId !== userId) {
        throw new BusinessError(
          "No tienes permiso para cancelar este pago",
          CODIGO_NO_AUTORIZADO,
          403
        );
      }
    }

    if (pago.estado !== "PENDIENTE") {
      throw new BusinessError(
        `No se puede cancelar un pago en estado ${pago.estado}. Solo se pueden cancelar pagos PENDIENTES.`,
        CODIGO_ESTADO_INVALIDO,
        409
      );
    }

    const pagoActualizado = await prisma.pago.update({
      where: { id: pagoId },
      data: { estado: "CANCELADO" },
    });

    await this.syncEstadoPagoPedido(pago.pedidoId, "CANCELADO", prisma);

    await logAudit("PAGO_CANCELADO", userId, pagoId, {
      negocioId: pago.pedido.negocioId,
    });

    await this.cache.del(cacheKeys.pagos.usuario(pago.pedido.usuarioId));
    await this.cache.del(cacheKeys.pagos.negocio(pago.pedido.negocioId));

    return pagoActualizado;
  }

  // ---------------------------------------------------------------------------
  // Código de confirmación para EFECTIVO_CONTRA_ENTREGA
  // ---------------------------------------------------------------------------

  /**
   * Genera un código de entrega de 6 dígitos para un pago EFECTIVO_CONTRA_ENTREGA.
   * - El código se hashea con bcrypt antes de almacenarse.
   * - El código plano se cachea en memoria (TTL configurado) para devolverlo al CLIENTE.
   * - El NEGOCIO/ADMIN nunca ven el código plano; solo pueden validarlo.
   */
  async generarCodigoEntrega(pagoId: string, userId: string, rolActual?: string): Promise<string> {
    const pago = await this.assertAccesoPago(pagoId, userId, rolActual);

    if (pago.metodo !== "EFECTIVO_CONTRA_ENTREGA") {
      throw new BusinessError(
        "El código de entrega solo aplica a pagos EFECTIVO_CONTRA_ENTREGA",
        CODIGO_ERROR_METODO_INCORRECTO,
        400
      );
    }

    const { codigoPlano, codigoHash } = await this.generarCodigoYHash();
    const ahora = new Date();
    const expiraEn = new Date(ahora.getTime() + CODIGO_DIAS_EXPIRACION * 24 * 60 * 60 * 1000);

    await prisma.pago.update({
      where: { id: pagoId },
      data: {
        codigoEntregaHash: codigoHash,
        codigoEntregaExpira: expiraEn,
        codigoEntregaRegeneraciones: 0,
        codigoEntregaIntentos: 0,
        codigoEntregaBloqueado: false,
      },
    });

    // Cachear código plano para devolverlo al CLIENTE
    const cacheKey = cacheKeys.codigoEntrega.cache(pagoId);
    await this.cache.set(cacheKey, codigoPlano, CODIGO_DIAS_EXPIRACION * 24 * 60 * 60);

    await logAudit("CODIGO_ENTREGA_GENERADO", userId, pagoId, {
      metodo: pago.metodo,
    });

    await this.cache.del(cacheKeys.pagos.pedido(pago.pedidoId));
    await this.cache.del(cacheKeys.pagos.usuario(pago.pedido.usuarioId));

    return codigoPlano;
  }

  /**
   * Regenera un código de entrega.
   * - Límite de 3 regeneraciones.
   * - Solo el CLIENTE dueño del pedido puede regenerar.
   */
  async regenerarCodigoEntrega(pagoId: string, userId: string, motivo: string, rolActual?: string): Promise<string> {
    if (!motivo || motivo.trim().length < CODIGO_MOTIVO_MIN_CARACTERES) {
      throw new BusinessError(
        `El motivo es obligatorio (mínimo ${CODIGO_MOTIVO_MIN_CARACTERES} caracteres)`,
        CODIGO_ERROR_MOTIVO_REQUERIDO,
        400
      );
    }

    const pago = await this.assertAccesoPago(pagoId, userId, rolActual);

    if (pago.metodo !== "EFECTIVO_CONTRA_ENTREGA") {
      throw new BusinessError(
        "El código de entrega solo aplica a pagos EFECTIVO_CONTRA_ENTREGA",
        CODIGO_ERROR_METODO_INCORRECTO,
        400
      );
    }

    const regeneraciones = pago.codigoEntregaRegeneraciones ?? 0;
    if (regeneraciones >= CODIGO_REGENERACIONES_MAXIMAS) {
      throw new BusinessError(
        `Se alcanzó el límite máximo de ${CODIGO_REGENERACIONES_MAXIMAS} regeneraciones`,
        CODIGO_ERROR_LIMITE_REGENERACIONES,
        429
      );
    }

    const { codigoPlano, codigoHash } = await this.generarCodigoYHash();
    const ahora = new Date();
    const expiraEn = new Date(ahora.getTime() + CODIGO_DIAS_EXPIRACION * 24 * 60 * 60);

    await prisma.pago.update({
      where: { id: pagoId },
      data: {
        codigoEntregaHash: codigoHash,
        codigoEntregaExpira: expiraEn,
        codigoEntregaRegeneraciones: regeneraciones + 1,
        codigoEntregaIntentos: 0,
        codigoEntregaBloqueado: false,
      },
    });

    await this.cache.del(cacheKeys.codigoEntrega.cache(pagoId));
    await this.cache.del(cacheKeys.codigoEntrega.intentos(pagoId));
    await this.cache.set(cacheKeys.codigoEntrega.cache(pagoId), codigoPlano, CODIGO_DIAS_EXPIRACION * 24 * 60 * 60);

    await logAudit("CODIGO_ENTREGA_REGENERADO", userId, pagoId, {
      regeneraciones: regeneraciones + 1,
      motivo,
    });

    await this.cache.del(cacheKeys.pagos.pedido(pago.pedidoId));
    await this.cache.del(cacheKeys.pagos.usuario(pago.pedido.usuarioId));

    return codigoPlano;
  }

  /**
   * Valida un código de entrega introducido por el NEGOCIO.
   * - Verifica hash, expiración, bloqueos por intentos fallidos.
   * - No devuelve el código plano. Solo confirma/invalida.
   */
  async validarCodigoEntrega(
    pagoId: string,
    codigoPlano: string,
    userId: string,
    rolActual?: string
  ): Promise<boolean> {
    const pago = await this.assertAccesoPago(pagoId, userId, rolActual);

    if (pago.metodo !== "EFECTIVO_CONTRA_ENTREGA") {
      throw new BusinessError(
        "El código de entrega solo aplica a pagos EFECTIVO_CONTRA_ENTREGA",
        CODIGO_ERROR_METODO_INCORRECTO,
        400
      );
    }

    if (!pago.codigoEntregaHash) {
      throw new BusinessError(
        "No se ha generado un código de entrega para este pago",
        CODIGO_NO_ENCONTRADO,
        404
      );
    }

    // Verificar bloqueo por intentos
    if (pago.codigoEntregaBloqueado) {
      throw new BusinessError(
        "Código bloqueado por demasiados intentos fallidos",
        CODIGO_ERROR_BLOQUEADO,
        423
      );
    }

    // Verificar expiración
    if (pago.codigoEntregaExpira && pago.codigoEntregaExpira < new Date()) {
      throw new BusinessError(
        "El código de entrega ha expirado",
        CODIGO_ERROR_EXPIRADO,
        410
      );
    }

    // Validar hash
    const isValido = await bcrypt.compare(codigoPlano, pago.codigoEntregaHash);

    if (!isValido) {
       // Incrementar intentos fallidos
      const intentos = (pago.codigoEntregaIntentos ?? 0) + 1;
      let bloqueado = false;

      if (intentos >= CODIGO_INTENTOS_MAXIMOS) {
        bloqueado = true;
      }

      await prisma.pago.update({
        where: { id: pagoId },
        data: {
          codigoEntregaIntentos: intentos,
          codigoEntregaBloqueado: bloqueado,
        },
      });

      throw new BusinessError(
        `Código incorrecto. Intento ${intentos} de ${CODIGO_INTENTOS_MAXIMOS}`,
        CODIGO_ERROR_INCORRECTO,
        400
      );
    }

     // Código válido: resetear intentos
    await prisma.pago.update({
      where: { id: pagoId },
      data: {
        codigoEntregaIntentos: 0,
        codigoEntregaBloqueado: false,
      },
    });

    await logAudit("CODIGO_ENTREGA_VALIDADO", userId, pagoId, {
      exitoso: true,
    });

    return true;
  }

  /**
   * Confirma un pago EFECTIVO_CONTRA_ENTREGA introduciendo el código correcto.
   * Solo NEGOCIO dueño del pedido o ADMIN.
   * Pasa el pago a COMPLETADO y consume el código.
   */
  async confirmarConCodigoEntrega(
    pagoId: string,
    codigoPlano: string,
    userId: string,
    rolActual?: string,
    notasNegocio?: string
  ): Promise<Pago> {
    // Validar código primero
    await this.validarCodigoEntrega(pagoId, codigoPlano, userId, rolActual);

    // Obtener pago de nuevo para confirmar (ya que validarCodigoEntrega lo actualizó)
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        pedido: {
          include: {
            negocio: { select: { id: true, nombre: true } },
            usuario: { select: { id: true } },
          },
        },
      },
    });

    if (!pago) {
      throw new BusinessError("Pago no encontrado", CODIGO_NO_ENCONTRADO, 404);
    }

    if (rolActual !== Rol.ADMIN) {
      if (rolActual !== Rol.NEGOCIO) {
        throw new BusinessError("No tienes permiso para confirmar este pago", CODIGO_NO_AUTORIZADO, 403);
      }
      await assertPertenencia(userId, pago.pedido.negocioId, rolActual);
    }

    if (pago.estado !== "PENDIENTE" && pago.estado !== "EN_PROCESO") {
      throw new BusinessError(
        `No se puede confirmar un pago en estado ${pago.estado}`,
        CODIGO_ESTADO_INVALIDO,
        409
      );
    }

    const pagoActualizado = await prisma.pago.update({
      where: { id: pagoId },
      data: {
        estado: "COMPLETADO",
        confirmadoPorId: userId,
        confirmadoEn: new Date(),
        notasNegocio: notasNegocio ?? pago.notasNegocio,
        codigoEntregaUsadoEn: new Date(),
      },
    });

    await this.syncEstadoPagoPedido(pago.pedidoId, "COMPLETADO", prisma);

    await logAudit("PAGO_CONFIRMADO_CON_CODIGO", userId, pagoId, {
      negocioId: pago.pedido.negocioId,
      metodo: pago.metodo,
      monto: Number(pago.monto),
    });

    await this.cache.del(cacheKeys.codigoEntrega.cache(pagoId));
    await this.cache.del(cacheKeys.pagos.usuario(pago.pedido.usuarioId));
    await this.cache.del(cacheKeys.pagos.negocio(pago.pedido.negocioId));

    return pagoActualizado;
  }

  /**
   * Obtiene el código de entrega en texto plano desde la caché.
   * SOLO para el CLIENTE dueño del pedido.
   * El NEGOCIO y ADMIN nunca ven el código plano.
   */
  async getCodigoEntregaCache(pagoId: string, userId: string, rolActual?: string): Promise<string | null> {
    const pago = await this.assertAccesoPago(pagoId, userId, rolActual);

    if (pago.pedido.usuarioId !== userId) {
      throw new BusinessError(
        "Solo el cliente dueño del pedido puede ver su código de entrega",
        CODIGO_NO_AUTORIZADO,
        403
      );
    }

    if (pago.metodo !== "EFECTIVO_CONTRA_ENTREGA") {
      throw new BusinessError(
        "El código de entrega solo aplica a pagos EFECTIVO_CONTRA_ENTREGA",
        CODIGO_ERROR_METODO_INCORRECTO,
        400
      );
    }

    if (!pago.codigoEntregaHash) {
      return null;
    }

    const cacheKey = cacheKeys.codigoEntrega.cache(pagoId);
    const codigo = await this.cache.get<string>(cacheKey);

    return codigo ?? null;
  }

  /**
   * Genera los datos de código de entrega (hash + fechas) para usar al crear un Pago.
   */
  private async generarDatosCodigoEntrega(): Promise<{
    data: {
      codigoEntregaHash: string;
      codigoEntregaExpira: Date;
      codigoEntregaRegeneraciones: number;
      codigoEntregaIntentos: number;
      codigoEntregaBloqueado: boolean;
    };
    codigoPlano: string;
  }> {
    const { codigoPlano, codigoHash } = await this.generarCodigoYHash();
    const ahora = new Date();
    const expiraEn = new Date(ahora.getTime() + CODIGO_DIAS_EXPIRACION * 24 * 60 * 60 * 1000);

    return {
      data: {
        codigoEntregaHash: codigoHash,
        codigoEntregaExpira: expiraEn,
        codigoEntregaRegeneraciones: 0,
        codigoEntregaIntentos: 0,
        codigoEntregaBloqueado: false,
      },
      codigoPlano,
    };
  }

  /**
   * Genera un código de 6 dígitos y su hash bcrypt.
   */
  private async generarCodigoYHash(): Promise<{ codigoPlano: string; codigoHash: string }> {
    const codigoPlano = crypto
      .getRandomValues(new Uint32Array(1))[0]
      .toString()
      .slice(-CODIGO_LONGITUD)
      .padStart(CODIGO_LONGITUD, "0");

    const codigoHash = await bcrypt.hash(codigoPlano, 12);
    return { codigoPlano, codigoHash };
  }

  /**
   */
  async getPagoDePedido(
    pedidoId: string,
    userId: string,
    rolActual?: string
  ): Promise<PagoConRelations | null> {
    const pago = await prisma.pago.findUnique({
      where: { pedidoId },
      include: {
        pedido: {
          include: {
            negocio: { select: { id: true, nombre: true, direccion: true } },
            usuario: { select: { id: true, email: true, nombre: true } },
          },
        },
        factura: { select: { id: true, numero: true } },
      },
    });

    if (!pago) {
      return null;
    }

    await this.assertAccesoPago(pago.id, userId, rolActual);
    return pago as unknown as PagoConRelations;
  }

  /**
   * Obtener un pago por ID directo (valida propiedad).
   */
  async getPago(
    pagoId: string,
    userId: string,
    rolActual?: string
  ): Promise<PagoConRelations> {
    await this.assertAccesoPago(pagoId, userId, rolActual);

    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        pedido: {
          include: {
            negocio: { select: { id: true, nombre: true, direccion: true } },
            usuario: { select: { id: true, email: true, nombre: true } },
          },
        },
        factura: { select: { id: true, numero: true } },
      },
    });

    if (!pago) {
      throw new BusinessError("Pago no encontrado", CODIGO_NO_ENCONTRADO, 404);
    }

    return pago as unknown as PagoConRelations;
  }

  /**
   * Listar pagos de un negocio (dueño o ADMIN).
   */
  async listPagosDeNegocio(
    negocioId: string,
    userId: string,
    filtros?: ListPagosFiltros,
    rolActual?: string
  ): Promise<{ data: PagoConRelations[]; total: number; pagination: { page: number; limit: number; totalPages: number } }> {
    await assertPertenencia(userId, negocioId, rolActual);

    const page = filtros?.page ?? 1;
    const limit = filtros?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = this.buildWhereListar(filtros);
    where.pedido = { negocioId };

    const [pagos, total] = await Promise.all([
      prisma.pago.findMany({
        where,
        include: {
          pedido: {
            include: {
              negocio: { select: { id: true, nombre: true, direccion: true } },
              usuario: { select: { id: true, email: true, nombre: true } },
            },
          },
          factura: { select: { id: true, numero: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.pago.count({ where }),
    ]);

    return {
      data: pagos as unknown as PagoConRelations[],
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Listar pagos de un usuario (CLIENTE).
   */
  async listPagosDeUsuario(
    userId: string,
    filtros?: ListPagosFiltros,
    rolActual?: string
  ): Promise<{ data: PagoConRelations[]; total: number; pagination: { page: number; limit: number; totalPages: number } }> {
    const page = filtros?.page ?? 1;
    const limit = filtros?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = this.buildWhereListar(filtros);
    where.pedido = { usuarioId: userId };

    const [pagos, total] = await Promise.all([
      prisma.pago.findMany({
        where,
        include: {
          pedido: {
            include: {
              negocio: { select: { id: true, nombre: true, direccion: true } },
              usuario: { select: { id: true, email: true, nombre: true } },
            },
          },
          factura: { select: { id: true, numero: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.pago.count({ where }),
    ]);

    return {
      data: pagos as unknown as PagoConRelations[],
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * KPIs de pagos para ADMIN.
   */
  async getResumenPagos(
    desde?: Date,
    hasta?: Date
  ): Promise<ResumenPagosDTO> {
     const where: Prisma.PagoWhereInput = {};
     if (desde || hasta) {
       where.createdAt = {};
       if (desde) where.createdAt.gte = desde;
       if (hasta) where.createdAt.lte = hasta;
     }

    const [pagos, total] = await Promise.all([
      prisma.pago.findMany({
        where,
        select: { estado: true, metodo: true, monto: true },
      }),
      prisma.pago.count({ where }),
    ]);

    let totalCobrado = 0;
    let totalPendiente = 0;
    let totalReembolsado = 0;
    let totalFallido = 0;
    const porMetodo: Record<string, { completado: number; pendiente: number; total: number }> = {};
    const porEstado: Record<string, number> = {};

    for (const p of pagos) {
      const monto = Number(p.monto);
      porEstado[p.estado] = (porEstado[p.estado] ?? 0) + 1;

      if (!porMetodo[p.metodo]) {
        porMetodo[p.metodo] = { completado: 0, pendiente: 0, total: 0 };
      }
      porMetodo[p.metodo].total += monto;

      switch (p.estado) {
        case "COMPLETADO":
          totalCobrado += monto;
          porMetodo[p.metodo].completado += monto;
          break;
        case "PENDIENTE":
        case "EN_PROCESO":
          totalPendiente += monto;
          porMetodo[p.metodo].pendiente += monto;
          break;
        case "REEMBOLSADO":
          totalReembolsado += monto;
          break;
        case "FALLIDO":
          totalFallido += monto;
          break;
        case "CANCELADO":
          break;
      }
    }

    return {
      totalCobrado: Number(totalCobrado.toFixed(2)),
      totalPendiente: Number(totalPendiente.toFixed(2)),
      totalReembolsado: Number(totalReembolsado.toFixed(2)),
      totalFallido: Number(totalFallido.toFixed(2)),
      porMetodo,
      porEstado,
      cantidadTotal: total,
    };
  }

  /**
   * Vincular un Pago a una Factura recién emitida.
   */
  async vincularFactura(pagoId: string, facturaId: string): Promise<Pago> {
    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      select: { id: true, pedidoId: true, facturaId: true },
    });

    if (!pago) {
      throw new BusinessError("Pago no encontrado", CODIGO_NO_ENCONTRADO, 404);
    }

    if (pago.facturaId && pago.facturaId !== facturaId) {
      throw new BusinessError(
        "El pago ya está vinculado a otra factura",
        CODIGO_CONFLICTO,
        409
      );
    }

    if (pago.facturaId === facturaId) {
      return prisma.pago.findUniqueOrThrow({ where: { id: pagoId } });
    }

    try {
      return await prisma.pago.update({
        where: { id: pagoId },
        data: { facturaId },
      });
    } catch (error) {
      this.mapearErrorPrisma(error);
    }
  }

  /**
   * Buscar un pago por su ID de transferencia (conciliación).
   * Fase 1, Punto 5.
   */
  async buscarPagoPorIdTransferencia(
    idTransferencia: string,
    userId?: string,
    rolActual?: string
  ): Promise<PagoConRelations | null> {
    const pago = await prisma.pago.findUnique({
      where: { idTransferencia },
      include: {
        pedido: {
          include: {
            negocio: { select: { id: true, nombre: true, direccion: true } },
            usuario: { select: { id: true, email: true, nombre: true } },
          },
        },
        factura: { select: { id: true, numero: true } },
      },
    });

    if (!pago) {
      return null;
    }

    if (userId && rolActual) {
      await this.assertAccesoPago(pago.id, userId, rolActual);
    }

    return pago as unknown as PagoConRelations;
  }

  /**
   * Verifica si un ID de transferencia ya está en uso.
   * Útil para validación en frontend antes de submit.
   */
  async existeIdTransferencia(idTransferencia: string): Promise<boolean> {
    const existe = await prisma.pago.findUnique({
      where: { idTransferencia },
      select: { id: true },
    });
    return !!existe;
  }

  private buildWhereListar(filtros?: ListPagosFiltros): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (filtros?.estado && filtros.estado.length > 0) {
      where.estado = { in: filtros.estado };
    }

    if (filtros?.metodo && filtros.metodo.length > 0) {
      where.metodo = { in: filtros.metodo };
    }

    if (filtros?.entidadPago && filtros.entidadPago.length > 0) {
      where.entidadPago = { in: filtros.entidadPago };
    }

    if (filtros?.idTransferencia) {
      where.idTransferencia = { equals: filtros.idTransferencia };
    }

    if (filtros?.desde || filtros?.hasta) {
      where.createdAt = {
        gte: filtros.desde ?? undefined,
        lte: filtros.hasta ?? undefined,
      };
    }

    return where;
  }
}

export default PagoService;