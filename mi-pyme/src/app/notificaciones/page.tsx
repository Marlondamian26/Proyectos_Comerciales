import { NotificacionList } from "@/components/notificaciones/NotificacionList";
import { Suspense } from "react";

export const metadata = {
  title: "Mis notificaciones - Mi-Pyme",
  description: "Administra tus notificaciones",
};

export default function NotificacionesPage() {
  return (
    <main className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mis notificaciones</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administra y visualiza todas tus notificaciones.
        </p>
      </div>

      <Suspense fallback={<div>Cargando...</div>}>
        <NotificacionList />
      </Suspense>
    </main>
  );
}
