import { RoleLayout } from "@/components/RoleLayout";
import { Rol } from "@/lib/auth/roles";

export default async function ClienteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <RoleLayout requiredRoles={[Rol.CLIENTE, Rol.ADMIN]}>
      {children}
    </RoleLayout>
  );
}
