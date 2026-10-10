import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/auth";
import { listarUsuariosAdminAction } from "@/lib/actions";
import type { RolUsuarioAdmin } from "@/services/AdminUserService";

export const dynamic = "force-dynamic";

const roles: readonly RolUsuarioAdmin[] = [
  "ADMIN",
  "CLIENTE",
  "NEGOCIO",
  "LOGISTICA",
];
const estados = ["ACTIVO", "INACTIVO", "ELIMINADO", "TODOS"] as const;

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams?: Promise<{
    rol?: string;
    estado?: string;
    desde?: string;
    hasta?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.rol !== "ADMIN") redirect("/");

  const params = (await searchParams) ?? {};
  const rol = roles.find((value) => value === params.rol);
  const estado = estados.find((value) => value === params.estado) ?? "TODOS";
  const desde = params.desde || undefined;
  const hasta = params.hasta || undefined;
  const users = await listarUsuariosAdminAction({ rol, estado, desde, hasta });

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administración de usuarios</h1>
          <p className="mt-2 text-muted-foreground">
            {users.length} usuario{users.length === 1 ? "" : "s"} según los filtros
            seleccionados.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/usuarios/nuevo">Crear usuario</Link>
        </Button>
      </header>

      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-4"
      >
        <label className="flex flex-col gap-1 text-sm font-medium">
          Rol
          <select
            name="rol"
            defaultValue={rol ?? ""}
            className="h-10 rounded-md border border-border bg-background px-3"
          >
            <option value="">Todos</option>
            {roles.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Estado
          <select
            name="estado"
            defaultValue={estado}
            className="h-10 rounded-md border border-border bg-background px-3"
          >
            {estados.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Registrado desde
          <input
            type="date"
            name="desde"
            defaultValue={params.desde}
            className="h-10 rounded-md border border-border bg-background px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Registrado hasta
          <input
            type="date"
            name="hasta"
            defaultValue={params.hasta}
            className="h-10 rounded-md border border-border bg-background px-3"
          />
        </label>
        <Button type="submit" variant="secondary">Filtrar</Button>
        <Button asChild type="button" variant="ghost">
          <Link href="/admin/usuarios">Limpiar</Link>
        </Button>
      </form>

      <AdminUsersTable
        users={users}
        currentAdminId={session.user.id}
      />
    </main>
  );
}
