import { RoleLayout } from "@/components/RoleLayout";
import { Rol } from "@/lib/auth/roles";

export default async function LogisticaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <RoleLayout requiredRoles={[Rol.LOGISTICA, Rol.ADMIN]}>
      {children}
    </RoleLayout>
  );
}
