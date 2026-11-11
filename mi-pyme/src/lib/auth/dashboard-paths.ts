import { Rol } from "@/lib/auth/roles";

export function getDashboardPath(rol: Rol): string {
  switch (rol) {
    case Rol.ADMIN:
      return "/admin";
    case Rol.NEGOCIO:
      return "/negocio";
    case Rol.LOGISTICA:
      return "/logistica";
    case Rol.CLIENTE:
    default:
      return "/cliente";
  }
}
