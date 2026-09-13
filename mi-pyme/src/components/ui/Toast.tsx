"use client";

import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useEffect } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose?: () => void;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

const toastIcons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 flex-shrink-0" />,
  error: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 flex-shrink-0" />,
  info: <Info className="h-5 w-5 flex-shrink-0" />,
};

const toastClasses: Record<ToastVariant, string> = {
  success: "bg-success/10 text-success border-success/20",
  error: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  info: "bg-info/10 text-info border-info/20",
};

export function Toast({
  message,
  variant = "info",
  duration = 4000,
  onClose,
  className,
  title,
  action,
}: ToastProps) {
  useEffect(() => {
    if (!onClose || !duration) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3.5 shadow-theme-lg",
        "animate-slide-down",
        toastClasses[variant],
        className
      )}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      {toastIcons[variant]}
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold text-foreground">{title}</p>
        )}
        <p className="text-sm leading-relaxed">{message}</p>
        {action && (
          <div className="mt-2">
            {action}
          </div>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={cn(
            "flex-shrink-0 text-current hover:opacity-70 transition-opacity rounded-full p-0.5",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

Toast.displayName = "Toast";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  title?: string;
  duration?: number;
  action?: React.ReactNode;
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className="fixed top-4 right-4 z-[var(--z-toast)] flex flex-col gap-3 max-w-sm w-full"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Notificaciones"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          title={toast.title}
          duration={toast.duration}
          action={toast.action}
          onClose={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}

ToastContainer.displayName = "ToastContainer";

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (toast: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    return id;
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = (message: string, options?: Partial<ToastItem>) =>
    addToast({ message, variant: "success", ...options });

  const error = (message: string, options?: Partial<ToastItem>) =>
    addToast({ message, variant: "error", ...options });

  const warning = (message: string, options?: Partial<ToastItem>) =>
    addToast({ message, variant: "warning", ...options });

  const info = (message: string, options?: Partial<ToastItem>) =>
    addToast({ message, variant: "info", ...options });

  return {
    toasts,
    addToast,
    dismissToast,
    success,
    error,
    warning,
    info,
  };
}

import { useState } from "react";