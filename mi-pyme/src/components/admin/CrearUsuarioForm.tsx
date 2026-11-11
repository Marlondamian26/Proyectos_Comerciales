"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { crearUsuarioAdminAction } from "@/lib/actions";
import type { CrearUsuarioAdminInput, RolUsuarioAdmin } from "@/services/AdminUserService";

interface AreaOption {
  id: string;
  nombre: string;
}

const inputClassName =
  "min-h-[44px] w-full rounded-md border border-border bg-background px-3 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

export function CrearUsuarioForm({ areas }: { areas: AreaOption[] }) {
  const router = useRouter();
  const [rol, setRol] = useState<RolUsuarioAdmin>("CLIENTE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();

    const input: CrearUsuarioAdminInput = {
      nombre: value("nombre"),
      email: value("email"),
      username: value("username") || undefined,
      password: value("password"),
      rol,
      confirmarCrearAdmin: rol === "ADMIN" && form.get("confirmarCrearAdmin") === "on",
      forzarCambioPassword: form.get("forzarCambioPassword") === "on",
    };
    if (rol === "NEGOCIO") {
      input.negocio = {
        nombre: value("nombreNegocio"),
        descripcion: value("descripcionNegocio") || undefined,
        areaId: value("areaId") || undefined,
        provincia: value("provincia") || undefined,
        municipio: value("municipio") || undefined,
        telefono: value("telefonoNegocio") || undefined,
        emailContacto: value("emailContacto") || undefined,
        direccion: value("direccion") || undefined,
      };
    } else if (rol === "LOGISTICA") {
      input.logistica = {
        nombre: value("nombreProveedor"),
        zonaCobertura: value("zonaCobertura") || undefined,
        alcanceNacional: form.get("alcanceNacional") === "on",
        contacto: value("contacto"),
      };
    }

    try {
      const result = await crearUsuarioAdminAction(input);
      setSuccess(`Se creó la cuenta de ${result.user.email}.`);
      router.refresh();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "No se pudo crear el usuario.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="rounded-md border border-success/20 bg-success/10 p-3 text-base text-success">{success}</p>}

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          Nombre completo
          <input name="nombre" required minLength={2} autoComplete="name" className={inputClassName} />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Email
          <input name="email" type="email" required autoComplete="email" className={inputClassName} />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Nombre de usuario (opcional)
          <input name="username" minLength={3} pattern="[a-zA-Z0-9_]+" autoComplete="username" className={inputClassName} />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Rol
          <select
            value={rol}
            onChange={(event) => {
              const selectedRole = (
                ["CLIENTE", "NEGOCIO", "LOGISTICA", "ADMIN"] as const
              ).find((candidate) => candidate === event.currentTarget.value);
              if (selectedRole) setRol(selectedRole);
            }}
            className={inputClassName}
          >
            <option value="CLIENTE">CLIENTE</option>
            <option value="NEGOCIO">NEGOCIO</option>
            <option value="LOGISTICA">LOGISTICA</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium sm:col-span-2">
          Contraseña inicial
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className={inputClassName}
            aria-describedby="password-guidance"
          />
          <span id="password-guidance" className="block text-xs font-normal text-muted-foreground">
            Debe cumplir la política de seguridad: longitud mínima y al menos una letra y un número.
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="forzarCambioPassword" defaultChecked />
          Solicitar cambio de contraseña en el próximo inicio de sesión
        </label>
        {rol === "ADMIN" && (
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="confirmarCrearAdmin" required />
            Confirmo la creación de una cuenta con privilegios de administrador
          </label>
        )}
      </section>

      {rol === "NEGOCIO" && (
        <fieldset className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
          <legend className="px-2 font-semibold">Perfil del negocio</legend>
          <label className="space-y-1 text-sm font-medium">
            Nombre del negocio
            <input name="nombreNegocio" required className="form-input w-full" />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Área
            <select name="areaId" defaultValue="" className={inputClassName}>
              <option value="">Sin área</option>
              {areas.map((area) => <option key={area.id} value={area.id}>{area.nombre}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium sm:col-span-2">
            Descripción
            <textarea name="descripcionNegocio" rows={3} className={`${inputClassName} min-h-[88px]`} />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Provincia
            <input name="provincia" className={inputClassName} />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Municipio
            <input name="municipio" className={inputClassName} />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Teléfono
            <input name="telefonoNegocio" type="tel" className={inputClassName} />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Email de contacto
            <input name="emailContacto" type="email" className={inputClassName} />
          </label>
          <label className="space-y-1 text-sm font-medium sm:col-span-2">
            Dirección
            <input name="direccion" className={inputClassName} />
          </label>
        </fieldset>
      )}

      {rol === "LOGISTICA" && (
        <fieldset className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
          <legend className="px-2 font-semibold">Perfil logístico</legend>
          <label className="space-y-1 text-sm font-medium">
            Nombre del proveedor
            <input name="nombreProveedor" required className={inputClassName} />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Contacto
            <input name="contacto" required className={inputClassName} />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="alcanceNacional" />
            Cobertura nacional
          </label>
          <label className="space-y-1 text-sm font-medium sm:col-span-2">
            Zona de cobertura (requerida si no es nacional)
            <input name="zonaCobertura" className={inputClassName} />
          </label>
        </fieldset>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={loading}>Crear usuario</Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/usuarios")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
