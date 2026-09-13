import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar userRol={userRol as Rol} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar userRol={userRol as Rol} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
