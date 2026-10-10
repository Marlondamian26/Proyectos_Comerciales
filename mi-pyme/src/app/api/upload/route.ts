import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import cloudinary, { getCloudinaryConfigError, getCloudinaryUserFolder } from "@/lib/cloudinary";

const allowedTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
];

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const configError = getCloudinaryConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo excede 5 MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<{ secure_url: string; public_id: string; resource_type: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: getCloudinaryUserFolder(session.user.id),
        resource_type: file.type === "application/pdf" ? "raw" : "auto",
        transformation:
          file.type.startsWith("image/")
            ? [
                { width: 1200, height: 1200, crop: "limit" },
                { quality: "auto:good", fetch_format: "auto" },
              ]
            : undefined,
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error("Upload failed"));
          return;
        }

        resolve({
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          resource_type: uploadResult.resource_type,
        });
      },
    );

    Readable.from([buffer]).pipe(uploadStream);
  });

  return NextResponse.json({
    success: true,
    result: {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
    },
  });
}
