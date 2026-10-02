"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Plus, Edit, Trash2, Pause, Play } from "lucide-react";
import type { PromocionDTO } from "@/shared/descuentos.types";

interface PromocionesPanelProps {
  promociones: PromocionDTO[];
}

const TIPOS_ETIQUETA = {
  PORCENTAJE: "Porcentaje",
  MONTO_FIJO: "Monto fijo",
  DOS_POR_UNO: "2x1",
  ENVIO_GRATIS: "Envío gratis",
} as Record<string, string>;

export default function PromocionesPanel({ promociones = [] }: PromocionesPanelProps) {
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
    if (estado === "ACTIVA") return "success";
    if (estado === "PAUSADA") return "warning";
    if (estado === "EXPIRADA" || estado === "AGOTADA") return "error";
    return "default";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Promociones</h2>
        <Button onClick={handleNuevo} size="sm" icon={<Plus className="h-4 w-4" />} iconPosition="left">
          Nueva promoción
        </Button>
      </div>

      {promociones.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No hay promociones creadas para este negocio.</p>
      ) : (
        <div className="space-y-3">
          {promociones.map((p) => (
            <Card
              key={p.id}
              title={p.nombre}
              description={p.descripcion ?? undefined}
              badge={{ text: p.estado, variant: badgeVariant(p.estado) }}
              footer={
                <div className="flex justify-between items-center">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{TIPOS_ETIQUETA[p.tipo] ?? p.tipo}</span>
                    <span>Valor: {p.valor != null ? Number(p.valor) : "N/A"}</span>
                    <span>Usos: {p.usosActuales}{p.usosMaximos != null ? ` / ${p.usosMaximos}` : ""}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" icon={<Edit className="h-4 w-4" />} onClick={() => handleEditar(p.id)} aria-label="Editar"> </Button>
                    <Button size="sm" variant="outline" icon={<Trash2 className="h-4 w-4" />} aria-label="Eliminar"> </Button>
                    {p.estado === "ACTIVA" ? (
                      <Button size="sm" variant="outline" icon={<Pause className="h-4 w-4" />} aria-label="Pausar"> </Button>
                    ) : (
                      <Button size="sm" variant="outline" icon={<Play className="h-4 w-4" />} aria-label="Reactivar"> </Button>
                    )}
                  </div>
                </div>
              }
            />
          ))}
        </div>
      )}

      {showForm && (
        <Card
          title={editingId ? "Editar promoción" : "Nueva promoción"}
          footer={<Button onClick={() => setShowForm(false)}>Cerrar</Button>}
        >
          <p className="text-sm text-muted-foreground">Formulario de promoción en construcción</p>
        </Card>
      )}
    </div>
  );
}
