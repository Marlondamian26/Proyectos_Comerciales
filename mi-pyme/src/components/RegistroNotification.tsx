"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, X } from "lucide-react";

function readRegistroExito(): boolean {
  try {
    return sessionStorage.getItem("registro_exito") === "true";
  } catch {
    return false;
  }
}

export function RegistroNotification() {
  const [visible, setVisible] = useState(() => readRegistroExito());
  const [exiting, setExiting] = useState(false);
  const timersRef = useRef<{ exit: ReturnType<typeof setTimeout>; remove: ReturnType<typeof setTimeout> } | null>(null);

  useEffect(() => {
    if (!visible) return;

    if (readRegistroExito()) {
      sessionStorage.removeItem("registro_exito");
    }

    const exitTimer = setTimeout(() => setExiting(true), 3500);
    const removeTimer = setTimeout(() => setVisible(false), 4000);
    timersRef.current = { exit: exitTimer, remove: removeTimer };

    const handler = () => {
      if (readRegistroExito()) {
        sessionStorage.removeItem("registro_exito");
        if (timersRef.current) {
          clearTimeout(timersRef.current.exit);
          clearTimeout(timersRef.current.remove);
        }
        setExiting(false);
        setVisible(true);
        timersRef.current = {
          exit: setTimeout(() => setExiting(true), 3500),
          remove: setTimeout(() => setVisible(false), 4000),
        };
      }
    };

    window.addEventListener("registro-exito", handler);
    return () => {
      window.removeEventListener("registro-exito", handler);
      if (timersRef.current) {
        clearTimeout(timersRef.current.exit);
        clearTimeout(timersRef.current.remove);
      }
    };
  }, [visible]);

  const dismiss = useCallback(() => {
    if (timersRef.current) {
      clearTimeout(timersRef.current.exit);
      clearTimeout(timersRef.current.remove);
      timersRef.current = null;
    }
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 z-50 -translate-x-1/2 transition-all duration-500 ${
        exiting ? "opacity-0 translate-y-[-20px] scale-95" : "opacity-100 translate-y-0 scale-100"
      }`}
      aria-live="polite"
    >
      <div className="flex items-center gap-3 bg-card border border-border rounded-full pl-5 pr-3 py-3 shadow-2xl">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/15">
          <CheckCircle className="h-4 w-4 text-success" />
        </div>
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          ¡Bienvenido a Mi-Pyme! Tu cuenta ha sido creada.
        </span>
        <button
          onClick={dismiss}
          className="ml-1 text-muted-foreground hover:text-foreground transition-colors rounded-full p-1"
          aria-label="Cerrar notificación"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
