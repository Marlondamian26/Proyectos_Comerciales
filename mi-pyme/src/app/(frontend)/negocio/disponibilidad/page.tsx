import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { obtenerProductosDisponibilidadAction } from "@/lib/actions";
import { DashboardBackLink } from "@/components/DashboardBackLink";
import { LogoutButton } from "@/components/LogoutButton";
import { ProductosDisponibilidadEditor } from "./ProductosDisponibilidadEditor";

export const dynamic = "force-dynamic";

export default async function DisponibilidadPage() {
  const session = await auth();
  const userRol = session?.user?.rol as Rol | undefined;
  const productos = await obtenerProductosDisponibilidadAction();

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Disponibilidad Diaria
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Gestiona la disponibilidad de tus productos día a día
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DashboardBackLink />
              <LogoutButton />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
                <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
                {userRol ?? "NEGOCIO"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {productos.length === 0 ? (
          <p className="text-muted-foreground">
            Aún no tienes productos activos.
          </p>
        ) : (
          <ProductosDisponibilidadEditor productos={productos} />
        )}
      </div>
    </main>
  );
}
