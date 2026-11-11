import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { Service } from "./Service";
import prisma from "@/lib/db/prisma";
import { cacheKeys, getCache, type ICache } from "@/infrastructure";
import { BCRYPT_ROUNDS } from "@/lib/auth/constants";
import { validarPassword } from "@/lib/auth/password-policy";
import { BusinessError } from "@/shared/types";

export type RolUsuarioAdmin = "ADMIN" | "CLIENTE" | "NEGOCIO" | "LOGISTICA";

export interface CrearUsuarioAdminInput {
  nombre: string;
  email: string;
  username?: string;
  password: string;
  rol: RolUsuarioAdmin;
  confirmarCrearAdmin?: boolean;
  forzarCambioPassword?: boolean;
  negocio?: {
    nombre: string;
    descripcion?: string;
    areaId?: string;
    provincia?: string;
    municipio?: string;
    telefono?: string;
    emailContacto?: string;
    direccion?: string;
  };
  logistica?: {
    nombre: string;
    zonaCobertura?: string;
    alcanceNacional: boolean;
    contacto: string;
  };
}

const DIAS_DEFAULT = [
  { diaSemana: 1, horaApertura: "08:00", horaCierre: "18:00" },
  { diaSemana: 2, horaApertura: "08:00", horaCierre: "18:00" },
  { diaSemana: 3, horaApertura: "08:00", horaCierre: "18:00" },
  { diaSemana: 4, horaApertura: "08:00", horaCierre: "18:00" },
  { diaSemana: 5, horaApertura: "08:00", horaCierre: "18:00" },
  { diaSemana: 6, horaApertura: "08:00", horaCierre: "13:00" },
  { diaSemana: 0, horaApertura: "00:00", horaCierre: "00:00", cerrado: true },
];

function makeSlug(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "negocio"
  );
}

function getPrismaErrorCode(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
  return null;
}

export class AdminUserService extends Service {
  private cache: ICache;

  constructor(cache?: ICache) {
    super();
    this.cache = cache ?? getCache();
  }

