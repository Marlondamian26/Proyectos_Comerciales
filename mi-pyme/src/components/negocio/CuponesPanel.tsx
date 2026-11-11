"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { CuponDTO } from "@/shared/descuentos.types";

interface CuponesPanelProps {
  cupones: CuponDTO[];
}

const TIPOS_ETIQUETA = {
  PORCENTAJE: "Porcentaje",
  MONTO_FIJO: "Monto fijo",
  DOS_POR_UNO: "2x1",
  ENVIO_GRATIS: "Envío gratis",
} as Record<string, string>;

export default function CuponesPanel({ cupones = [] }: CuponesPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleNuevo = () => {
    setShowForm(true);
    setEditingId(null);
  };

  const handleEditar = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const badgeVariant = (estado: string): "success" | "warning" | "default" | "error" => {
    if (estado === "ACTIVO") return "success";
    if (estado === "PAUSADO") return "warning";
    if (estado === "EXPIRADO" || estado === "AGOTADO") return "error";
    return "default";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Cupones</h2>
        <Button onClick={handleNuevo} size="sm" icon={<Plus className="h-4 w-4" />} iconPosition="left">
          Nuevo cupón
        </Button>
      </div>

      {cupones.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No hay cupones creados para este negocio.</p>
      ) : (
        <div className="space-y-3">
          {cupones.map((c) => (
            <Card
              key={c.id}
              title={c.codigo}
              description={c.descripcion ?? "Sin descripción"}
              badge={{ text: c.estado, variant: badgeVariant(c.estado) }}
              footer={
                <div className="flex justify-between items-center">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{TIPOS_ETIQUETA[c.tipo] ?? c.tipo}</span>
                    <span>Valor: {c.valor != null ? Number(c.valor) : "N/A"}</span>
                    <span>Usos: {c.usosActuales}{c.usosMaximos != null ? ` / ${c.usosMaximos}` : ""}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" icon={<Edit className="h-4 w-4" />} onClick={() => handleEditar(c.id)} aria-label="Editar"> </Button>
                    <Button size="sm" variant="outline" icon={<Trash2 className="h-4 w-4" />} aria-label="Eliminar"> </Button>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      )}

      {showForm && (
        <Card
          title={editingId ? "Editar cupón" : "Nuevo cupón"}
          footer={<Button onClick={() => setShowForm(false)}>Cerrar</Button>}
        >
          <p className="text-sm text-muted-foreground">Formulario de cupón en construcción</p>
        </Card>
      )}
    </div>
  );
}
