import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import cloudinary from "@/lib/cloudinary";

export interface HeroImageData {
  id: string;
  url: string;
  publicId: string | null;
  alt: string;
  orden: number;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class HeroImageService extends Service {
  async listarActivas(): Promise<HeroImageData[]> {
    return prisma.heroImage.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
    });
  }

  async listarTodas(): Promise<HeroImageData[]> {
    return prisma.heroImage.findMany({
      orderBy: { orden: "asc" },
    });
  }

  async crear(datos: {
    url: string;
    publicId?: string | null;
    alt?: string;
    orden?: number;
  }): Promise<HeroImageData> {
    return prisma.heroImage.create({
      data: {
        url: datos.url,
        publicId: datos.publicId ?? null,
        alt: datos.alt ?? "Imagen del hero",
        orden: datos.orden ?? 0,
      },
    });
  }

  async actualizar(
    id: string,
    datos: Partial<{ url: string; publicId: string | null; alt: string; orden: number; activa: boolean }>
  ): Promise<HeroImageData> {
    return prisma.heroImage.update({
      where: { id },
      data: datos,
    });
  }

  async eliminar(id: string): Promise<void> {
    const imagen = await prisma.heroImage.findUnique({
      where: { id },
    });
    if (imagen?.publicId) {
      // Intentar eliminar de Cloudinary si tiene publicId
      try {
        await cloudinary.uploader.destroy(imagen.publicId, {
          resource_type: "image",
          invalidate: true,
        });
      } catch {
        // Ignorar errores de Cloudinary, continuar con eliminación en BD
      }
    }
    await prisma.heroImage.delete({
      where: { id },
    });
  }

  async reordenar(ids: string[]): Promise<void> {
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.heroImage.update({
          where: { id },
          data: { orden: index },
        })
      )
    );
  }
}
