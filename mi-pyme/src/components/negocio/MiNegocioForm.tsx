"use client";

import { useState } from "react";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { actualizarNegocioAction, actualizarSubareasNegocioAction, listarSubareasAction } from "@/lib/actions";
import type { NegocioConHorarios } from "@/shared/negocio.types";

interface Props {
  negocio: NegocioConHorarios;
  areas: Array<{ id: string; nombre: string; slug: string }>;
}

interface SubareaOption {
  value: string;
  label: string;
}

export default function MiNegocioForm({ negocio, areas }: Props) {
  const [nombre, setNombre] = useState(negocio.nombre);
  const [descripcion, setDescripcion] = useState(negocio.descripcion ?? "");
  const [telefono, setTelefono] = useState(negocio.telefono ?? "");
  const [emailContacto, setEmailContacto] = useState(negocio.emailContacto ?? "");
  const [direccion, setDireccion] = useState(negocio.direccion ?? "");
  const [provincia, setProvincia] = useState(negocio.provincia ?? "");
  const [municipio, setMunicipio] = useState(negocio.municipio ?? "");
  const [areaId, setAreaId] = useState(negocio.areaId ?? "");
  const [permiteReservas, setPermiteReservas] = useState(negocio.permiteReservas);
  const [permiteEnvio, setPermiteEnvio] = useState(negocio.permiteEnvio);
  const [subareas, setSubareas] = useState<SubareaOption[]>([]);
  const [selectedSubareas, setSelectedSubareas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { success, error: errorToast } = useToast();

  const handleAreaChange = async (newAreaId: string) => {
    setAreaId(newAreaId || "");
    if (newAreaId) {
      const subs = await listarSubareasAction(newAreaId);
      setSubareas(subs.map((s) => ({ value: s.id, label: s.nombre })));
    } else {
      setSubareas([]);
    }
  };

  const toggleSubarea = (subareaId: string) => {
    setSelectedSubareas((prev) =>
      prev.includes(subareaId)
        ? prev.filter((s) => s !== subareaId)
        : [...prev, subareaId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await actualizarNegocioAction(negocio.id, {
        nombre,
        descripcion: descripcion || null,
        areaId: areaId || null,
        provincia: provincia || null,
        municipio: municipio || null,
        telefono: telefono || null,
        emailContacto: emailContacto || null,
        direccion: direccion || null,
        permiteReservas,
        permiteEnvio,
      });
      await actualizarSubareasNegocioAction(negocio.id, selectedSubareas);
      success("Negocio actualizado correctamente");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar";
      errorToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const areaOptions = areas.map((a) => ({ value: a.id, label: a.nombre }));

  return (
    <main className="min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Datos del negocio
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestiona la información general de tu negocio
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Input
              label="Nombre del negocio"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Ej: Café del Barrio"
            />
            <Textarea
              label="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve descripción de tu negocio"
              rows={4}
            />
            <Select
              label="Área"
              value={areaId ?? ""}
              onChange={(e) => handleAreaChange(e.target.value)}
              options={areaOptions}
              placeholder="Selecciona un área"
            />
          </div>

          <div className="space-y-4">
            <Input
              label="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: +54 9 11 1234-5678"
            />
            <Input
              label="Email de contacto"
              type="email"
              value={emailContacto}
              onChange={(e) => setEmailContacto(e.target.value)}
              placeholder="Ej: contacto@negocio.com"
            />
            <Input
              label="Provincia"
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              placeholder="Ej: Buenos Aires"
            />
            <Input
              label="Municipio"
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              placeholder="Ej: La Plata"
            />
            <Input
              label="Dirección"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej: Calle 123, 456"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="permiteReservas"
                checked={permiteReservas}
                onChange={(e) => setPermiteReservas(e.target.checked)}
              />
              <label htmlFor="permiteReservas" className="text-sm font-medium">
                Permite reservas de servicios
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="permiteEnvio"
                checked={permiteEnvio}
                onChange={(e) => setPermiteEnvio(e.target.checked)}
              />
              <label htmlFor="permiteEnvio" className="text-sm font-medium">
                Permite envíos a domicilio
              </label>
            </div>
          </div>

          {subareas.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Subáreas del negocio</label>
              <div className="flex flex-wrap gap-2">
                {subareas.map((sub) => (
                  <label
                    key={sub.value}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={selectedSubareas.includes(sub.value)}
                      onChange={(e) => toggleSubarea(sub.value)}
                    />
                    {sub.label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" loading={loading} disabled={loading}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </main>
  );
}
