import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import cloudinary, { getCloudinaryConfigError, getCloudinaryUserFolder } from "@/lib/cloudinary";

export async function POST() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const configError = getCloudinaryConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 500 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "mi-pyme";
  const folder = getCloudinaryUserFolder(session.user.id);

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, upload_preset: uploadPreset },
    process.env.CLOUDINARY_API_SECRET!,
  );

  return NextResponse.json({
    timestamp,
    signature,
    folder,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    uploadPreset,
  });
}
