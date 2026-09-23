"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Upload, X } from "lucide-react";

export interface ComprobanteFormProps {
  pagoId: string;
  metodo: "TRANSFERENCIA_BANCARIA" | "PAGO_MOVIL";
  initialReferencia?: string | null;
  initialIdTransferencia?: string | null;
  initialEntidadPago?: string | null;
  initialNotas?: string | null;
  onSubmit: (datos: {
    referencia?: string | null;
    comprobanteUrl?: string | null;
    idTransferencia?: string | null;
    entidadPago?: string | null;
    notasCliente?: string | null;
  }) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function ComprobanteForm({
  pagoId,
  metodo,
  initialReferencia,
  initialIdTransferencia,
  initialEntidadPago,
  initialNotas,
  onSubmit,
  onCancel,
  className,
}: ComprobanteFormProps) {
  const [referencia, setReferencia] = useState(initialReferencia ?? "");
  const [idTransferencia, setIdTransferencia] = useState(initialIdTransferencia ?? "");
  const [entidadPago, setEntidadPago] = useState(initialEntidadPago ?? "");
  const [notas, setNotas] = useState(initialNotas ?? "");
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTransferencia = metodo === "TRANSFERENCIA_BANCARIA";

  const ENTIDADES_OPCIS = ["Transfermovil", "EnZona", "BPA", "BancoMetropolitano", "BPI"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (idTransferencia && !entidadPago) {
      setError("Debe seleccionar la entidad de pago");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        referencia: referencia || undefined,
        comprobanteUrl: comprobanteUrl ?? undefined,
        idTransferencia: idTransferencia || undefined,
        entidadPago: entidadPago || undefined,
        notasCliente: notas || undefined,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al subir el comprobante");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setError("Formato de archivo no permitido. Usa PNG, JPG o PDF.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("El archivo es demasiado grande. Máximo 5 MB.");
      return;
    }

    const fakeUrl = `/uploads/pagos/${pagoId}_${Date.now()}.${file.name.split(".").pop()}`;
    setComprobanteUrl(fakeUrl);
    setError(null);
  };

  const handleRemoveImage = () => {
    setComprobanteUrl(null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-4", className)}
      aria-label="Formulario de comprobante de pago"
    >
      <div>
        <label className="text-sm font-semibold text-foreground mb-1 block">
          {isTransferencia ? "Número de referencia de transferencia" : "Referencia de pago móvil"}
        </label>
        <Input
          type="text"
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          placeholder={isTransferencia ? "Ej: 1234567890" : "Ej: 05-123-456-78"}
          error={error ?? undefined}
          aria-required
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground mb-1 block">
          ID Transferencia (conciliación)
        </label>
        <Input
          type="text"
          value={idTransferencia}
          onChange={(e) => setIdTransferencia(e.target.value)}
          placeholder={isTransferencia ? "Ej: TM-2026-000123" : "Ej: EZ-2026-000123"}
          error={error ?? undefined}
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground mb-1 block">
          Entidad de pago
        </label>
        <select
          value={entidadPago}
          onChange={(e) => setEntidadPago(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Selecciona una entidad</option>
          {ENTIDADES_OPCIS.map((entidad) => (
            <option key={entidad} value={entidad}>
              {entidad}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground mb-1 block">
          Comprobante (opcional)
        </label>
        <div className="mt-1 flex items-center gap-3">
          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground hover:bg-muted">
            <Upload className="h-4 w-4" />
            <span>Subir archivo</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,application/pdf"
              onChange={handleUpload}
              className="sr-only"
              aria-label="Seleccionar archivo de comprobante"
            />
          </label>
          {comprobanteUrl && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label="Eliminar archivo"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {comprobanteUrl && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {comprobanteUrl}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground mb-1 block">
          Notas (opcional)
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Información adicional sobre tu pago..."
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={submitting} className="flex-1">
          Guardar comprobante
        </Button>
      </div>
    </form>
  );
}

ComprobanteForm.displayName = "ComprobanteForm";
