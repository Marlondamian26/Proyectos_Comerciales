"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { useToast } from "@/components/ui/Toast";
import { actualizarDatosFiscalesAction } from "@/lib/actions";
import type { RegimenFiscal, ModoPrecio } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

interface Props {
  negocioId: string;
  datosIniciales: {
    regimenFiscal: string;
    tasaIVA: number;
    modoPrecio: string;
    nit: string | null;
    direccionFiscal: string | null;
    telefonoFiscal: string | null;
    emailFiscal: string | null;
    prefijoFactura: string;
  };
}

const REGIMENES_OPTIONS: { value: string; label: string }[] = [
  { value: "GENERAL", label: "General (IVA 10%)" },
  { value: "SIMPLIFICADO", label: "Simplificado" },
  { value: "EXENTO", label: "Exento" },
  { value: "NO_SUJETO", label: "No sujeto" },
];

const MODO_PRECIO_OPTIONS: { value: string; label: string }[] = [
  { value: "IVA_INCLUIDO", label: "IVA incluido (precio con IVA)" },
  { value: "IVA_AGREGADO", label: "IVA agregado (precio base)" },
];

export default function DatosFiscalesForm({ negocioId, datosIniciales }: Props) {
  const [regimenFiscal, setRegimenFiscal] = useState(datosIniciales.regimenFiscal);
  const [tasaIVA, setTasaIVA] = useState(String(datosIniciales.tasaIVA));
  const [modoPrecio, setModoPrecio] = useState(datosIniciales.modoPrecio);
  const [nit, setNit] = useState(datosIniciales.nit ?? "");
  const [direccionFiscal, setDireccionFiscal] = useState(datosIniciales.direccionFiscal ?? "");
  const [telefonoFiscal, setTelefonoFiscal] = useState(datosIniciales.telefonoFiscal ?? "");
  const [emailFiscal, setEmailFiscal] = useState(datosIniciales.emailFiscal ?? "");
  const [prefijoFactura, setPrefijoFactura] = useState(datosIniciales.prefijoFactura ?? "PR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: errorToast } = useToast();

  const regimenesSinIVA = ["SIMPLIFICADO", "EXENTO", "NO_SUJETO"];
  const cambiarANuevoRegimenSinIVA =
    regimenesSinIVA.includes(regimenFiscal) &&
    !regimenesSinIVA.includes(datosIniciales.regimenFiscal);
  const advertenciaRegimen = cambiarANuevoRegimenSinIVA;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
         await actualizarDatosFiscalesAction(negocioId, {
           regimenFiscal,
           tasaIVA: Number(tasaIVA),
           modoPrecio,
           nit: nit || null,
           direccionFiscal: direccionFiscal || null,
           telefonoFiscal: telefonoFiscal || null,
           emailFiscal: emailFiscal || null,
           prefijoFactura,
           confirmarCambioRegimen: true,
         });
      success("Datos fiscales actualizados correctamente");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar";
      setError(msg);
      errorToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Select
            label="Régimen fiscal"
            value={regimenFiscal}
            onChange={(e) => setRegimenFiscal(e.target.value as RegimenFiscal)}
            options={REGIMENES_OPTIONS}
            required
            aria-describedby={advertenciaRegimen ? "regimen-warning" : undefined}
          />

          <Input
            label="Tasa de IVA (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={tasaIVA}
            onChange={(e) => setTasaIVA(e.target.value)}
            disabled={regimenesSinIVA.includes(regimenFiscal)}
            hint={regimenesSinIVA.includes(regimenFiscal) ? "Tasa 0% para régimenes exentos" : undefined}
            required
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">Modo de precio</legend>
          <div className="flex gap-4" role="radiogroup" aria-label="Modo de precio">
            {MODO_PRECIO_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="modoPrecio"
                  value={opt.value}
                  checked={modoPrecio === opt.value}
                  onChange={() => setModoPrecio(opt.value as ModoPrecio)}
                  className="h-4 w-4 text-primary focus:ring-primary"
                  required
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Input
          label="NIT"
          value={nit}
          onChange={(e) => setNit(e.target.value)}
          placeholder="Número de identificación tributaria"
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <Input
            label="Dirección fiscal"
            value={direccionFiscal}
            onChange={(e) => setDireccionFiscal(e.target.value)}
            placeholder="Dirección para facturación"
          />
          <Input
            label="Teléfono fiscal"
            value={telefonoFiscal}
            onChange={(e) => setTelefonoFiscal(e.target.value)}
            placeholder="Teléfono de contacto fiscal"
          />
        </div>

         <Input
           label="Email fiscal"
           type="email"
           value={emailFiscal}
           onChange={(e) => setEmailFiscal(e.target.value)}
           placeholder="email@negocio.com"
         />

         <Input
           label="Prefijo de factura"
           value={prefijoFactura}
           onChange={(e) => setPrefijoFactura(e.target.value.toUpperCase())}
           placeholder="PR"
           maxLength={10}
           required
         />

        {advertenciaRegimen && (
          <div
            id="regimen-warning"
            className="rounded-lg bg-warning/10 border border-warning/20 p-3 text-sm text-warning"
            role="alert"
          >
            <p className="font-semibold">Advertencia:</p>
            <p>
              Al cambiar a un régimen sin IVA, la tasa se establecerá en 0%
              y afectará a todos los productos gravados del negocio.
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            variant="primary"
          >
            Guardar datos fiscales
          </Button>
        </div>
      </form>
    </Card>
  );
}
