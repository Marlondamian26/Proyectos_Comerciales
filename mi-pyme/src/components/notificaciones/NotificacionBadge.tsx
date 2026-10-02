"use client";

import { cn } from "@/lib/utils";
import type { TipoNotificacion } from "@/generated/prisma/client";
import { CATEGORIA_NOTIFICACION } from "@/shared/notificaciones.types";
import {
  Package,
  Calendar,
  CreditCard,
  Tag,
  Percent,
  Bell,
  User,
  Shield,
  AlertCircle,
  Truck,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

interface NotificacionBadgeProps {
  tipo: TipoNotificacion;
  className?: string;
  size?: "sm" | "md";
}

const ICONO_POR_TIPO: Record<TipoNotificacion, ComponentType<SVGProps<SVGSVGElement>>> = {
  PEDIDO_CREADO: Package,
  PEDIDO_ESTADO_CAMBIADO: Package,
  PEDIDO_ASIGNADO_LOGISTICA: Truck,
  RESERVA_CREADA: Calendar,
  RESERVA_CANCELADA: Calendar,
  PAGO_COMPROBANTE_SUBIDO: CreditCard,
  PAGO_CONFIRMADO: CreditCard,
  PAGO_RECHAZADO: CreditCard,
  PAGO_REEMBOLSADO: CreditCard,
  CODIGO_ENTREGA_REGENERADO: CreditCard,
  SOLICITUD_ALTA_CREADA: Shield,
  SOLICITUD_ALTA_APROBADA: Shield,
  SOLICITUD_ALTA_RECHAZADA: Shield,
  DISPONIBILIDAD_AGOTADA: AlertCircle,
  STOCK_BAJO: AlertCircle,
  TRANSPORTE_CONTRATADO: Truck,
  CUPON_PROXIMO_A_EXPIRAR: Tag,
  PROMOCION_AGOTADA: Percent,
  BIENVENIDA: User,
  PASSWORD_CAMBIADO: Shield,
  LOGIN_NUEVO_DISPOSITIVO: User,
};

const COLOR_POR_CATEGORIA: Record<string, string> = {
  pedidos: "text-blue-500",
  reservas: "text-purple-500",
  pagos: "text-green-500",
  cuenta: "text-orange-500",
  sistema: "text-gray-500",
};

export function NotificacionBadge({ tipo, className, size = "md" }: NotificacionBadgeProps) {
  const Icono = ICONO_POR_TIPO[tipo] ?? Bell;
  const categoria = CATEGORIA_NOTIFICACION[tipo] ?? "sistema";
  const colorClase = COLOR_POR_CATEGORIA[categoria] ?? "text-gray-500";
  const sizeClase = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-md", className)}
      aria-hidden="true"
    >
      <Icono className={cn(sizeClase, colorClase)} />
    </span>
  );
}

NotificacionBadge.displayName = "NotificacionBadge";
