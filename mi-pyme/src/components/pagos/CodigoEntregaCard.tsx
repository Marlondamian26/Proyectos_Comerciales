"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { QrCode, Copy, RefreshCw, Clock, AlertCircle, Lock } from "lucide-react";
import type { PagoConRelacionesDTO } from "@/shared/pagos.types";

interface Props {
  pago: PagoConRelacionesDTO;
}

const PLACEHOLDER_CODIGO = "******";

export function CodigoEntregaCard({ pago }: Props) {
  const [codigo, setCodigo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [regenerarLoading, setRegenerarLoading] = useState(false);
  const { addToast } = useToast();

  const fetchCodigo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pagos/${pago.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "obtener_codigo" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al obtener código");
      }
      const data = await res.json();
      setCodigo(data?.codigo ?? null);
    } catch (err: unknown) {
      addToast({
        message: err instanceof Error ? err.message : "Error al obtener código",
        variant: "error",
        title: "Error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerar = async () => {
    const motivo = prompt("¿Por qué necesitas regenerar el código? (mínimo 20 caracteres)");
    if (!motivo) return;
    setRegenerarLoading(true);
    try {
      const res = await fetch(`/api/pagos/${pago.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "regenerar_codigo", motivo }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al regenerar código");
      }
      addToast({
        message: "Código regenerado. Revisa tu nuevo código.",
        variant: "success",
        title: "Éxito",
      });
      setShow(false);
      setCodigo(null);
    } catch (err: unknown) {
      addToast({
        message: err instanceof Error ? err.message : "Error",
        variant: "error",
        title: "Error",
      });
    } finally {
      setRegenerarLoading(false);
    }
  };

  const handleCopy = () => {
    if (codigo) {
      navigator.clipboard.writeText(codigo);
      addToast({
        message: "Código copiado al portapapeles",
        variant: "success",
        title: "Copiado",
      });
    }
  };

  const esBloqueado = pago.codigoEntregaBloqueado;
  const intentos = pago.codigoEntregaIntentos ?? 0;
  const expirado = pago.codigoEntregaExpira
    ? new Date(pago.codigoEntregaExpira) < new Date()
    : false;

  return (
    <Card className="p-5 mt-6 border-info/20 bg-info/5">
      <div className="flex items-center gap-2 mb-3">
        <QrCode className="h-5 w-5 text-info" />
        <h3 className="font-semibold text-foreground">Código de confirmación</h3>
      </div>

      {expirado && (
        <div className="mb-3 flex items-center gap-2 text-sm text-warning">
          <Clock className="h-4 w-4" />
          <span>El código ha expirado. Regenera uno nuevo.</span>
        </div>
      )}

      {esBloqueado && (
        <div className="mb-3 flex items-center gap-2 text-sm text-destructive">
          <Lock className="h-4 w-4" />
          <span>Código bloqueado por demasiados intentos fallidos.</span>
        </div>
      )}

      {intentos > 0 && !esBloqueado && !expirado && (
        <div className="mb-2 text-xs text-muted-foreground">
          Intentos fallidos: {intentos} / 5
        </div>
      )}

      {show && codigo && (
        <div className="mb-3">
          <div className="flex justify-center my-2">
            <div className="bg-background border border-border rounded-lg px-4 py-3 font-mono text-3xl font-bold tracking-[0.3em] text-primary">
              {codigo}
            </div>
          </div>
          <div className="flex justify-center gap-2 text-xs text-muted-foreground">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Copy className="h-3 w-3" />
              Copiar
            </button>
          </div>
        </div>
      )}

      {show && !codigo && !loading && (
        <p className="text-sm text-muted-foreground mb-3">
          Haz clic para ver tu código de 6 dígitos.
        </p>
      )}

      <div className="flex gap-2">
        {!show ? (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setShow(true);
              await fetchCodigo();
            }}
            loading={loading}
            className="flex-1"
          >
            {loading ? "Cargando..." : codigo ? "Mostrar código" : "Ver código"}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShow(false)}
            className="flex-1"
          >
            Ocultar
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerar}
          loading={regenerarLoading}
          disabled={expirado || pago.codigoEntregaRegeneraciones >= 3}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {pago.codigoEntregaRegeneraciones > 0 && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Regeneraciones usadas: {pago.codigoEntregaRegeneraciones} / 3
        </p>
      )}
    </Card>
  );
}
