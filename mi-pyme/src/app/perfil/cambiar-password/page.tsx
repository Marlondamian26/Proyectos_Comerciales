"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { validarPassword } from "@/lib/auth/password-policy";

export default function CambiarPasswordPage() {
  const router = useRouter();
  const { data: session, status } = useSession({ required: false });
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNuevo, setPasswordNuevo] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showActual, setShowActual] = useState(false);
  const [showNuevo, setShowNuevo] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordValidation = passwordNuevo ? validarPassword(passwordNuevo) : null;

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.replace("/auth/login");
      return;
    }

    if (!session.user.mustChangePassword) {
      router.replace("/perfil");
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordActual) {
      setError("Debes ingresar tu contraseña actual");
      return;
    }

    if (passwordNuevo !== passwordConfirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    const validation = validarPassword(passwordNuevo);
    if (!validation.valida) {
      setError(validation.errores.join("; "));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/perfil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passwordActual,
          passwordNuevo,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(data.error || "Error al cambiar la contraseña");
      }

      await router.replace("/auth/login?message=password-changed");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || !session?.user) {
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl border border-border p-8 shadow-theme-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-warning/10 text-warning">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Debes cambiar tu contraseña
              </h1>
            </div>
          </div>

          <p
            id="cambiar-password-description"
            className="text-sm text-muted-foreground mb-6"
          >
            Por seguridad, debes establecer una nueva contraseña antes de
            continuar.
          </p>

          {error && (
            <div
              id="cambiar-password-error"
              className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-center gap-2"
              role="alert"
              aria-live="polite"
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" aria-describedby="cambiar-password-description">
            <Input
              label="Contraseña actual"
              type={showActual ? "text" : "password"}
              placeholder="Tu contraseña actual"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              autoComplete="current-password"
              required
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowActual(!showActual)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showActual ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showActual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <Input
              label="Nueva contraseña"
              type={showNuevo ? "text" : "password"}
              placeholder="Mínimo 10 caracteres, letra y número"
              value={passwordNuevo}
              onChange={(e) => setPasswordNuevo(e.target.value)}
              autoComplete="new-password"
              required
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowNuevo(!showNuevo)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showNuevo ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showNuevo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              hint={
                passwordValidation && passwordValidation.valida
                  ? "Contraseña válida"
                  : passwordNuevo.length > 0
                    ? "Requisitos: 10+ caracteres, letra, número, no común"
                    : "Mínimo 10 caracteres, una letra y un número"
              }
            />
            {passwordValidation && !passwordValidation.valida && (
              <ul id="password-requirements" className="text-xs text-muted-foreground space-y-0.5">
                {passwordValidation.errores.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            )}

            <Input
              label="Confirmar nueva contraseña"
              type={showConfirm ? "text" : "password"}
              placeholder="Repite la nueva contraseña"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
              required
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
              disabled={loading}
              aria-disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Cambiando...
                </span>
              ) : (
                "Cambiar contraseña y cerrar sesión"
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
