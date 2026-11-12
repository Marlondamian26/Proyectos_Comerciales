import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { RegistroNotification } from "@/components/RegistroNotification";
import { NegocioService } from "@/services/NegocioService";
import { getCache } from "@/infrastructure";

const negocioService = new NegocioService(getCache());

export default async function NegocioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const userRol = session?.user?.rol;

  if (!session || !userRol) {
    redirect("/login");
  }

  if (userRol === Rol.ADMIN) {
    // Admin can access all negocio routes
  } else if (userRol !== Rol.NEGOCIO) {
    // CLIENTE or LOGISTICA: only allowed if they own a negocio
    const isOwner = await negocioService.esPropietarioDeAlgunNegocio(session.user.id);
    if (!isOwner) {
      redirect("/");
    }
  }

  return (
    <>
      {children}
      <RegistroNotification />
    </>
  );
}
