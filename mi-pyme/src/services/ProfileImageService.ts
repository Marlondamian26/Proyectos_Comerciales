import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { cacheKeys, getCache, type ICache } from "@/infrastructure";
import { BusinessError } from "@/shared/types";
import cloudinary, {
  getCloudinaryAvatarFolder,
  getCloudinaryConfigError,
} from "@/lib/cloudinary";

export class ProfileImageService extends Service {
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
  }

  async actualizarFotoPerfil(
    userId: string,
    url: string,
    publicId: string
  ): Promise<{ fotoPerfilUrl: string; fotoPerfilPublicId: string }> {
    if (typeof url !== "string" || typeof publicId !== "string") {
      throw new BusinessError("Datos de foto de perfil no válidos", "VALIDACION", 400);
    }
    const configError = getCloudinaryConfigError();
    if (configError) {
      throw new BusinessError(configError, "CLOUDINARY_NO_CONFIGURADO", 503);
    }
    this.validarImagen(userId, url, publicId);

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { fotoPerfilPublicId: true },
    });
    if (!existingUser) {
      throw new BusinessError("Usuario no encontrado", "NO_ENCONTRADO", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { fotoPerfilUrl: url, fotoPerfilPublicId: publicId },
        select: { fotoPerfilUrl: true, fotoPerfilPublicId: true },
      });
      await tx.auditLog.create({
        data: {
          eventType: "FOTO_PERFIL_ACTUALIZADA",
          actorId: userId,
          targetId: userId,
          meta: { publicId },
        },
      });
    });

    if (existingUser.fotoPerfilPublicId && existingUser.fotoPerfilPublicId !== publicId) {
      await this.eliminarAssetAnterior(existingUser.fotoPerfilPublicId);
    }
    await this.cache.del(cacheKeys.usuario.detalle(userId));

    return {
      fotoPerfilUrl: url,
      fotoPerfilPublicId: publicId,
    };
  }

  async eliminarFotoPerfil(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fotoPerfilPublicId: true },
    });
    if (!user) {
      throw new BusinessError("Usuario no encontrado", "NO_ENCONTRADO", 404);
    }
    if (!user.fotoPerfilPublicId) return;

    this.validarPublicId(userId, user.fotoPerfilPublicId);
    const configError = getCloudinaryConfigError();
    if (configError) {
      throw new BusinessError(configError, "CLOUDINARY_NO_CONFIGURADO", 503);
    }
    await this.eliminarAssetAnterior(user.fotoPerfilPublicId);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { fotoPerfilUrl: null, fotoPerfilPublicId: null },
      });
      await tx.auditLog.create({
        data: {
          eventType: "FOTO_PERFIL_ELIMINADA",
          actorId: userId,
          targetId: userId,
          meta: {},
        },
      });
    });
    await this.cache.del(cacheKeys.usuario.detalle(userId));
  }

  private validarImagen(userId: string, url: string, publicId: string): void {
    this.validarPublicId(userId, publicId);
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BusinessError("La URL de la foto no es válida", "VALIDACION", 400);
    }
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "res.cloudinary.com" ||
      !parsed.pathname.startsWith(
        `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/`
      )
    ) {
      throw new BusinessError(
        "La foto debe ser una imagen segura alojada en Cloudinary",
        "VALIDACION",
        400
      );
    }
    const uploadPath = parsed.pathname.split("/image/upload/")[1];
    const segments = uploadPath?.split("/") ?? [];
    const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
    const assetPath =
      versionIndex >= 0
        ? segments.slice(versionIndex + 1).join("/")
        : "";
    let urlPublicId: string;
    try {
      urlPublicId = decodeURIComponent(assetPath).replace(/\.[^/.]+$/, "");
    } catch (error: unknown) {
      if (error instanceof URIError) {
        throw new BusinessError("La URL de la foto no es válida", "VALIDACION", 400);
      }
      throw error;
    }
    if (!urlPublicId || urlPublicId !== publicId) {
      throw new BusinessError(
        "La URL no corresponde al identificador de la foto",
        "VALIDACION",
        400
      );
    }
  }

  private validarPublicId(userId: string, publicId: string): void {
    const avatarFolderPrefix = `${getCloudinaryAvatarFolder(userId)}/`;
    if (!publicId.startsWith(avatarFolderPrefix)) {
      throw new BusinessError(
        "La imagen no pertenece al perfil de este usuario",
        "NO_AUTORIZADO",
        403
      );
    }
  }

  private async eliminarAssetAnterior(publicId: string): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
      });
      if (result.result !== "ok" && result.result !== "not found") {
        throw new Error(`Cloudinary respondió: ${result.result}`);
      }
    } catch (error: unknown) {
      console.error("[ProfileImageService] No se pudo eliminar la imagen anterior", {
        publicId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new BusinessError(
        "No se pudo eliminar la foto de perfil anterior en Cloudinary",
        "CLOUDINARY_DELETE_FAILED",
        502
      );
    }
  }
}
