"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Camera, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  actualizarFotoPerfilAction,
  eliminarFotoPerfilAction,
} from "@/lib/actions";

interface ProfileImageUploaderProps {
  nombre: string;
  fotoPerfilUrl?: string | null;
}

interface UploadResponse {
  success?: boolean;
  result?: { url?: string; publicId?: string };
  error?: string;
}

export function ProfileImageUploader({
  nombre,
  fotoPerfilUrl,
}: ProfileImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { update } = useSession();
  const [updatedImageUrl, setUpdatedImageUrl] = useState<string | null | undefined>(
    undefined
  );
  const imageUrl = updatedImageUrl === undefined ? fotoPerfilUrl ?? null : updatedImageUrl;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File) => {
    setError(null);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Elige una imagen PNG, JPEG o WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("La foto no puede superar 2 MB.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("purpose", "avatar");
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as UploadResponse;
      if (!response.ok || !payload.result?.url || !payload.result.publicId) {
        throw new Error(payload.error ?? "No se pudo subir la foto.");
      }

      await actualizarFotoPerfilAction(
        payload.result.url,
        payload.result.publicId
      );
      setUpdatedImageUrl(payload.result.url);
      await update();
      router.refresh();
    } catch (uploadError: unknown) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo actualizar la foto de perfil."
      );
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = async () => {
    setLoading(true);
    setError(null);
    try {
      await eliminarFotoPerfilAction();
      setUpdatedImageUrl(null);
      await update();
      router.refresh();
    } catch (removeError: unknown) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "No se pudo eliminar la foto de perfil."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="profile-image-heading">
      <h2 id="profile-image-heading" className="sr-only">
        Foto de perfil
      </h2>
      <div className="flex flex-wrap items-center gap-5">
        <Avatar
          src={imageUrl}
          name={nombre}
          size="lg"
          className="h-20 w-20 text-2xl"
        />
        <div className="flex flex-wrap gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            aria-label="Seleccionar foto de perfil"
            disabled={loading}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void uploadImage(file);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
            {loading ? "Procesando..." : "Cambiar foto"}
          </Button>
          {imageUrl && (
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={() => void removeImage()}
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Eliminar foto
            </Button>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        PNG, JPEG o WebP. Máximo 2 MB; se recorta a formato cuadrado.
      </p>
      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
