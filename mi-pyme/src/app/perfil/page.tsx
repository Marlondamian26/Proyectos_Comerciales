"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  User,
  Mail,
  MapPin,
  Lock,
  Save,
  Eye,
  EyeOff,
  Camera,
  Calendar,
  Hash,
  Trash2,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { DashboardBackLink } from "@/components/DashboardBackLink";

type ProfileData = {
  id: string;
  nombre: string;
  username?: string;
  email: string;
  rol: string;
  provincia?: string;
  municipio?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
  isGenericAdmin?: boolean;
};

type ToastState = {
  message: string;
  variant: "success" | "error" | "info";
} | null;

const ROLES: Record<string, { label: string; color: string }> = {
  CLIENTE: { label: "Cliente", color: "bg-primary/10 text-primary" },
  NEGOCIO: { label: "Negocio", color: "bg-secondary/10 text-secondary" },
  LOGISTICA: { label: "Logística", color: "bg-accent/10 text-accent" },
  ADMIN: { label: "Administrador", color: "bg-violet/10 text-violet" },
};

export default function PerfilPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const [nombre, setNombre] = useState("");
  const [provincia, setProvincia] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [email] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNuevo, setPasswordNuevo] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showActual, setShowActual] = useState(false);
  const [showNuevo, setShowNuevo] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteAdminPassword, setDeleteAdminPassword] = useState("");
  const [deleteGenericPassword, setDeleteGenericPassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [showDeleteAdminPassword, setShowDeleteAdminPassword] = useState(false);
  const [showDeleteGenericPassword, setShowDeleteGenericPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await fetch("/api/perfil");
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Error desconocido" }));
          if (res.status === 401) {
            setError("No autorizado");
            return;
          }
          throw new Error(data.error || `Error ${res.status}: No se pudo cargar el perfil`);
        }
        const data = await res.json();
        if (!cancelled) {
          setProfile(data);
          setNombre(data.nombre || "");
          setProvincia(data.provincia || "");
          setMunicipio(data.municipio || "");
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "No se pudo cargar el perfil";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setToast(null);

    try {
      const res = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre || undefined,
          provincia: provincia || undefined,
          municipio: municipio || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar perfil");
      }

      const updated = await res.json();
      setProfile(updated);
      setToast({ message: "Perfil actualizado correctamente", variant: "success" });
    } catch {
      setError("No se pudo actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (passwordNuevo.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (passwordNuevo !== passwordConfirm) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    setSaving(true);
    setToast(null);

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
        const data = await res.json();
        throw new Error(data.error || "Error al cambiar contraseña");
      }

      setToast({ message: "Contraseña cambiada correctamente", variant: "success" });
      setShowPasswordForm(false);
      setPasswordActual("");
      setPasswordNuevo("");
      setPasswordConfirm("");
    } catch {
      setToast({ message: "No se pudo cambiar la contraseña", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const isLastAdmin = profile?.rol === "ADMIN" && !profile?.isGenericAdmin;

  const openDeleteModal = () => {
    setDeleteError("");
    setDeletePassword("");
    setDeleteAdminPassword("");
    setDeleteGenericPassword("");
    setConfirmDelete(false);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletePassword("");
    setDeleteAdminPassword("");
    setDeleteGenericPassword("");
    setConfirmDelete(false);
    setDeleteError("");
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError("");

    if (!confirmDelete) {
      setDeleteError("Debes confirmar que deseas eliminar tu cuenta");
      return;
    }

    if (isLastAdmin) {
      if (!deleteAdminPassword || !deleteGenericPassword) {
        setDeleteError("Debes ingresar ambas contraseñas");
        return;
      }
    } else {
      if (!deletePassword) {
        setDeleteError("Debes ingresar tu contraseña");
        return;
      }
    }

    setIsDeleting(true);

    try {
      const body: Record<string, string> = { userId: profile!.id };

      if (isLastAdmin) {
        body.adminPassword = deleteAdminPassword;
        body.genericAdminPassword = deleteGenericPassword;
      } else {
        body.password = deletePassword;
      }

      const res = await fetch("/api/users/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar la cuenta");
      }

      setToast({ message: "Cuenta eliminada correctamente", variant: "success" });
      closeDeleteModal();

      // Redirect to home after a short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo eliminar la cuenta";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto py-12 px-6">
        <div className="flex items-center justify-center h-64">
          <Loading size="lg" />
        </div>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="max-w-3xl mx-auto py-12 px-6">
        <ErrorState title="Error" message={error} onRetry={() => window.location.reload()} />
      </main>
    );
  }

  const rolInfo = profile ? ROLES[profile.rol] ?? { label: profile.rol, color: "bg-muted text-muted-foreground" } : null;

  return (
    <main className="max-w-3xl mx-auto py-12 px-6">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <DashboardBackLink />
        </div>
        <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y seguridad
        </p>
      </header>

      {toast && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm font-medium ${
            toast.variant === "success"
              ? "bg-success/10 text-success border-success/20"
              : toast.variant === "error"
              ? "bg-destructive/10 text-destructive border-destructive/20"
              : "bg-primary/10 text-primary border-primary/20"
          }`}
          role="alert"
        >
          {toast.message}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Información personal</h2>
              <p className="text-sm text-muted-foreground">
                Actualiza tu nombre y datos de ubicación
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {profile?.image ? (
                  <img src={profile.image} alt={profile.nombre || "Avatar"} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors"
                aria-label="Cambiar foto de perfil"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{profile?.nombre || "Sin nombre"}</p>
              <p className="text-xs text-muted-foreground">@{profile?.username || "usuario"}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
              {rolInfo && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${rolInfo.color}`}>
                  {rolInfo.label}
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Nombre completo"
              type="text"
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              leftIcon={<User className="h-4 w-4" />}
            />

            <Input
              label="Email"
              type="email"
              value={email}
              disabled
              leftIcon={<Mail className="h-4 w-4" />}
              hint="El email no se puede modificar"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Provincia"
                type="text"
                placeholder="Ej: Buenos Aires"
                value={provincia}
                onChange={(e) => setProvincia(e.target.value)}
                leftIcon={<MapPin className="h-4 w-4" />}
              />
              <Input
                label="Municipio"
                type="text"
                placeholder="Ej: La Plata"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                leftIcon={<MapPin className="h-4 w-4" />}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="min-w-[160px]">
                {saving ? (
                  <>
                    <Loading size="sm" className="mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Datos de cuenta</h2>
              <p className="text-sm text-muted-foreground">
                Información adicional de tu cuenta
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">ID de usuario</p>
              <p className="text-sm font-mono">{profile?.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Rol</p>
              <p className="text-sm">{rolInfo?.label ?? profile?.rol}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Fecha de registro</p>
              <p className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("es-ES") : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Última actualización</p>
              <p className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString("es-ES") : "—"}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Seguridad</h2>
                <p className="text-sm text-muted-foreground">
                  Cambia tu contraseña de acceso
                </p>
              </div>
            </div>
            {!showPasswordForm && (
              <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
                Cambiar contraseña
              </Button>
            )}
          </div>

          {showPasswordForm && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Contraseña actual"
                type={showActual ? "text" : "password"}
                placeholder="Tu contraseña actual"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
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
                required
              />

              <Input
                label="Nueva contraseña"
                type={showNuevo ? "text" : "password"}
                placeholder="Minimo 8 caracteres"
                value={passwordNuevo}
                onChange={(e) => setPasswordNuevo(e.target.value)}
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
                required
              />

              <Input
                label="Confirmar nueva contraseña"
                type={showConfirm ? "text" : "password"}
                placeholder="Repite la nueva contraseña"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
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
                error={passwordError}
                required
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordActual("");
                    setPasswordNuevo("");
                    setPasswordConfirm("");
                    setPasswordError("");
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Actualizando..." : "Cambiar contraseña"}
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Delete Account Card */}
        <Card className="border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Eliminar cuenta</h2>
              <p className="text-sm text-muted-foreground">
                Elimina permanentemente tu cuenta y todos tus datos
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Esta acción es <strong>irreversible</strong>. Se eliminarán:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Tu perfil y datos personales</li>
              <li>Tu historial de pedidos y reservas</li>
              <li>Tus facturas y comprobantes</li>
              <li>Tu carrito y preferencias</li>
            </ul>
            {isLastAdmin && (
              <div className="p-3 rounded-lg bg-yellow/10 border border-yellow/30 text-yellow-foreground">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Eres el único administrador activo.</span>
                </div>
                <p className="mt-1 text-sm">
                  Para eliminar tu cuenta, deberás ingresar tu contraseña de administrador y la contraseña genérica del sistema.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <Button
              variant="destructive"
              onClick={openDeleteModal}
              className="min-w-[160px]"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar mi cuenta
            </Button>
          </div>
        </Card>
      </div>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        title="Eliminar cuenta"
        description={isLastAdmin
          ? "Eres el último administrador. Debes confirmar con tu contraseña de administrador y la contraseña genérica del sistema."
          : "Esta acción es irreversible. Ingresa tu contraseña para confirmar."}
        size="md"
        closeOnOverlayClick={!isDeleting}
        closeOnEscape={!isDeleting}
        showCloseButton={!isDeleting}
      >
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          {!isLastAdmin && (
            <Input
              label="Tu contraseña"
              type={showDeletePassword ? "text" : "password"}
              placeholder="Ingresa tu contraseña actual"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showDeletePassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
              disabled={isDeleting}
            />
          )}

          {isLastAdmin && (
            <div className="space-y-4">
              <Input
                label="Contraseña de administrador"
                type={showDeleteAdminPassword ? "text" : "password"}
                placeholder="Tu contraseña de administrador actual"
                value={deleteAdminPassword}
                onChange={(e) => setDeleteAdminPassword(e.target.value)}
                leftIcon={<Shield className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowDeleteAdminPassword(!showDeleteAdminPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showDeleteAdminPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showDeleteAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                required
                disabled={isDeleting}
              />
              <Input
                label="Contraseña genérica del sistema"
                type={showDeleteGenericPassword ? "text" : "password"}
                placeholder="Contraseña genérica (12345678 por defecto)"
                value={deleteGenericPassword}
                onChange={(e) => setDeleteGenericPassword(e.target.value)}
                leftIcon={<Shield className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowDeleteGenericPassword(!showDeleteGenericPassword)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showDeleteGenericPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showDeleteGenericPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                required
                disabled={isDeleting}
              />
            </div>
          )}

          {deleteError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {deleteError}
            </div>
          )}

          <div className="flex items-start gap-2">
            <Checkbox
              id="confirmDelete"
              checked={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.checked)}
              disabled={isDeleting}
            />
            <label htmlFor="confirmDelete" className="text-sm text-muted-foreground mt-1">
              Entiendo que esta acción es irreversible y deseo eliminar mi cuenta permanentemente
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeDeleteModal}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={isDeleting || !confirmDelete}>
              {isDeleting ? (
                <>
                  <Loading size="sm" className="mr-2" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar cuenta
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
