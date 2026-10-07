"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearSolicitudAltaAction } from "@/lib/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { Area, Subarea } from "@/generated/prisma/client";
import { MapPin, Building2, Phone, Mail, Truck } from "lucide-react";

interface Props {
  areas: Area[];
  subareasByArea: Record<string, Subarea[]>;
}

export default function SolicitudAltaForm({ areas, subareasByArea }: Props) {
  const router = useRouter();
  const { success, error: errorToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [nombreNegocio, setNombreNegocio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [areaId, setAreaId] = useState<string | null>(null);
  const [subareaIds, setSubareaIds] = useState<string[]>([]);
  const [provincia, setProvincia] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [telefono, setTelefono] = useState("");
  const [emailContacto, setEmailContacto] = useState("");
  const [direccion, setDireccion] = useState("");
  const [tipoRol, setTipoRol] = useState<"NEGOCIO" | "LOGISTICA">("NEGOCIO");

  const areaOptions = areas.map((a) => ({ value: a.id, label: a.nombre }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await crearSolicitudAltaAction({
        nombreNegocio,
        tipoRol,
        descripcion: descripcion || undefined,
        areaId: areaId ?? undefined,
        subareaIds,
        provincia: provincia || undefined,
        municipio: municipio || undefined,
        telefono,
        emailContacto,
        direccion: direccion || undefined,
      });
      success("Solicitud enviada correctamente");
      router.push("/mis-solicitudes");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar la solicitud";
      errorToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const subareasOptions = areaId ? (subareasByArea[areaId]?.map((s) => ({ value: s.id, label: s.nombre })) ?? []) : [];

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Input
              label="Nombre del negocio"
              value={nombreNegocio}
              onChange={(e) => setNombreNegocio(e.target.value)}
              required
              minLength={3}
              leftIcon={<Building2 className="h-4 w-4" />}
              placeholder="Ej: Mi cafetería"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Tipo de solicitud
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoRol("NEGOCIO")}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                  tipoRol === "NEGOCIO"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted"
                }`}
                aria-pressed={tipoRol === "NEGOCIO"}
              >
                <Building2 className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Negocio</div>
                  <div className="text-sm opacity-80">
                    Registra un negocio con productos y servicios
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setTipoRol("LOGISTICA")}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                  tipoRol === "LOGISTICA"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted"
                }`}
                aria-pressed={tipoRol === "LOGISTICA"}
              >
                <Truck className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Logística</div>
                  <div className="text-sm opacity-80">
                    Ofrece servicios de delivery y transporte
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <Textarea
              label="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Cuéntanos brevemente sobre tu negocio..."
            />
          </div>

          <div>
            <Select
              label="Categoría (área)"
              value={areaId ?? ""}
              onChange={(e) => { setAreaId(e.target.value); setSubareaIds([]); }}
              options={areaOptions}
              placeholder="Selecciona una categoría"
            />
          </div>

          <div>
            <Select
              label="Subcategoría"
              value={subareaIds[0] ?? ""}
              onChange={(e) => setSubareaIds(e.target.value ? [e.target.value] : [])}
              options={subareasOptions}
              placeholder={areaId ? "Selecciona una subcategoría" : "Primero selecciona un área"}
              disabled={!areaId}
            />
          </div>

          <div>
            <Input
              label="Provincia"
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              leftIcon={<MapPin className="h-4 w-4" />}
              placeholder="Ej: Buenos Aires"
            />
          </div>

          <div>
            <Input
              label="Municipio / Localidad"
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              leftIcon={<MapPin className="h-4 w-4" />}
              placeholder="Ej: CABA"
            />
          </div>

          <div>
            <Input
              label="Teléfono de contacto"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              type="tel"
              required
              leftIcon={<Phone className="h-4 w-4" />}
              placeholder="+54 11 1234-5678"
            />
          </div>

          <div>
            <Input
              label="Email de contacto"
              value={emailContacto}
              onChange={(e) => setEmailContacto(e.target.value)}
              type="email"
              required
              leftIcon={<Mail className="h-4 w-4" />}
              placeholder="negocio@ejemplo.com"
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Dirección"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              leftIcon={<MapPin className="h-4 w-4" />}
              placeholder="Calle, ciudad, código postal"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" loading={loading} disabled={loading}>
            {loading ? "Enviando..." : "Enviar solicitud de alta"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
