"use client";

import { Input, Select } from "@/components/ui/Input";
import type { GrupoCheckoutDTO } from "@/shared/checkout.types";
import type { GrupoNegocioCardProps } from "./GrupoNegocioCard";

export interface SelectorEntregaProps {
  grupo: GrupoCheckoutDTO;
  seleccion: GrupoNegocioCardProps["seleccion"];
  direccionUsuario?: string | null;
  onTipoChange: (tipo: "DOMICILIO" | "RECOGIDA_TIENDA") => void;
  onOpcionChange: (id: string) => void;
  onDireccionChange: (direccion: string) => void;
}

export function SelectorEntrega({
  grupo,
  seleccion,
  direccionUsuario,
  onTipoChange,
  onOpcionChange,
  onDireccionChange,
}: SelectorEntregaProps) {
  const fieldsetId = `entrega-${grupo.negocioId}`;
  const showDomicilioFields = seleccion.tipoEntrega === "DOMICILIO";
  const permiteEnvio = grupo.negocio.permiteEnvio;

  const opcionesSelect = grupo.opcionesLogistica.map((op) => ({
    value: op.id,
    label: `${op.nombre} — $${op.costo.toFixed(2)} (${op.tiempoEstimado})`,
  }));

  return (
    <fieldset className="space-y-3" id={fieldsetId}>
      <legend className="text-sm font-semibold text-foreground">
        Tipo de entrega para {grupo.negocio.nombre}
      </legend>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={fieldsetId}
            value="DOMICILIO"
            checked={seleccion.tipoEntrega === "DOMICILIO"}
            onChange={() => onTipoChange("DOMICILIO")}
            disabled={!permiteEnvio}
            aria-describedby={`${fieldsetId}-domicilio-desc`}
            className="h-4 w-4 text-primary focus:ring-primary"
          />
          <span className="text-sm">Entrega a domicilio</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={fieldsetId}
            value="RECOGIDA_TIENDA"
            checked={seleccion.tipoEntrega === "RECOGIDA_TIENDA"}
            onChange={() => onTipoChange("RECOGIDA_TIENDA")}
            className="h-4 w-4 text-primary focus:ring-primary"
          />
          <span className="text-sm">Recoger en tienda</span>
        </label>
      </div>

      {showDomicilioFields && permiteEnvio && (
        <div id={`${fieldsetId}-domicilio-desc`} className="space-y-3 pt-1">
          <div>
            <Input
              id={`dir-${grupo.negocioId}`}
              label="Dirección de entrega"
              type="text"
              value={seleccion.direccionEntrega ?? direccionUsuario ?? ""}
              onChange={(e) => onDireccionChange(e.target.value)}
              placeholder="Calle, número, ciudad..."
              error={
                seleccion.direccionEntrega === "" && showDomicilioFields
                  ? "La dirección es obligatoria"
                  : undefined
              }
              aria-required
            />
          </div>

          {opcionesSelect.length > 0 ? (
            <Select
              id={`opc-${grupo.negocioId}`}
              label="Opción de envío"
              value={seleccion.opcionLogisticaId ?? ""}
              onChange={(e) => onOpcionChange(e.target.value)}
              options={opcionesSelect}
              placeholder="Selecciona una opción"
              aria-required
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              No hay opciones de envío disponibles para este negocio.
            </p>
          )}
        </div>
      )}

      {showDomicilioFields && !permiteEnvio && (
        <p className="text-sm text-muted-foreground pt-1">
          El negocio no ofrece envíos a domicilio. Cambia a recogida en tienda.
        </p>
      )}

      {seleccion.tipoEntrega === "RECOGIDA_TIENDA" && (
        <div className="pt-1 text-sm text-muted-foreground">
          <p>Dirección del negocio:</p>
          <p>{grupo.negocio.direccion ?? "Sin dirección registrada"}</p>
          {grupo.negocio.provincia && (
            <p>
              {grupo.negocio.provincia}
              {grupo.negocio.municipio ? `, ${grupo.negocio.municipio}` : ""}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
