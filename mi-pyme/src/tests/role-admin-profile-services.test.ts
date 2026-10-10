import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "./setup";
import { AdminUserService } from "@/services/AdminUserService";
import { SolicitudAltaService } from "@/services/SolicitudAltaService";
import { ProfileImageService } from "@/services/ProfileImageService";
import { BusinessError } from "@/shared/types";

vi.mock("@/lib/cloudinary", () => ({
  default: {
    uploader: {
      destroy: vi.fn().mockResolvedValue({ result: "ok" }),
    },
  },
  getCloudinaryAvatarFolder: (userId: string) => `users/${userId}/avatars`,
  getCloudinaryConfigError: () => null,
}));

describe("role requests, admin user management, and profile images", () => {
  const adminUserService = new AdminUserService();
  const roleRequestService = new SolicitudAltaService();
  const profileImageService = new ProfileImageService();
  const emailPrefix = `role-management-${Date.now()}`;
  let adminId: string;
  let clientId: string;
  let areaId: string;
  let subareaId: string;

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        email: `${emailPrefix}-admin@example.test`,
        password: "hash",
        nombre: "Admin de pruebas",
        rol: "ADMIN",
      },
      select: { id: true },
    });
    const client = await prisma.user.create({
      data: {
        email: `${emailPrefix}-client@example.test`,
        password: "hash",
        nombre: "Cliente de pruebas",
        rol: "CLIENTE",
      },
      select: { id: true },
    });
    const area = await prisma.area.create({
      data: {
        nombre: `Área ${emailPrefix}`,
        slug: emailPrefix,
        activo: true,
      },
      select: { id: true },
    });
    const subarea = await prisma.subarea.create({
      data: {
        nombre: `Subárea ${emailPrefix}`,
        slug: `${emailPrefix}-subarea`,
        areaId: area.id,
        activo: true,
      },
      select: { id: true },
    });
    adminId = admin.id;
    clientId = client.id;
    areaId = area.id;
    subareaId = subarea.id;
  });

  afterAll(async () => {
    const userIds = [adminId, clientId].filter(Boolean);
    const businesses = await prisma.negocio.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    });
    const businessIds = businesses.map((business) => business.id);
    await prisma.negocioSubarea.deleteMany({
      where: { negocioId: { in: businessIds } },
    });
    await prisma.horarioNegocio.deleteMany({
      where: { negocioId: { in: businessIds } },
    });
    await prisma.negocio.deleteMany({ where: { id: { in: businessIds } } });
    await prisma.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
    await prisma.solicitudAltaNegocio.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    if (subareaId) await prisma.subarea.delete({ where: { id: subareaId } });
    if (areaId) await prisma.area.delete({ where: { id: areaId } });
  });

  it("creates users with normalized email and an enforced first password change", async () => {
    const result = await adminUserService.crearUsuario(
      {
        nombre: "  Usuario Administrado  ",
        email: `${emailPrefix}-managed@EXAMPLE.TEST`,
        password: "SecureAccess9831",
        rol: "CLIENTE",
      },
      adminId
    );
    expect(result.user.email).toBe(`${emailPrefix}-managed@example.test`);
    expect(result.user.mustChangePassword).toBe(true);

    const saved = await prisma.user.findUniqueOrThrow({
      where: { id: result.user.id },
      select: { nombre: true, mustChangePassword: true },
    });
    expect(saved).toEqual({
      nombre: "Usuario Administrado",
      mustChangePassword: true,
    });
    await prisma.user.delete({ where: { id: result.user.id } });
  });

  it("requires explicit confirmation before creating an administrator", async () => {
    await expect(
      adminUserService.crearUsuario(
        {
          nombre: "Admin nuevo",
          email: `${emailPrefix}-unchecked-admin@example.test`,
          password: "SecureAccess9831",
          rol: "ADMIN",
        },
        adminId
      )
    ).rejects.toMatchObject({
      code: "CONFIRMACION_REQUERIDA",
      status: 400,
    });
  });

  it("requires a professional profile before changing a client's role", async () => {
    await expect(
      adminUserService.cambiarRol(clientId, "LOGISTICA", adminId)
    ).rejects.toMatchObject({
      code: "ROL_INVALIDO",
      status: 409,
    });
  });

  it("creates a pending business-role request and prevents a second pending request", async () => {
    const request = await roleRequestService.crearSolicitud(clientId, {
      tipo: "NEGOCIO",
      nombreNegocio: `Negocio ${emailPrefix}`,
      areaId,
      subareaIds: [subareaId],
      telefono: "+1 555 0100",
      emailContacto: `${emailPrefix}-business@example.test`,
    });
    expect(request.tipo).toBe("NEGOCIO");
    expect(request.estado).toBe("PENDIENTE_APROBACION");
    await expect(
      roleRequestService.crearSolicitud(clientId, {
        tipo: "NEGOCIO",
        nombreNegocio: `Otro negocio ${emailPrefix}`,
        areaId,
        subareaIds: [subareaId],
        telefono: "+1 555 0101",
        emailContacto: `${emailPrefix}-business@example.test`,
      })
    ).rejects.toMatchObject({
      code: "SOLICITUD_PENDIENTE",
      status: 409,
    });
    expect(await roleRequestService.tieneSolicitudPendiente(clientId)).toBe(true);

    const approval = await roleRequestService.aprobarSolicitud(request.id, adminId);
    expect(approval.solicitud.estado).toBe("APROBADA");
    expect(approval.negocio).not.toBeNull();
    const assignedSubareas = await prisma.negocioSubarea.findMany({
      where: { negocioId: approval.negocio!.id },
      select: { subareaId: true },
    });
    expect(assignedSubareas).toEqual([{ subareaId }]);
  });

  it("rejects profile images that are not stored in the user's own avatar folder", async () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "test-cloud";
    await expect(
      profileImageService.actualizarFotoPerfil(
        clientId,
        "https://res.cloudinary.com/test-cloud/image/upload/v1/users/another-user/avatars/photo.jpg",
        "users/another-user/avatars/photo"
      )
    ).rejects.toBeInstanceOf(BusinessError);
  });

  it("requires a Cloudinary URL to resolve to the submitted public ID", async () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "test-cloud";
    const publicId = `users/${clientId}/avatars/actual`;
    await expect(
      profileImageService.actualizarFotoPerfil(
        clientId,
        `https://res.cloudinary.com/test-cloud/image/upload/v123/users/${clientId}/avatars/other.jpg`,
        publicId
      )
    ).rejects.toMatchObject({
      code: "VALIDACION",
      status: 400,
    });
  });

  it("saves a valid owned avatar and its asset identifier", async () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "test-cloud";
    const publicId = `users/${clientId}/avatars/profile-image`;
    const url = `https://res.cloudinary.com/test-cloud/image/upload/c_fill,w_512/v123/${publicId}.jpg`;

    await expect(
      profileImageService.actualizarFotoPerfil(clientId, url, publicId)
    ).resolves.toEqual({ fotoPerfilUrl: url, fotoPerfilPublicId: publicId });
    await expect(
      prisma.user.findUniqueOrThrow({
        where: { id: clientId },
        select: { fotoPerfilUrl: true, fotoPerfilPublicId: true },
      })
    ).resolves.toEqual({ fotoPerfilUrl: url, fotoPerfilPublicId: publicId });
  });
});
