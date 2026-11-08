import { RoleLayout } from "@/components/RoleLayout";
import { MobileTabBar } from "@/components/MobileTabBar";
import { Rol } from "@/lib/auth/roles";

export default async function ClienteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <RoleLayout requiredRoles={[Rol.CLIENTE, Rol.ADMIN]}>
      {children}
      <MobileTabBar />
    </RoleLayout>
  );
}
