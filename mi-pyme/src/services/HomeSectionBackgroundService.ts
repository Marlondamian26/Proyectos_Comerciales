import { Service } from "./Service";
import prisma from "@/lib/db/prisma";

export interface HomeSectionBackgroundData {
  id: string;
  sectionKey: string;
  tipo: string;
  imagenes: Array<{ url: string; alt?: string; publicId?: string | null }>;
  overlay: number;
  blur: number;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type HomeSectionBackgroundRaw = {
  id: string;
  sectionKey: string;
  tipo: string;
  imagenes: unknown;
  overlay: number;
  blur: number;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class HomeSectionBackgroundService extends Service {
  async listar(): Promise<HomeSectionBackgroundData[]> {
    const rows = await prisma.homeSectionBackground.findMany({
      where: { activa: true },
    });
    return rows.map((r) => ({
      ...r,
      imagenes: (r.imagenes as Array<{ url: string; alt?: string; publicId?: string | null }>) || [],
    }));
  }

  async listarTodas(): Promise<HomeSectionBackgroundData[]> {
    const rows = await prisma.homeSectionBackground.findMany();
    return rows.map((r) => ({
      ...r,
      imagenes: (r.imagenes as Array<{ url: string; alt?: string; publicId?: string | null }>) || [],
    }));
  }

  async getByKey(sectionKey: string): Promise<HomeSectionBackgroundData | null> {
    const row = await prisma.homeSectionBackground.findUnique({
      where: { sectionKey },
    });
    if (!row) return null;
    return {
      ...row,
      imagenes: (row.imagenes as Array<{ url: string; alt?: string; publicId?: string | null }>) || [],
    };
  }

  async actualizar(sectionKey: string, datos: {
    tipo?: string;
    imagenes?: Array<{ url: string; alt?: string; publicId?: string | null }>;
    overlay?: number;
    blur?: number;
    activa?: boolean;
  }): Promise<HomeSectionBackgroundData> {
    const row = await prisma.homeSectionBackground.update({
      where: { sectionKey },
      data: datos,
    });
    return {
      ...row,
      imagenes: (row.imagenes as Array<{ url: string; alt?: string; publicId?: string | null }>) || [],
    };
  }

  async agregarImagen(sectionKey: string, imagen: { url: string; alt?: string; publicId?: string | null }): Promise<HomeSectionBackgroundData> {
    const bg = await this.getByKey(sectionKey);
    const imagenes = bg?.imagenes as Array<{ url: string; alt?: string; publicId?: string | null }> || [];
    return this.actualizar(sectionKey, {
      imagenes: [...imagenes, imagen],
    });
  }

  async removerImagen(sectionKey: string, index: number): Promise<HomeSectionBackgroundData> {
    const bg = await this.getByKey(sectionKey);
    const imagenes = bg?.imagenes as Array<{ url: string; alt?: string; publicId?: string | null }> || [];
    return this.actualizar(sectionKey, {
      imagenes: imagenes.filter((_: any, i: number) => i !== index),
    });
  }
}
