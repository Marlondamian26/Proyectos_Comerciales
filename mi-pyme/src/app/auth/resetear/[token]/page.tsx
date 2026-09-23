"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { ThemeToggle } from "@/components/ThemeToggle";
import { validarPassword } from "@/lib/auth/password-policy";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

export default function ResetearPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordValidation = password ? validarPassword(password) : null;

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await fetch("/api/auth/resetear/validar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resolvedParams.token }),
        });
        const data = await res.json();
        setTokenValid(data.valid);
      } catch {
        setTokenValid(false);
      } finally {
        setValidating(false);
      }
    };
    validateToken();
  }, [resolvedParams.token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden");
      return;
    }

    const validation = validarPassword(password);
    if (!validation.valida) {
      setError(validation.errores.join("; "));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/resetear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resolvedParams.token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al restablecer la contrasena");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Error al restablecer la contrasena");
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 animate-gradient" />
        <div className="w-full max-w-md relative z-10">
          <div className="mb-4 flex justify-end">
            <ThemeToggle />
          </div>
          <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border p-8 shadow-xl flex flex-col items-center justify-center">
            <Loading size="lg" />
            <p className="text-sm text-muted-foreground mt-4">Validando token...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-background to-destructive/5" />
        <div className="w-full max-w-md relative z-10 animate-fade-in-up">
          <div className="mb-4 flex justify-end">
            <ThemeToggle />
          </div>
          <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border p-8 shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Token invalido o expirado</h2>
            <p className="text-sm text-muted-foreground mb-6">
              El enlace de recuperacion no es valido o ha expirado. Por favor, solicita uno nuevo.
            </p>
            <Link href="/auth/recuperar">
              <Button className="w-full">Solicitar nuevo enlace</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-background to-success/5" />
        <div className="w-full max-w-md relative z-10 text-center animate-scale-in">
          <div className="mb-4 flex justify-end">
            <ThemeToggle />
          </div>
          <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border p-8 shadow-xl">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold mb-2">Contrasena actualizada</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Tu contrasena ha sido restablecida correctamente. Ahora puedes iniciar sesion.
            </p>
            <Link href="/auth/login">
              <Button className="w-full">Iniciar Sesion</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-gradient {
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
      `}</style>

      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-background to-primary/5 animate-gradient" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border p-8 shadow-xl">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Nueva contrasena</h2>
              <p className="text-muted-foreground mt-2">Ingresa tu nueva contrasena</p>
            </div>
            <ThemeToggle />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Nueva contrasena
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimo 10 caracteres, una letra y un numero"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby="password-requirements"
                  className="flex h-11 w-full rounded-lg border border-input bg-background pl-10 pr-10 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordValidation && passwordValidation.valida && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6].map((level) => (
                      <div
                        key={level}
                        className="h-1 flex-1 rounded-full bg-success transition-all duration-300"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-success">
                    Contraseña válida
                  </p>
                </div>
              )}
              {passwordValidation && !passwordValidation.valida && (
                <ul id="password-requirements" className="text-xs text-muted-foreground space-y-0.5">
                  {passwordValidation.errores.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirmar contrasena
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repite la contrasena"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex h-11 w-full rounded-lg border border-input bg-background pl-10 pr-10 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium shadow-lg shadow-secondary/25 hover:shadow-xl hover:shadow-secondary/30 transition-all"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loading size="sm" />
                  Actualizando...
                </span>
              ) : (
                "Restablecer contrasena"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-hover font-medium transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio de sesion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
