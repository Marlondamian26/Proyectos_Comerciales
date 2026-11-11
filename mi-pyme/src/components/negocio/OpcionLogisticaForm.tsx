"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  crearOpcionLogisticaAction,
  actualizarOpcionLogisticaAction,
  eliminarOpcionLogisticaAction,
  listProveedoresDisponiblesAction,
} from "@/lib/actions";
import type { OpcionLogistica } from "@/generated/prisma/client";

interface OpcionConProveedor extends Omit<OpcionLogistica, "proveedor" | "negocio"> {
  proveedor?: { id: string; nombre: string; zonaCobertura: string; alcanceNacional: boolean };
}

interface Props {
  negocioId: string;
  opciones: OpcionConProveedor[];
}

export default function OpcionLogisticaForm({ negocioId, opciones }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [opcionEditando, setOpcionEditando] = useState<OpcionConProveedor | null>(null);
  const [proveedores, setProveedores] = useState<Array<{ id: string; nombre: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const { success, error: errorToast } = useToast();

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("envio");
  const [tarifaBase, setTarifaBase] = useState("");
  const [tarifaPorDistancia, setTarifaPorDistancia] = useState("");
  const [tiempoEstimado, setTiempoEstimado] = useState("");
  const [proveedorId, setProveedorId] = useState("");

  const resetForm = () => {
    setNombre("");
    setTipo("envio");
    setTarifaBase("");
    setTarifaPorDistancia("");
    setTiempoEstimado("");
    setProveedorId("");
  };

  const cargarProveedores = async () => {
    setLoadingProveedores(true);
    try {
      const result = await listProveedoresDisponiblesAction(negocioId);
      setProveedores(
        (result ?? []).map((p) => ({ id: p.id, nombre: p.nombre }))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar proveedores";
      errorToast(msg);
    } finally {
      setLoadingProveedores(false);
    }
  };

  const openCrear = async () => {
    resetForm();
    setEditMode(false);
    setOpcionEditando(null);
    setModalOpen(true);
    await cargarProveedores();
  };

  const openEditar = async (o: OpcionConProveedor) => {
    setNombre(o.nombre);
    setTipo(o.tipo);
    setTarifaBase(String(o.tarifaBase));
    setTarifaPorDistancia(String(o.tarifaPorDistancia));
    setTiempoEstimado(o.tiempoEstimado);
    setProveedorId(o.proveedor?.id ?? "");
    setOpcionEditando(o);
    setEditMode(true);
    setModalOpen(true);
    await cargarProveedores();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editMode && opcionEditando) {
        await actualizarOpcionLogisticaAction(opcionEditando.id, {
          nombre,
          tipo,
          tarifaBase: Number(tarifaBase),
          tarifaPorDistancia: Number(tarifaPorDistancia),
          tiempoEstimado,
          proveedorId,
        });
        success("Opción actualizada correctamente");
      } else {
        await crearOpcionLogisticaAction(negocioId, {
          proveedorId,
          nombre,
          tipo,
          tarifaBase: Number(tarifaBase),
          tarifaPorDistancia: Number(tarifaPorDistancia),
          tiempoEstimado,
        });
        success("Opción de envío creada correctamente");
      }
      setModalOpen(false);
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      errorToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (o: OpcionConProveedor) => {
    if (!confirm(`¿Estás seguro de eliminar "${o.nombre}"?`)) return;
    try {
      await eliminarOpcionLogisticaAction(o.id);
      success("Opción eliminada correctamente");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      errorToast(msg);
    }
  };

  const proveedorOptions = proveedores.map((p) => ({ value: p.id, label: p.nombre }));
  const tipoOptions = [
    { value: "envio", label: "Envío a domicilio" },
    { value: "recogida", label: "Retiro en negocio" },
    { value: "express", label: "Envío exprés" },
  ];

  return (
    <main className="min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Opciones de envío
          </h1>
          <p className="text-muted-foreground mt-1">
            Configura las opciones de logística para tu negocio
          </p>
        </div>
        <Button variant="gradient" onClick={openCrear}>
          + Nueva opción
        </Button>
      </div>

      {opciones.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tienes opciones de envío configuradas.</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={openCrear}>
              Crear primera opción
            </Button>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Nombre</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Proveedor</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Tipo</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Tarifa base</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">x km</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Tiempo</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {opciones.map((o) => (
                <tr key={o.id} className="hover:bg-muted/30">
                  <td className="py-3.5 px-4 font-medium">{o.nombre}</td>
                  <td className="py-3.5 px-4">{o.proveedor?.nombre ?? "—"}</td>
                  <td className="py-3.5 px-4 text-center">{o.tipo}</td>
                  <td className="py-3.5 px-4 text-right">${Number(o.tarifaBase).toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-right">${Number(o.tarifaPorDistancia).toFixed(2)}</td>
                  <td className="py-3.5 px-4">{o.tiempoEstimado}</td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex gap-1 justify-center">
                      <Button size="sm" variant="ghost" onClick={() => openEditar(o)}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleEliminar(o)}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editMode ? "Editar opción de envío" : "Nueva opción de envío"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Ej: Envío estándar"
          />
          <Select
            label="Tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            options={tipoOptions}
            placeholder="Selecciona un tipo"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tarifa base"
              type="number"
              step="0.01"
              min="0"
              value={tarifaBase}
              onChange={(e) => setTarifaBase(e.target.value)}
              required
              placeholder="0.00"
            />
            <Input
              label="Tarifa por km"
              type="number"
              step="0.01"
              min="0"
              value={tarifaPorDistancia}
              onChange={(e) => setTarifaPorDistancia(e.target.value)}
              required
              placeholder="0.00"
            />
          </div>
          <Input
            label="Tiempo estimado"
            value={tiempoEstimado}
            onChange={(e) => setTiempoEstimado(e.target.value)}
            placeholder="Ej: 24-48 horas"
          />
          <Select
            label="Proveedor"
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
            options={proveedorOptions}
            placeholder={loadingProveedores ? "Cargando..." : "Selecciona un proveedor"}
            disabled={loadingProveedores || proveedorOptions.length === 0}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} disabled={loading}>
              {editMode ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
