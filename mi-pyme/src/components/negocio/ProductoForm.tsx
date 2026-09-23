"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  crearProductoAction,
  actualizarProductoAction,
  eliminarProductoAction,
  listarSubareasAction,
} from "@/lib/actions";
import type { ProductoConRelaciones } from "@/services/CatalogService";
import type { Area } from "@/generated/prisma/client";

interface Props {
  negocioId: string;
  productos: ProductoConRelaciones[];
  areas: Area[];
  subareasIniciales: Array<{ id: string; nombre: string }>;
}

export default function ProductosPanel({ negocioId, productos, areas, subareasIniciales }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [productoEditando, setProductoEditando] = useState<ProductoConRelaciones | null>(null);
  const [subareas, setSubareas] = useState(subareasIniciales);
  const [loading, setLoading] = useState(false);
  const { success, error: errorToast } = useToast();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [unidadMedida, setUnidadMedida] = useState("unidad");
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
    setPrecio("");
    setUnidadMedida("unidad");
    setImagenUrl("");
    setSubareaId("");
    setActivo(true);
    setAreaSeleccionada("");
    setTratamientoIVA("GRAVADO");
  };

  const openCrear = () => {
    resetForm();
    setEditMode(false);
    setProductoEditando(null);
    setModalOpen(true);
  };

  const openEditar = (p: ProductoConRelaciones) => {
    setNombre(p.nombre);
    setDescripcion(p.descripcion ?? "");
    setPrecio(String(p.precio));
    setUnidadMedida(p.unidadMedida);
    setImagenUrl(p.imagenUrl);
    setSubareaId(p.subareaId);
    setActivo(p.activo);
    setAreaSeleccionada(p.subarea?.areaId ?? "");
    setTratamientoIVA((p.tratamientoIVA as "GRAVADO" | "EXENTO" | "NO_SUJETO") ?? "GRAVADO");
    setProductoEditando(p);
    setEditMode(true);
    setModalOpen(true);
    cargarSubareas(p.subarea?.areaId ?? "");
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
    const val = e.target.value;
    setAreaSeleccionada(val);
    cargarSubareas(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editMode && productoEditando) {
        await actualizarProductoAction(productoEditando.id, {
          nombre,
          descripcion: descripcion || null,
          precio: Number(precio),
          unidadMedida,
          imagenUrl,
          subareaId,
          activo,
          tratamientoIVA,
        });
        success("Producto actualizado correctamente");
      } else {
        await crearProductoAction(negocioId, {
          nombre,
          descripcion: descripcion || null,
          precio: Number(precio),
          unidadMedida,
          imagenUrl,
          subareaId,
          activo,
          tratamientoIVA,
        });
        success("Producto creado correctamente");
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

  const handleEliminar = async (p: ProductoConRelaciones) => {
    if (!confirm(`¿Estás seguro de eliminar "${p.nombre}"?`)) return;
    try {
      await eliminarProductoAction(p.id);
      success("Producto eliminado correctamente");
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
            Productos de tu negocio
          </h1>
          <p className="text-muted-foreground mt-1">
            {productos.length} producto{productos.length !== 1 ? "s" : ""} activo{productos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button variant="gradient" onClick={openCrear}>
          + Nuevo producto
        </Button>
      </div>

      {productos.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tienes productos todavía.</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={openCrear}>
              Crear primer producto
            </Button>
          </div>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Producto</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Precio</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Activo</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Subárea</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {productos.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {p.imagenUrl ? (
                        <img src={p.imagenUrl} alt={p.nombre} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">Sin img</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground">{p.unidadMedida}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">${Number(p.precio).toFixed(2)}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={p.activo ? "text-success" : "text-muted-foreground"}>
                      {p.activo ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">{p.subarea?.nombre ?? "—"}</td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex gap-1 justify-center">
                      <Button size="sm" variant="ghost" onClick={() => openEditar(p)}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleEliminar(p)}>Eliminar</Button>
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
        title={editMode ? "Editar producto" : "Nuevo producto"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Ej: Café molido"
          />
          <Textarea
            label="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción del producto"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio"
              type="number"
              step="0.01"
              min="0"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              required
              placeholder="0.00"
            />
            <Input
              label="Unidad de medida"
              value={unidadMedida}
              onChange={(e) => setUnidadMedida(e.target.value)}
              placeholder="Ej: unidad, kg, litro"
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
               id="activo"
               checked={activo}
               onChange={(e) => setActivo(e.target.checked)}
             />
             <label htmlFor="activo" className="text-sm font-medium">Producto activo</label>
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
