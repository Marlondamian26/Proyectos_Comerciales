import { auth } from "@/lib/auth";
import { Rol } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { NegocioSidebar } from "@/components/negocio/NegocioSidebar";
import { RegistroNotification } from "@/components/RegistroNotification";

export default async function NegocioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const userRol = session?.user?.rol;

  if (!session || !userRol) {
    redirect("/login");
  }

  if (userRol !== Rol.NEGOCIO && userRol !== Rol.ADMIN) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar userRol={userRol as Rol} />
      <div className="flex flex-1 overflow-hidden">
        <NegocioSidebar userRol={userRol} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <RegistroNotification />
    </div>
  );
}
