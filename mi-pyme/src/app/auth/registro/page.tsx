"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { DashboardBackLink } from "@/components/DashboardBackLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { validarPassword } from "@/lib/auth/password-policy";
import {
  User,
  Eye,
  EyeOff,
  Mail,
  Lock,
  MapPin,
  AlertCircle,
  Hash,
} from "lucide-react";

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 10) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Debil", color: "bg-destructive" };
  if (score <= 3) return { score, label: "Media", color: "bg-warning" };
  return { score, label: "Fuerte", color: "bg-success" };
}

export default function RegistroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/cliente";
  const intentRaw = searchParams.get("intent");
  const [intent, _setIntent] = useState<{ action: string; [key: string]: string } | null>(() => {
    if (!intentRaw) return null;
    try {
      return JSON.parse(intentRaw);
    } catch {
      return null;
    }
  });

  const [form, setForm] = useState({
    nombre: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    provincia: "",
    municipio: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordValidation = form.password ? validarPassword(form.password) : null;
  const strength = form.password ? getPasswordStrength(form.password) : null;

  useEffect(() => {
    if (apiError) {
      const timer = setTimeout(() => setApiError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [apiError]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";

    if (!form.username.trim()) newErrors.username = "El nombre de usuario es obligatorio";
    else if (form.username.trim().length < 3) newErrors.username = "El nombre de usuario debe tener al menos 3 caracteres";
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) newErrors.username = "Solo letras, numeros y guiones bajos";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) newErrors.email = "Email invalido";

    if (form.password && passwordValidation) {
      if (!passwordValidation.valida) {
        newErrors.password = passwordValidation.errores.join("; ");
      }
    } else {
      newErrors.password = "La contrasena es obligatoria";
    }

    if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Las contrasenas no coinciden";

    if (!form.provincia.trim()) newErrors.provincia = "La provincia es obligatoria";

    if (!form.municipio.trim()) newErrors.municipio = "El municipio es obligatorio";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError("");

    try {
      const response = await fetch("/api/auth/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (result.success) {
        sessionStorage.setItem("registro_exito", "true");

        if (intent) {
          const intentAction = intent.action;
          if (intentAction === "carrito") {
            router.push("/carrito");
          } else if (intentAction === "reserva") {
            router.push(`/reservas?servicioId=${intent.servicioId || ""}`);
          } else if (intentAction === "pedido") {
            router.push("/carrito");
          } else {
            router.push(callbackUrl);
          }
        } else {
          router.push("/cliente");
        }
      } else {
        setApiError(result.error || "Error al registrar usuario");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Registration client error:", errorMessage, err);
      setApiError(errorMessage || "Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 8s ease infinite;
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
      `}</style>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-gradient-to-br from-secondary via-secondary/90 to-primary animate-gradient items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        </div>
        <div className="relative z-10 max-w-lg text-white animate-fade-in-up">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-4">Unete</h1>
            <p className="text-xl text-white/80 font-light leading-relaxed">
              Crea tu cuenta y comienza a disfrutar de todos los beneficios de Mi-Pyme.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Mi-Pyme</h1>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Crea tu cuenta</h2>
                <p className="text-muted-foreground mt-2">Completa el formulario para registrarte</p>
              </div>
              <ThemeToggle />
            </div>

            {/* Volver al inicio button */}
            <div className="mb-6">
              <DashboardBackLink />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {apiError && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="nombre" className="text-sm font-medium text-foreground">
                  Nombre completo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="nombre"
                    type="text"
                    placeholder="Juan Perez"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className={`flex h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all ${errors.nombre ? "border-destructive focus-visible:ring-destructive" : "border-input"}`}
                  />
                </div>
                {errors.nombre && <p className="text-sm text-destructive" role="alert">{errors.nombre}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-foreground">
                  Nombre de usuario
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Hash className="h-4 w-4" />
                  </span>
                  <input
                    id="username"
                    type="text"
                    placeholder="juanperez123"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className={`flex h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all ${errors.username ? "border-destructive focus-visible:ring-destructive" : "border-input"}`}
                  />
                </div>
                {errors.username && <p className="text-sm text-destructive" role="alert">{errors.username}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    placeholder="tu@ejemplo.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`flex h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all ${errors.email ? "border-destructive focus-visible:ring-destructive" : "border-input"}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive" role="alert">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contrasena
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimo 10 caracteres"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    aria-describedby="password-requirements"
                    className={`flex h-11 w-full rounded-lg border bg-background pl-10 pr-10 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all ${errors.password ? "border-destructive focus-visible:ring-destructive" : "border-input"}`}
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
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength ? (level <= strength.score ? strength.color : "bg-muted") : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Fortaleza: <span className="font-medium text-foreground">{strength?.label}</span>
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
                {errors.password && <p className="text-sm text-destructive" role="alert">{errors.password}</p>}
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
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className={`flex h-11 w-full rounded-lg border bg-background pl-10 pr-10 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all ${errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : "border-input"}`}
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
                {errors.confirmPassword && <p className="text-sm text-destructive" role="alert">{errors.confirmPassword}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="provincia" className="text-sm font-medium text-foreground">
                    Provincia
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <input
                      id="provincia"
                      type="text"
                      placeholder="Buenos Aires"
                      value={form.provincia}
                      onChange={(e) => setForm({ ...form, provincia: e.target.value })}
                      className={`flex h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all ${errors.provincia ? "border-destructive focus-visible:ring-destructive" : "border-input"}`}
                    />
                  </div>
                  {errors.provincia && <p className="text-sm text-destructive" role="alert">{errors.provincia}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="municipio" className="text-sm font-medium text-foreground">
                    Municipio
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <input
                      id="municipio"
                      type="text"
                      placeholder="La Plata"
                      value={form.municipio}
                      onChange={(e) => setForm({ ...form, municipio: e.target.value })}
                      className={`flex h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all ${errors.municipio ? "border-destructive focus-visible:ring-destructive" : "border-input"}`}
                    />
                  </div>
                  {errors.municipio && <p className="text-sm text-destructive" role="alert">{errors.municipio}</p>}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium shadow-lg shadow-secondary/25 hover:shadow-xl hover:shadow-secondary/30 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loading size="sm" />
                    Creando cuenta...
                  </span>
                ) : (
                  "Registrar"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Ya tienes cuenta?{" "}
              <Link href="/auth/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
                Inicia sesion
              </Link>
            </p>

            <div className="mt-6 rounded-lg border border-dashed border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">
                ¿Tienes un negocio?
              </p>
              <Link
                href="/negocios/solicitar"
                className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >
                Solicita unirte a Mi-Pyme
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
