"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  crearServicioAction,
  actualizarServicioAction,
  eliminarServicioAction,
  listarSubareasAction,
} from "@/lib/actions";
import type { ServicioConRelaciones } from "@/services/CatalogService";
import type { Area, Subarea } from "@/generated/prisma/client";

interface Props {
  negocioId: string;
  servicios: ServicioConRelaciones[];
  areas: Area[];
  subareasIniciales: Subarea[];
}

export default function ServiciosPanel({ negocioId, servicios, areas, subareasIniciales }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [servicioEditando, setServicioEditando] = useState<ServicioConRelaciones | null>(null);
  const [subareas, setSubareas] = useState(subareasIniciales);
  const [loading, setLoading] = useState(false);
  const { success, error: errorToast } = useToast();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [duracionMinutos, setDuracionMinutos] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [subareaId, setSubareaId] = useState("");
  const [activo, setActivo] = useState(true);
  const [areaSeleccionada, setAreaSeleccionada] = useState("");
  const [tratamientoIVA, setTratamientoIVA] = useState<"GRAVADO" | "EXENTO" | "NO_SUJETO">("GRAVADO");

  const TRATAMIENTO_OPTIONS = [
    { value: "GRAVADO", label: "Gravado (10% IVA)" },
    { value: "EXENTO", label: "Exento" },
    { value: "NO_SUJETO", label: "No sujeto" },
  ];

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setDuracionMinutos("");
    setCapacidad("");
    setImagenUrl("");
    setSubareaId("");
    setActivo(true);
    setAreaSeleccionada("");
    setTratamientoIVA("GRAVADO");
  };

  const openCrear = () => {
    resetForm();
    setEditMode(false);
    setServicioEditando(null);
    setModalOpen(true);
  };

  const openEditar = (s: ServicioConRelaciones) => {
    setNombre(s.nombre);
    setDescripcion(s.descripcion ?? "");
    setDuracionMinutos(String(s.duracionMinutos));
    setCapacidad(String(s.capacidad));
    setImagenUrl(s.imagenUrl);
    setSubareaId(s.subareaId);
    setActivo(s.activo);
    const areaId = s.subarea?.areaId ?? "";
    setAreaSeleccionada(areaId);
    setTratamientoIVA((s.tratamientoIVA as "GRAVADO" | "EXENTO" | "NO_SUJETO") ?? "GRAVADO");
    cargarSubareas(areaId);
    setServicioEditando(s);
    setEditMode(true);
    setModalOpen(true);
  };

  const cargarSubareas = async (areaId: string) => {
    if (areaId) {
      const subs = await listarSubareasAction(areaId);
      setSubareas(subs);
      setAreaSeleccionada(areaId);
    } else {
      setSubareas([]);
    }
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    cargarSubareas(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const horariosDisponibles: Record<string, string[]> = {};
      if (editMode && servicioEditando) {
        await actualizarServicioAction(servicioEditando.id, {
          nombre,
          descripcion: descripcion || null,
          duracionMinutos: Number(duracionMinutos),
          capacidad: Number(capacidad),
          imagenUrl,
          subareaId,
          activo,
          horariosDisponibles,
          tratamientoIVA,
        });
        success("Servicio actualizado correctamente");
      } else {
        await crearServicioAction(negocioId, {
          nombre,
          descripcion: descripcion || null,
          duracionMinutos: Number(duracionMinutos),
          capacidad: Number(capacidad),
          imagenUrl,
          subareaId,
          activo,
          horariosDisponibles,
          tratamientoIVA,
        });
        success("Servicio creado correctamente");
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

  const handleEliminar = async (s: ServicioConRelaciones) => {
    if (!confirm(`¿Estás seguro de eliminar "${s.nombre}"?`)) return;
    try {
      await eliminarServicioAction(s.id);
      success("Servicio eliminado correctamente");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      errorToast(msg);
    }
  };

  const areaOptions = areas.map((a) => ({ value: a.id, label: a.nombre }));
  const subareaOptions = subareas.map((s) => ({ value: s.id, label: s.nombre }));

  return (
    <main className="min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Servicios de tu negocio
          </h1>
          <p className="text-muted-foreground mt-1">
            {servicios.length} servicio{servicios.length !== 1 ? "s" : ""} activo{servicios.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="gradient" onClick={openCrear}>
          + Nuevo servicio
        </Button>
      </div>

      {servicios.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tienes servicios todavía.</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={openCrear}>
              Crear primer servicio
            </Button>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Servicio</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Duración</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Capacidad</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Activo</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Subárea</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {servicios.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="py-3.5 px-4 font-medium">{s.nombre}</td>
                  <td className="py-3.5 px-4 text-center">{s.duracionMinutos} min</td>
                  <td className="py-3.5 px-4 text-center">{s.capacidad}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={s.activo ? "text-success" : "text-muted-foreground"}>
                      {s.activo ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">{s.subarea?.nombre ?? "—"}</td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex gap-1 justify-center">
                      <Button size="sm" variant="ghost" onClick={() => openEditar(s)}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleEliminar(s)}>Eliminar</Button>
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
        title={editMode ? "Editar servicio" : "Nuevo servicio"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Ej: Corte de cabello"
          />
          <Textarea
            label="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción del servicio"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duración (minutos)"
              type="number"
              min="1"
              value={duracionMinutos}
              onChange={(e) => setDuracionMinutos(e.target.value)}
              required
              placeholder="60"
            />
            <Input
              label="Capacidad"
              type="number"
              min="1"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              required
              placeholder="5"
            />
          </div>
          <Input
            label="URL de imagen"
            value={imagenUrl}
            onChange={(e) => setImagenUrl(e.target.value)}
            placeholder="https://..."
          />
          <Select
            label="Área"
            value={areaSeleccionada ?? ""}
            onChange={(e) => cargarSubareas(e.target.value)}
            options={areaOptions}
            placeholder="Selecciona un área"
          />
           <Select
             label="Subárea"
             value={subareaId ?? ""}
             onChange={(e) => setSubareaId(e.target.value)}
             options={subareaOptions}
             placeholder={subareaOptions.length === 0 ? "Selecciona un área primero" : "Selecciona una subárea"}
             disabled={subareaOptions.length === 0}
           />
           <Select
             label="Tratamiento IVA"
             value={tratamientoIVA}
             onChange={(e) => setTratamientoIVA(e.target.value as "GRAVADO" | "EXENTO" | "NO_SUJETO")}
             options={TRATAMIENTO_OPTIONS}
             required
           />
          <div className="flex items-center gap-2">
            <Checkbox
              id="activo-servicio"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
            />
            <label htmlFor="activo-servicio" className="text-sm font-medium">Servicio activo</label>
          </div>
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
