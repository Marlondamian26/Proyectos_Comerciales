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

export default function SolicitudRolForm({ areas, subareasByArea }: Props) {
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
  const [tipo, setTipo] = useState<"NEGOCIO" | "LOGISTICA">("NEGOCIO");
  const [alcanceNacional, setAlcanceNacional] = useState(false);
  const [tiposEnvio, setTiposEnvio] = useState<
    Array<"paquete" | "mudanza" | "personas" | "carga">
  >([]);

  const areaOptions = areas.map((a) => ({ value: a.id, label: a.nombre }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await crearSolicitudAltaAction({
        nombreNegocio,
        tipo,
        descripcion: descripcion || undefined,
        areaId: tipo === "NEGOCIO" ? areaId ?? undefined : undefined,
        subareaIds: tipo === "NEGOCIO" ? subareaIds : undefined,
        provincia: provincia || undefined,
        municipio: municipio || undefined,
        telefono: telefono || undefined,
        emailContacto: emailContacto || undefined,
        direccion: direccion || undefined,
        alcanceNacional: tipo === "LOGISTICA" ? alcanceNacional : undefined,
        tiposEnvio: tipo === "LOGISTICA" ? tiposEnvio : undefined,
      });
      success("Solicitud enviada correctamente");
      router.push("/solicitar-rol/estado");
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
              label={tipo === "NEGOCIO" ? "Nombre del negocio" : "Nombre del proveedor logístico"}
              value={nombreNegocio}
              onChange={(e) => setNombreNegocio(e.target.value)}
              required
              minLength={3}
              leftIcon={<Building2 className="h-4 w-4" />}
              placeholder={
                tipo === "NEGOCIO"
                  ? "Ej: Mi cafetería"
                  : "Ej: Transporte del Centro"
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Tipo de solicitud
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipo("NEGOCIO")}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                  tipo === "NEGOCIO"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted"
                }`}
                aria-pressed={tipo === "NEGOCIO"}
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
                onClick={() => setTipo("LOGISTICA")}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                  tipo === "LOGISTICA"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-muted"
                }`}
                aria-pressed={tipo === "LOGISTICA"}
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
              placeholder={
                tipo === "NEGOCIO"
                  ? "Cuéntanos brevemente sobre tu negocio..."
                  : "Describe tus servicios logísticos..."
              }
            />
          </div>

          {tipo === "NEGOCIO" ? (
            <>
              <div>
                <Select
                  label="Categoría (área)"
                  value={areaId ?? ""}
                  onChange={(e) => { setAreaId(e.target.value); setSubareaIds([]); }}
                  options={areaOptions}
                  placeholder="Selecciona una categoría"
                  required
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">Subcategorías</legend>
                {!areaId ? (
                  <p className="text-sm text-muted-foreground">
                    Primero selecciona un área.
                  </p>
                ) : subareasOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay subcategorías disponibles.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {subareasOptions.map((subarea) => (
                      <label
                        key={subarea.value}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={subareaIds.includes(subarea.value)}
                          onChange={(event) => {
                            setSubareaIds((current) =>
                              event.target.checked
                                ? [...current, subarea.value]
                                : current.filter((id) => id !== subarea.value)
                            );
                          }}
                        />
                        {subarea.label}
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
            </>
          ) : (
            <div className="md:col-span-2 space-y-4">
              <label className="flex items-center gap-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={alcanceNacional}
                  onChange={(event) =>
                    setAlcanceNacional(event.target.checked)
                  }
                />
                Ofrezco cobertura nacional
              </label>
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">Tipos de envío</legend>
                <p id="tipos-envio-help" className="text-sm text-muted-foreground">
                  Selecciona al menos un tipo de servicio.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ["paquete", "Paquetes"],
                    ["mudanza", "Mudanzas"],
                    ["personas", "Transporte de personas"],
                    ["carga", "Carga"],
                  ].map(([value, label]) => {
                    const envio = value as
                      | "paquete"
                      | "mudanza"
                      | "personas"
                      | "carga";
                    return (
                      <label
                        key={envio}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={tiposEnvio.includes(envio)}
                          aria-describedby="tipos-envio-help"
                          onChange={(event) => {
                            setTiposEnvio((current) =>
                              event.target.checked
                                ? [...current, envio]
                                : current.filter((item) => item !== envio)
                            );
                          }}
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          )}

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
            {loading ? "Enviando..." : "Enviar solicitud de rol"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
