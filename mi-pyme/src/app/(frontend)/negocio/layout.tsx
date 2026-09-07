import { RoleLayout } from "@/components/RoleLayout";
import { Rol } from "@/lib/auth/roles";

export default async function NegocioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <RoleLayout requiredRoles={[Rol.NEGOCIO, Rol.ADMIN]}>
      {children}
    </RoleLayout>
  );
}
