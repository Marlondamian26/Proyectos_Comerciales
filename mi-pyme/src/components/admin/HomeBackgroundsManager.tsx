"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "@/components/ui/ImageUploader";
import {
  actualizarFondoSeccionAction,
  agregarImagenFondoSeccionAction,
  removerImagenFondoSeccionAction,
} from "@/lib/actions";
import { Trash2 } from "lucide-react";

const SECTION_LABELS: Record<string, string> = {
  servicios: "Servicios Populares",
  areas: "Explora por Áreas",
  negocios: "Negocios Destacados",
  envio: "Envío y Transporte",
  "como-funciona-cta": "¿Cómo funciona? + CTA",
};

const SECTION_DESCRIPTIONS: Record<string, string> = {
  servicios: "Fondo de la sección de Servicios Populares",
  areas: "Fondo de la sección Explora por Áreas",
  negocios: "Fondo de la sección Negocios Destacados",
  envio: "Fondo de la sección Envío y Transporte",
  "como-funciona-cta": "Fondo de la sección ¿Cómo funciona? + ¿Listo para empezar?",
};

export function HomeBackgroundsManager({
  initialBackgrounds,
}: {
  initialBackgrounds: Array<{
    id: string;
    sectionKey: string;
    tipo: string;
    imagenes: Array<{ url: string; alt?: string; publicId?: string | null }>;
    overlay: number;
    blur: number;
    activa: boolean;
  }>;
}) {
  const [backgrounds, setBackgrounds] = useState(initialBackgrounds);

  const handleUpdate = async (
    sectionKey: string,
    datos: {
      tipo?: string;
      imagenes?: Array<{ url: string; alt?: string; publicId?: string | null }>;
      overlay?: number;
      blur?: number;
      activa?: boolean;
    }
  ) => {
    const updated = await actualizarFondoSeccionAction(sectionKey, datos);
    setBackgrounds((prev) =>
      prev.map((b) => (b.sectionKey === sectionKey ? { ...b, ...updated } : b))
    );
  };

  const handleAddImage = async (
    sectionKey: string,
    url: string,
    publicId?: string
  ) => {
    await agregarImagenFondoSeccionAction(sectionKey, { url, publicId });
    setBackgrounds((prev) =>
      prev.map((b) => {
        if (b.sectionKey !== sectionKey) return b;
        return {
          ...b,
          imagenes: [
            ...b.imagenes,
            { url, publicId, alt: SECTION_LABELS[sectionKey] },
          ],
        };
      })
    );
  };

  const handleRemoveImage = async (
    sectionKey: string,
    index: number
  ) => {
    await removerImagenFondoSeccionAction(sectionKey, index);
    setBackgrounds((prev) =>
      prev.map((b) => {
        if (b.sectionKey !== sectionKey) return b;
        return {
          ...b,
          imagenes: b.imagenes.filter((_: any, i: number) => i !== index),
        };
      })
    );
  };

  return (
    <div className="space-y-8">
      {backgrounds.map((bg) => (
        <div key={bg.sectionKey} className="border border-border rounded-lg p-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold text-lg">
                {SECTION_LABELS[bg.sectionKey] || bg.sectionKey}
              </h3>
              <p className="text-xs text-muted-foreground">
                {SECTION_DESCRIPTIONS[bg.sectionKey] || ""}
              </p>
            </div>
            <Badge
              variant={bg.activa ? "default" : "secondary"}
              className="text-xs"
            >
              {bg.activa ? "Activa" : "Inactiva"}
            </Badge>
          </div>

          {/* Tipo */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">
              Tipo de fondo
            </label>
            <select
              value={bg.tipo}
              onChange={(e) =>
                handleUpdate(bg.sectionKey, { tipo: e.target.value })
              }
              className="w-full mt-1 h-11 px-3 rounded-lg border border-border bg-background"
            >
              <option value="carrusel-cards">
                Imágenes de las cards (blurreadas)
              </option>
              <option value="carrusel-hero">
                Carrusel del hero
              </option>
              <option value="imagen">Imagen personalizada</option>
            </select>
          </div>

          {/* Opacidad y blur */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Opacidad del overlay
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.3"
                  max="0.95"
                  step="0.05"
                  value={bg.overlay}
                  onChange={(e) =>
                    handleUpdate(bg.sectionKey, {
                      overlay: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-primary rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs font-mono text-muted-foreground">
                  {(bg.overlay * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Blur ({bg.blur}px)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="24"
                  step="2"
                  value={bg.blur}
                  onChange={(e) =>
                    handleUpdate(bg.sectionKey, { blur: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-primary rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs font-mono text-muted-foreground">
                  {bg.blur}px
                </span>
              </div>
            </div>
          </div>

          {/* Imágenes */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">
              Imágenes ({bg.imagenes?.length || 0})
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(bg.imagenes || []).map((img: any, i: number) => (
                <div key={i} className="relative group">
                  <img
                    src={img.url}
                    alt={img.alt || bg.sectionKey}
                    className="w-full h-20 object-cover rounded"
                  />
                  <button
                    onClick={() => handleRemoveImage(bg.sectionKey, i)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Eliminar imagen"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {(bg.imagenes || []).length === 0 && (
                <div className="col-span-3 h-20 flex items-center justify-center rounded border border-dashed border-border text-sm text-muted-foreground">
                  Sin imágenes configuradas
                </div>
              )}
            </div>
            <ImageUploader
              onChange={(url, publicId) =>
                handleAddImage(bg.sectionKey, url, publicId)
              }
              folder="mi-pyme/home-backgrounds"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Badge({
  variant,
  className,
  children,
}: {
  variant?: "default" | "secondary";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
        ${variant === "default" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
        ${className || ""}
      `}
    >
      {children}
    </span>
  );
}
