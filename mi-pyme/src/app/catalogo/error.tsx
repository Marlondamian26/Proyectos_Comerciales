"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CatalogoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CATALOGO ERROR]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <EmptyState
        title="Algo salió mal en el catálogo"
        message={
          error.digest
            ? `Si el problema persiste, contacta a soporte con el código: ${error.digest}`
            : "Intenta recargar la página."
        }
      />
      <Button onClick={reset} variant="outline">
        Reintentar
      </Button>
    </div>
  );
}
