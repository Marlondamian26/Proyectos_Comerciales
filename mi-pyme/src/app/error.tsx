"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-destructive/10">
          <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Algo salió mal</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Ocurrió un error inesperado. Por favor, inténtalo de nuevo.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="primary" onClick={reset} className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Reintentar
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/"} className="w-full sm:w-auto whitespace-nowrap">
            <Home className="h-4 w-4 mr-2" aria-hidden="true" />
            Volver al inicio
          </Button>
        </div>
      </div>
    </main>
  );
}