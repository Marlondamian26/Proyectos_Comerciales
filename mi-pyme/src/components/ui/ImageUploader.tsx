"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ImageUploaderProps {
  onChange: (url: string, publicId?: string) => void;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
}

export function ImageUploader({
  onChange,
  folder = "mi-pyme/hero",
  accept = "image/*",
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUploading(true);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          folder,
        }),
      });

      if (!res.ok) {
        throw new Error("Error al subir la imagen");
      }

      const data = await res.json();
      onChange(data.url ?? url, data.publicId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Input
          type="url"
          placeholder="URL de la imagen (Cloudinary, Unsplash, etc.)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
          disabled={uploading}
        />
        <Button type="submit" disabled={uploading || !url} loading={uploading}>
          {uploading ? "Subiendo..." : "Agregar"}
        </Button>
      </form>

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      <p className="text-xs text-muted-foreground">
        Soporta: {accept}. Tamaño máximo: {maxSizeMB}MB. Carpeta: {folder}.
      </p>
    </div>
  );
}
