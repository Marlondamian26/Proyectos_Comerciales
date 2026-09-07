import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import { Rol } from "@/lib/auth/roles";

export async function requireRole(
  roles: Rol[]
): Promise<{ id: string; email?: string | null; rol?: Rol }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("No autorizado");
  }

  const userRol = session.user.rol;

  if (!userRol || !roles.includes(userRol as Rol)) {
    throw new Error("Acceso denegado");
  }

  return {
    id: session.user.id,
    email: session.user.email,
    rol: userRol as Rol,
  };
}
