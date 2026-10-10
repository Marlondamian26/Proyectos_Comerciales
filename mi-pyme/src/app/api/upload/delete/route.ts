import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import cloudinary, { getCloudinaryConfigError, getCloudinaryUserFolder } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const configError = getCloudinaryConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 500 });
  }

  const body: unknown = await req.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !("publicId" in body) ||
    typeof body.publicId !== "string" ||
    !body.publicId
  ) {
    return NextResponse.json({ error: "publicId requerido" }, { status: 400 });
  }

  const ownedFolderPrefix = `${getCloudinaryUserFolder(session.user.id)}/`;
  if (!body.publicId.startsWith(ownedFolderPrefix)) {
    return NextResponse.json({ error: "No autorizado para eliminar este archivo" }, { status: 403 });
  }

  await cloudinary.uploader.destroy(body.publicId);
  return NextResponse.json({ success: true });
}
