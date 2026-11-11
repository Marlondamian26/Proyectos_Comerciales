import { auth } from "@/lib/auth";
import { HeroImageService } from "@/services/HeroImageService";
import { HeroImageManager } from "@/components/admin/HeroImageManager";

export default async function AdminHeroPage() {
  const session = await auth();

  if (!session || session.user?.rol !== "ADMIN") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">
          Acceso denegado
        </h1>
        <p className="text-muted-foreground">
          Solo los administradores pueden gestionar las imágenes del hero.
        </p>
      </div>
    );
  }

  const service = new HeroImageService();
  const images = await service.listarTodas();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Imágenes del Hero
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestiona las imágenes del carrusel del hero en la página de inicio.
        </p>
      </div>

      <HeroImageManager initialImages={images} />
    </div>
  );
}
