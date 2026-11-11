import { PreferenciasForm } from "@/components/notificaciones/PreferenciasForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Preferencias de notificaciones - Mi-Pyme",
  description: "Configura cómo deseas recibir notificaciones",
};

export default function PreferenciasPage() {
  return (
    <main className="container mx-auto py-6 px-4">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/notificaciones"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Volver a mis notificaciones"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Preferencias de notificaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configura cómo deseas recibir cada tipo de notificación.
          </p>
        </div>
      </div>

      <PreferenciasForm />
    </main>
  );
}
