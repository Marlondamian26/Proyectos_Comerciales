"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "@/components/ui/ImageUploader";
import {
  crearHeroImageAction,
  eliminarHeroImageAction,
} from "@/lib/actions";
import { Trash2 } from "lucide-react";

interface HeroImageItem {
  id: string;
  url: string;
  alt: string;
  orden: number;
  activa: boolean;
}

export function HeroImageManager({
  initialImages,
}: {
  initialImages: HeroImageItem[];
}) {
  const [images, setImages] = useState<HeroImageItem[]>(initialImages);

  const handleAdd = async (url: string, publicId?: string) => {
    const nueva = await crearHeroImageAction({
      url,
      publicId,
      orden: images.length,
    });
    setImages([...images, nueva]);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta imagen del hero?")) return;
    await eliminarHeroImageAction(id);
    setImages(images.filter((img) => img.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ImageUploader
          onChange={(url: string, publicId?: string) => handleAdd(url, publicId)}
          folder="mi-pyme/hero"
        />
      </div>

      <div className="space-y-2">
        {images.map((img, index) => (
          <div
            key={img.id}
            className="flex items-center gap-3 p-3 border border-border rounded-lg"
          >
            <div className="flex items-center gap-2 cursor-move select-none">
              <span className="text-muted-foreground">{index + 1}</span>
            </div>
            <img
              src={img.url}
              alt={img.alt}
              className="h-16 w-24 object-cover rounded"
              loading="lazy"
            />
            <span className="flex-1 text-sm text-muted-foreground truncate">
              {img.alt}
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void handleDelete(img.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {images.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No hay imágenes configuradas. Agrega la primera.
          </div>
        )}
      </div>
    </div>
  );
}
