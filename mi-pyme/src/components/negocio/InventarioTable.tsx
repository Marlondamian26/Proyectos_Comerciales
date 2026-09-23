"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { actualizarInventarioAction } from "@/lib/actions";
import type { Inventario } from "@/generated/prisma/client";

interface Props {
  negocioId: string;
  inventario: Array<Inventario & { producto: { id: string; nombre: string } }>;
}

export default function InventarioTable({ negocioId, inventario }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localData, setLocalData] = useState(inventario);
  const [loading, setLoading] = useState(false);
  const { success, error: errorToast } = useToast();

  const startEdit = (item: Inventario & { producto: { id: string; nombre: string } }) => {
    setEditingId(item.productoId);
  };

  const handleSave = async (item: Inventario & { producto: { id: string; nombre: string } }) => {
    setLoading(true);
    try {
      await actualizarInventarioAction(item.productoId, {
        cantidadActual: item.cantidadActual,
        puntoReorden: item.puntoReorden,
        ubicacion: item.ubicacion,
      });
      success("Inventario actualizado");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar";
      errorToast(msg);
    } finally {
      setLoading(false);
      setEditingId(null);
    }
  };

  const updateField = (productoId: string, field: "cantidadActual" | "puntoReorden" | "ubicacion", value: number | string) => {
    setLocalData((prev) =>
      prev.map((item) =>
        item.productoId === productoId
          ? { ...item, [field]: typeof value === "string" && field !== "ubicacion" ? Number(value) : value }
          : item
      )
    );
  };

  return (
    <main className="min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Inventario
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestiona el stock, punto de reorden y ubicación de tus productos
        </p>
      </div>

      {localData.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay inventario registrado.</p>
            <p className="text-muted-foreground text-sm mt-2">
              El inventario se crea automáticamente al agregar productos.
            </p>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Producto</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Stock</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Punto de reorden</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Ubicación</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {localData.map((item) => (
                <tr key={item.productoId} className="hover:bg-muted/30">
                  <td className="py-3.5 px-4 font-medium">{item.producto.nombre}</td>
                  <td className="py-3.5 px-4 text-center">
                    {editingId === item.productoId ? (
                      <Input
                        type="number"
                        min="0"
                        value={String(item.cantidadActual)}
                        onChange={(e) => updateField(item.productoId, "cantidadActual", Number(e.target.value))}
                        className="w-20 mx-auto text-center"
                        aria-label={`Stock de ${item.producto.nombre}`}
                      />
                    ) : (
                      <span className={item.cantidadActual <= item.puntoReorden ? "text-warning font-medium" : ""}>
                        {item.cantidadActual}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {editingId === item.productoId ? (
                      <Input
                        type="number"
                        min="0"
                        value={String(item.puntoReorden)}
                        onChange={(e) => updateField(item.productoId, "puntoReorden", Number(e.target.value))}
                        className="w-20 mx-auto text-center"
                        aria-label={`Punto de reorden de ${item.producto.nombre}`}
                      />
                    ) : (
                      item.puntoReorden
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {editingId === item.productoId ? (
                      <Input
                        value={item.ubicacion}
                        onChange={(e) => updateField(item.productoId, "ubicacion", e.target.value)}
                        placeholder="Ej: Almacén A"
                        aria-label={`Ubicación de ${item.producto.nombre}`}
                      />
                    ) : (
                      item.ubicacion
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {editingId === item.productoId ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => handleSave(item)} disabled={loading}>
                          Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="ml-2">
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => startEdit(item)}>
                        Editar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
