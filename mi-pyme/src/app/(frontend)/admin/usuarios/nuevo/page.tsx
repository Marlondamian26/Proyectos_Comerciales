import Link from "next/link";
import { CrearUsuarioForm } from "@/components/admin/CrearUsuarioForm";
import { Button } from "@/components/ui/Button";
import { listarAreas } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function NuevoUsuarioAdminPage() {
  const areas = await listarAreas();

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/admin/usuarios">Volver a usuarios</Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Crear usuario</h1>
        <p className="mt-2 text-muted-foreground">
          El alta de perfiles NEGOCIO y LOGISTICA crea también el perfil operativo correspondiente.
        </p>
      </header>
      <CrearUsuarioForm areas={areas.map(({ id, nombre }) => ({ id, nombre }))} />
    </main>
  );
}
