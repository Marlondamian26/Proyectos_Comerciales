"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { ComboDTO } from "@/shared/descuentos.types";

interface CombosPanelProps {
  combos: ComboDTO[];
}

export default function CombosPanel({ combos = [] }: CombosPanelProps) {
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Combos</h2>
        <Button onClick={handleNuevo} size="sm" icon={<Plus className="h-4 w-4" />} iconPosition="left">
          Nuevo combo
        </Button>
      </div>

      {combos.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No hay combos creados para este negocio.</p>
      ) : (
        <div className="space-y-3">
          {combos.map((c) => (
            <Card
              key={c.id}
              title={c.nombre}
              description={c.descripcion ?? "Sin descripción"}
              badge={{
                text: c.activo ? "Activo" : "Inactivo",
                variant: c.activo ? "success" : "default",
              }}
              footer={
                <div className="flex justify-between items-center">
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Precio: {Number(c.precio).toFixed(2)}</span>
                    <span>Items: {c.items.length}</span>
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
          title={editingId ? "Editar combo" : "Nuevo combo"}
          footer={<Button onClick={() => setShowForm(false)}>Cerrar</Button>}
        >
          <p className="text-sm text-muted-foreground">Formulario de combo en construcción</p>
        </Card>
      )}
    </div>
  );
}
