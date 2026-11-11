import { RoleLayout } from "@/components/RoleLayout";
import { Rol } from "@/lib/auth/roles";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <RoleLayout requiredRoles={[Rol.ADMIN]}>
      {children}
    </RoleLayout>
  );
}
