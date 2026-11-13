import { HomeSectionBackgroundService } from "@/services/HomeSectionBackgroundService";
import { HomeBackgroundsManager } from "@/components/admin/HomeBackgroundsManager";

export default async function HomeBackgroundsPage() {
  const service = new HomeSectionBackgroundService();
  const backgrounds = await service.listarTodas();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Fondos de secciones del Home</h1>
      <p className="text-muted-foreground mb-6">
        Configura las imágenes de fondo para cada sección del home. Puedes usar
        las imágenes subidas por los negocios o subir nuevas.
      </p>
      <HomeBackgroundsManager initialBackgrounds={backgrounds} />
    </div>
  );
}
