import { v2 as cloudinary } from "cloudinary";

export const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER ?? "mi-pyme";

export function getCloudinaryUserFolder(userId: string): string {
  return `${CLOUDINARY_FOLDER}/users/${Buffer.from(userId).toString("base64url")}`;
}

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function hasCloudinaryConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export function getCloudinaryConfigError(): string | null {
  if (hasCloudinaryConfig()) {
    return null;
  }

  return "Cloudinary no está configurado. Define NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET y NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.";
}

export default cloudinary;
