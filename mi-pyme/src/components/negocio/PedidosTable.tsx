"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarEstadoPedidoAction } from "@/lib/actions";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { EstadoPagoBadge } from "@/components/pagos/EstadoPagoBadge";
import { Package } from "lucide-react";

export interface PedidoItem {
  id: string;
  producto?: { nombre: string; precio?: number } | null;
  servicio?: { nombre: string; precio?: number } | null;
  cantidad: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  estado: string;
  estadoPago?: string | null;
  total: number;
  tipoEntrega?: "DOMICILIO" | "RECOGIDA_TIENDA" | null;
  costoEnvio?: number | null;
  direccionEntrega?: string | null;
  fechaCreacion: Date;
  usuario?: { email: string; nombre: string | null };
  items: PedidoItem[];
  [key: string]: unknown;
}

export interface PedidosTableProps {
  negocioId: string;
  pedidos: Pedido[];
}

const estados = [
  { value: "pendiente", label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  { value: "confirmado", label: "Confirmado", color: "bg-blue-100 text-blue-800" },
  { value: "preparando", label: "Preparando", color: "bg-purple-100 text-purple-800" },
  { value: "enviado", label: "Enviado", color: "bg-indigo-100 text-indigo-800" },
  { value: "entregado", label: "Entregado", color: "bg-green-100 text-green-800" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-800" },
];

export default function PedidosTable({ negocioId, pedidos: pedidosIniciales }: PedidosTableProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciales);
  const router = useRouter();
  const { success, error: errorToast } = useToast();

  const handleEstadoChange = async (pedidoId: string, nuevoEstado: string) => {
    try {
      await actualizarEstadoPedidoAction(negocioId, pedidoId, nuevoEstado);
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
      );
      success("Estado actualizado");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar";
      errorToast(msg);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const e = estados.find((x) => x.value === estado) ?? estados[0];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${e.color}`}>
        {e.label}
      </span>
    );
  };

  if (pedidos.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No tienes pedidos todavía.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Pedido</th>
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Cliente</th>
             <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Tipo Entrega</th>
             <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Envío</th>
             <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Productos</th>
             <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Total</th>
              <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Estado</th>
              <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Pago</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {pedidos.map((pedido) => (
            <tr key={pedido.id} className="hover:bg-muted/30">
              <td className="py-3.5 px-4 font-medium">
                #{pedido.id.slice(0, 8)}
                <span className="block text-xs text-muted-foreground mt-1">
                  {new Date(pedido.fechaCreacion).toLocaleDateString("es-AR")}
                </span>
              </td>
               <td className="py-3.5 px-4">{pedido.usuario?.nombre ?? pedido.usuario?.email ?? "—"}</td>
               <td className="py-3.5 px-4 text-sm">
                 {pedido.tipoEntrega === "DOMICILIO"
                   ? "Domicilio"
                   : pedido.tipoEntrega === "RECOGIDA_TIENDA"
                   ? "Recogida en tienda"
                   : "—"}
               </td>
               <td className="py-3.5 px-4 text-sm">
                 ${Number(pedido.costoEnvio ?? 0).toFixed(2)}
               </td>
               <td className="py-3.5 px-4">
                 <ul className="space-y-0.5 text-xs">
                     {pedido.items.map((item: PedidoItem) => (
                     <li key={item.id}>
                       {item.producto?.nombre ?? item.servicio?.nombre ?? "Producto"}{" "}
                       × {item.cantidad}
                     </li>
                   ))}
                 </ul>
               </td>
              <td className="py-3.5 px-4 text-right font-semibold">${Number(pedido.total).toFixed(2)}</td>
               <td className="py-3.5 px-4 text-center">
                 {getEstadoBadge(pedido.estado)}
                 <div className="mt-2">
                   <Select
                     value={pedido.estado}
                     onChange={(e) => handleEstadoChange(pedido.id, e.target.value)}
                     options={estados.map((e) => ({ value: e.value, label: e.label }))}
                   />
                 </div>
               </td>
               <td className="py-3.5 px-4 text-center">
                 {pedido.estadoPago ? (
                   <div className="flex flex-col items-center gap-1">
                     <EstadoPagoBadge estado={pedido.estadoPago as "PENDIENTE" | "EN_PROCESO" | "COMPLETADO" | "FALLIDO" | "REEMBOLSADO" | "CANCELADO"} size="sm" />
                   </div>
                 ) : (
                   <span className="text-xs text-muted-foreground">Sin pago</span>
                 )}
               </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