  async crearUsuario(
    datos: CrearUsuarioAdminInput,
    adminId: string
  ): Promise<{
    user: {
      id: string;
      nombre: string | null;
      email: string;
      username: string | null;
      rol: RolUsuarioAdmin;
      mustChangePassword: boolean;
      createdAt: Date;
    };
  }> {
    if (
      !datos ||
      typeof datos !== "object" ||
      typeof datos.nombre !== "string" ||
      typeof datos.email !== "string" ||
      typeof datos.password !== "string" ||
      typeof datos.rol !== "string"
    ) {
      throw new BusinessError("Datos de usuario no válidos", "VALIDACION", 400);
    }
    if (datos.username !== undefined && typeof datos.username !== "string") {
      throw new BusinessError("El nombre de usuario no es válido", "VALIDACION", 400);
    }
    const nombre = datos.nombre.trim();
    const email = datos.email.trim().toLowerCase();
    const username = datos.username?.trim().toLowerCase() || undefined;
    if (nombre.length < 2) {
      throw new BusinessError("El nombre debe tener al menos 2 caracteres", "VALIDACION", 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BusinessError("El email no es válido", "VALIDACION", 400);
    }
    if (username && !/^[a-zA-Z0-9_]{3,}$/.test(username)) {
      throw new BusinessError(
        "El nombre de usuario debe tener al menos 3 caracteres alfanuméricos o guiones bajos",
        "VALIDACION",
        400
      );
    }
    if (!["ADMIN", "CLIENTE", "NEGOCIO", "LOGISTICA"].includes(datos.rol)) {
      throw new BusinessError("Rol no válido", "ROL_INVALIDO", 400);
    }
    if (datos.rol === "ADMIN" && datos.confirmarCrearAdmin !== true) {
      throw new BusinessError(
        "Confirma explícitamente la creación de una cuenta ADMIN",
        "CONFIRMACION_REQUERIDA",
        400
      );
    }
    const validacionPassword = validarPassword(datos.password);
    if (!validacionPassword.valida) {
      throw new BusinessError(validacionPassword.errores.join("; "), "VALIDACION", 400);
    }
    if (
      datos.rol === "NEGOCIO" &&
      (!datos.negocio ||
        typeof datos.negocio !== "object" ||
        typeof datos.negocio.nombre !== "string" ||
        !datos.negocio.nombre.trim())
    ) {
      throw new BusinessError("El nombre del negocio es obligatorio", "VALIDACION", 400);
    }
    if (
      datos.negocio &&
      [
        datos.negocio.descripcion,
        datos.negocio.areaId,
        datos.negocio.provincia,
        datos.negocio.municipio,
        datos.negocio.telefono,
        datos.negocio.emailContacto,
        datos.negocio.direccion,
      ].some((value) => value !== undefined && typeof value !== "string")
    ) {
      throw new BusinessError("Los datos del negocio no son válidos", "VALIDACION", 400);
    }
    if (datos.rol === "LOGISTICA") {
      if (
        !datos.logistica ||
        typeof datos.logistica !== "object" ||
        typeof datos.logistica.nombre !== "string" ||
        typeof datos.logistica.contacto !== "string" ||
        typeof datos.logistica.alcanceNacional !== "boolean" ||
        !datos.logistica.nombre.trim() ||
        !datos.logistica.contacto.trim()
      ) {
        throw new BusinessError(
          "El nombre y el contacto del proveedor son obligatorios",
          "VALIDACION",
          400
        );
      }
      if (
        !datos.logistica.alcanceNacional &&
        (typeof datos.logistica.zonaCobertura !== "string" ||
          !datos.logistica.zonaCobertura.trim())
      ) {
        throw new BusinessError(
          "Indica la zona de cobertura del proveedor",
          "VALIDACION",
          400
        );
      }
    }

    const hashedPassword = await bcrypt.hash(datos.password, BCRYPT_ROUNDS);
    try {
      const user = await prisma.$transaction(async (tx) => {
        const admin = await tx.user.findUnique({
          where: { id: adminId },
          select: { rol: true, isActive: true, deletedAt: true },
        });
        if (!admin || admin.rol !== "ADMIN" || !admin.isActive || admin.deletedAt) {
          throw new BusinessError("Acceso denegado", "NO_AUTORIZADO", 403);
        }
        if (await tx.user.findUnique({ where: { email }, select: { id: true } })) {
          throw new BusinessError("Ya existe un usuario con ese email", "EMAIL_DUPLICADO", 409);
        }
        if (
          username &&
          (await tx.user.findUnique({ where: { username }, select: { id: true } }))
        ) {
          throw new BusinessError(
            "Ya existe un usuario con ese nombre de usuario",
            "USERNAME_DUPLICADO",
            409
          );
        }

        const created = await tx.user.create({
          data: {
            nombre,
            name: nombre,
            email,
            username,
            password: hashedPassword,
            rol: datos.rol,
            mustChangePassword: datos.forzarCambioPassword ?? true,
          },
          select: {
            id: true,
            nombre: true,
            email: true,
            username: true,
            rol: true,
            mustChangePassword: true,
            createdAt: true,
          },
        });

        let negocioId: string | null = null;
        let proveedorId: string | null = null;
        if (datos.rol === "NEGOCIO" && datos.negocio) {
          if (datos.negocio.areaId) {
            const area = await tx.area.findUnique({
              where: { id: datos.negocio.areaId },
              select: { id: true, activo: true },
            });
            if (!area || !area.activo) {
              throw new BusinessError("El área seleccionada no está disponible", "VALIDACION", 400);
            }
          }

          const slugBase = makeSlug(datos.negocio.nombre);
          let slug = slugBase;
          let suffix = 0;
          while (await tx.negocio.findUnique({ where: { slug }, select: { id: true } })) {
            suffix += 1;
            slug = `${slugBase}-${suffix}`;
          }
          const profile = await tx.negocio.create({
            data: {
              nombre: datos.negocio.nombre.trim(),
              descripcion: datos.negocio.descripcion?.trim() || undefined,
              slug,
              areaId: datos.negocio.areaId || undefined,
              provincia: datos.negocio.provincia?.trim() || undefined,
              municipio: datos.negocio.municipio?.trim() || undefined,
              telefono: datos.negocio.telefono?.trim() || undefined,
              emailContacto: datos.negocio.emailContacto?.trim().toLowerCase() || undefined,
              direccion: datos.negocio.direccion?.trim() || undefined,
              userId: created.id,
              estado: "ACTIVO",
              aprobadoPorId: adminId,
              aprobadoEn: new Date(),
            },
          });
          negocioId = profile.id;
          await tx.horarioNegocio.createMany({
            data: DIAS_DEFAULT.map((dia) => ({
              negocioId: profile.id,
              diaSemana: dia.diaSemana,
              horaApertura: dia.horaApertura,
              horaCierre: dia.horaCierre,
              cerrado: "cerrado" in dia && dia.cerrado === true,
            })),
          });
        } else if (datos.rol === "LOGISTICA" && datos.logistica) {
          const profile = await tx.proveedorLogistico.create({
            data: {
              usuarioId: created.id,
              nombre: datos.logistica.nombre.trim(),
              zonaCobertura: datos.logistica.alcanceNacional
                ? "Nacional"
                : datos.logistica.zonaCobertura!.trim(),
              alcanceNacional: datos.logistica.alcanceNacional,
              contacto: datos.logistica.contacto.trim(),
            },
          });
          proveedorId = profile.id;
        }

        await tx.auditLog.create({
          data: {
            eventType: "USUARIO_CREADO_POR_ADMIN",
            actorId: adminId,
            targetId: created.id,
            meta: {
              rol: datos.rol,
              email,
              negocioId,
              proveedorLogisticoId: proveedorId,
            },
          },
        });
        return created;
      });

      await this.invalidateUserCaches(user.id);
      return { user: { ...user, rol: user.rol as RolUsuarioAdmin } };
    } catch (error: unknown) {
      const code = getPrismaErrorCode(error);
      if (code === "P2002") {
        throw new BusinessError(
          "El email o nombre de usuario ya está registrado",
          "EMAIL_DUPLICADO",
          409
        );
      }
      throw error;
    }
  }

  async cambiarRol(
    userId: string,
    nuevoRol: RolUsuarioAdmin,
    adminId: string
  ): Promise<void> {
    if (!["ADMIN", "CLIENTE", "NEGOCIO", "LOGISTICA"].includes(nuevoRol)) {
      throw new BusinessError("Rol no válido", "ROL_INVALIDO", 400);
    }
    await prisma.$transaction(async (tx) => {
      const admin = await tx.user.findUnique({
        where: { id: adminId },
        select: { rol: true, isActive: true, deletedAt: true },
      });
      if (!admin || admin.rol !== "ADMIN" || !admin.isActive || admin.deletedAt) {
        throw new BusinessError("Acceso denegado", "NO_AUTORIZADO", 403);
      }
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { rol: true, isGenericAdmin: true, deletedAt: true },
      });
      if (!user) {
        throw new BusinessError("Usuario no encontrado", "NO_ENCONTRADO", 404);
      }
      if (user.deletedAt) {
        throw new BusinessError("No se puede cambiar el rol de un usuario eliminado", "NO_ENCONTRADO", 404);
      }
      if (user.isGenericAdmin) {
        throw new BusinessError(
          "No se puede cambiar el rol de la cuenta administrativa del sistema",
          "NO_AUTORIZADO",
          403
        );
      }
      if (userId === adminId) {
        throw new BusinessError(
          "No puedes cambiar tu propio rol desde el panel",
          "NO_AUTORIZADO",
          403
        );
      }
      if (user.rol === nuevoRol) return;

      if (user.rol === "ADMIN" && nuevoRol !== "ADMIN") {
        const admins = await tx.user.count({
          where: { rol: "ADMIN", isActive: true, deletedAt: null },
        });
        if (admins <= 1) {
          throw new BusinessError(
            "No se puede quitar el rol al último administrador activo",
            "ULTIMO_ADMIN",
            409
          );
        }
      }

      if (nuevoRol === "NEGOCIO") {
        const profile = await tx.negocio.findFirst({
          where: { userId },
          select: { id: true },
        });
        if (!profile) {
          throw new BusinessError(
            "Crea primero el perfil de negocio para asignar este rol",
            "ROL_INVALIDO",
            409
          );
        }
      }
      if (nuevoRol === "LOGISTICA") {
        const profile = await tx.proveedorLogistico.findFirst({
          where: { usuarioId: userId },
          select: { id: true },
        });
        if (!profile) {
          throw new BusinessError(
            "Crea primero el perfil logístico para asignar este rol",
            "ROL_INVALIDO",
            409
          );
        }
      }

      await tx.user.update({
        where: { id: userId },
        data: { rol: nuevoRol, sessionVersion: { increment: 1 } },
      });
      await tx.auditLog.create({
        data: {
          eventType: "ROL_CAMBIADO",
          actorId: adminId,
          targetId: userId,
          meta: { rolAnterior: user.rol, nuevoRol },
        },
      });
    });
    await this.invalidateUserCaches(userId);
  }

  async resetearPassword(userId: string, adminId: string): Promise<string> {
    const temporaryPassword = `MiPyme-${randomBytes(16).toString("base64url")}7`;
    const hashedPassword = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

    await prisma.$transaction(async (tx) => {
      const admin = await tx.user.findUnique({
        where: { id: adminId },
        select: { rol: true, isActive: true, deletedAt: true },
      });
      if (!admin || admin.rol !== "ADMIN" || !admin.isActive || admin.deletedAt) {
        throw new BusinessError("Acceso denegado", "NO_AUTORIZADO", 403);
      }
      const target = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, isGenericAdmin: true },
      });
      if (!target) {
        throw new BusinessError("Usuario no encontrado", "NO_ENCONTRADO", 404);
      }
      if (target.isGenericAdmin) {
        throw new BusinessError(
          "No se puede restablecer la contraseña de la cuenta administrativa del sistema",
          "NO_AUTORIZADO",
          403
        );
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          mustChangePassword: true,
          sessionVersion: { increment: 1 },
        },
      });
      await tx.auditLog.create({
        data: {
          eventType: "PASSWORD_RESETEADO_POR_ADMIN",
          actorId: adminId,
          targetId: userId,
          meta: { mustChangePassword: true },
        },
      });
    });
    await this.invalidateUserCaches(userId);
    return temporaryPassword;
  }

  async cambiarEstadoActivo(
    userId: string,
    activo: boolean,
    adminId: string
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const admin = await tx.user.findUnique({
        where: { id: adminId },
        select: { rol: true, isActive: true, deletedAt: true },
      });
      if (!admin || admin.rol !== "ADMIN" || !admin.isActive || admin.deletedAt) {
        throw new BusinessError("Acceso denegado", "NO_AUTORIZADO", 403);
      }
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { rol: true, isGenericAdmin: true, isActive: true, deletedAt: true },
      });
      if (!user || user.deletedAt) {
        throw new BusinessError("Usuario no encontrado", "NO_ENCONTRADO", 404);
      }
      if (user.isGenericAdmin) {
        throw new BusinessError(
          "No se puede cambiar el estado de la cuenta administrativa del sistema",
          "NO_AUTORIZADO",
          403
        );
      }
      if (!activo && userId === adminId) {
        throw new BusinessError(
          "No puedes desactivar tu propia cuenta desde el panel",
          "NO_AUTORIZADO",
          403
        );
      }
      if (!activo && user.rol === "ADMIN") {
        const admins = await tx.user.count({
          where: { rol: "ADMIN", isActive: true, deletedAt: null },
        });
        if (admins <= 1) {
          throw new BusinessError(
            "No se puede desactivar al último administrador activo",
            "ULTIMO_ADMIN",
            409
          );
        }
      }
      if (user.isActive === activo) return;

      await tx.user.update({
        where: { id: userId },
        data: { isActive: activo, sessionVersion: { increment: 1 } },
      });
      await tx.auditLog.create({
        data: {
          eventType: activo ? "USUARIO_ACTIVADO" : "USUARIO_DESACTIVADO",
          actorId: adminId,
          targetId: userId,
          meta: { activo },
        },
      });
    });
    await this.invalidateUserCaches(userId);
  }

  async eliminarUsuario(
    userId: string,
    adminId: string,
    motivo: string
  ): Promise<void> {
    const trimmedMotivo = motivo.trim();
    if (trimmedMotivo.length < 10) {
      throw new BusinessError(
        "Indica un motivo de al menos 10 caracteres",
        "VALIDACION",
        400
      );
    }
    await prisma.$transaction(async (tx) => {
      const admin = await tx.user.findUnique({
        where: { id: adminId },
        select: { rol: true, isActive: true, deletedAt: true },
      });
      if (!admin || admin.rol !== "ADMIN" || !admin.isActive || admin.deletedAt) {
        throw new BusinessError("Acceso denegado", "NO_AUTORIZADO", 403);
      }
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { rol: true, isGenericAdmin: true, isActive: true, deletedAt: true },
      });
      if (!user || user.deletedAt) {
        throw new BusinessError("Usuario no encontrado", "NO_ENCONTRADO", 404);
      }
      if (user.isGenericAdmin || userId === adminId) {
        throw new BusinessError(
          "No puedes eliminar esta cuenta administrativa desde el panel",
          "NO_AUTORIZADO",
          403
        );
      }
      if (user.rol === "ADMIN" && user.isActive) {
        const admins = await tx.user.count({
          where: { rol: "ADMIN", isActive: true, deletedAt: null },
        });
        if (admins <= 1) {
          throw new BusinessError(
            "No se puede eliminar al último administrador activo",
            "ULTIMO_ADMIN",
            409
          );
        }
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          deletedAt: new Date(),
          deletedBy: adminId,
          deletedReason: trimmedMotivo,
          sessionVersion: { increment: 1 },
        },
      });
      await tx.auditLog.create({
        data: {
          eventType: "USUARIO_ELIMINADO_POR_ADMIN",
          actorId: adminId,
          targetId: userId,
          meta: { motivo: trimmedMotivo },
        },
      });
    });
    await this.invalidateUserCaches(userId);
  }

  private async invalidateUserCaches(userId: string): Promise<void> {
    await Promise.all([
      this.cache.del(cacheKeys.usuario.all()),
      this.cache.del(cacheKeys.usuario.detalle(userId)),
    ]);
  }
}
