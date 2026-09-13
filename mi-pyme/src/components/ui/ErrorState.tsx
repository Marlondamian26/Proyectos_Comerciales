"use client";

import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { AlertCircle, AlertTriangle, Info, RefreshCw, Home } from "lucide-react";
import React from "react";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  variant?: "error" | "warning" | "info";
  onRetry?: () => void;
  retryLabel?: string;
  onGoHome?: () => void;
  className?: string;
}

const variantIcons = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const variantClasses = {
  error: "text-destructive bg-destructive/10 border-destructive/20",
  warning: "text-warning bg-warning/10 border-warning/20",
  info: "text-primary bg-primary/10 border-primary/20",
};

export function ErrorState({
  title = "Ha ocurrido un error",
  message = "No se pudo completar la operación. Inténtalo de nuevo más tarde.",
  variant = "error",
  onRetry,
  retryLabel = "Reintentar",
  onGoHome,
  className,
}: ErrorStateProps) {
  const Icon = variantIcons[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 p-8 text-center rounded-2xl border max-w-md mx-auto",
        variantClasses[variant],
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-current/10">
        <Icon className="h-8 w-8" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2">{message}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        {onRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            {retryLabel}
          </Button>
        )}
        {onGoHome && (
          <Button
            variant="outline"
            onClick={onGoHome}
            className="w-full sm:w-auto whitespace-nowrap"
          >
            <Home className="h-4 w-4 mr-2" aria-hidden="true" />
            Volver al inicio
          </Button>
        )}
      </div>
    </div>
  );
}

ErrorState.displayName = "ErrorState";

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorState
          title="Error inesperado"
          message={
            this.state.error?.message || "Algo salió mal. Por favor, recarga la página."
          }
          onRetry={() => window.location.reload()}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorState;
