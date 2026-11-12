import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export interface RoleLayoutProps {
  children: React.ReactNode;
  requiredRoles?: Rol[];
}

export async function RoleLayout({
  children,
  requiredRoles,
}: RoleLayoutProps) {
  const session = await auth();
  const userRol = session?.user?.rol;

  if (!session || !userRol) {
    redirect("/login");
  }

  if (requiredRoles && !requiredRoles.includes(userRol as Rol)) {
    redirect("/");
  }

  return children;
}
