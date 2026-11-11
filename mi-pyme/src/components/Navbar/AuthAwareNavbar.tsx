"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Rol } from "@/lib/auth/roles";

export function AuthAwareNavbar({ userRol }: { userRol?: Rol }) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/auth/");

  if (isAuthRoute) return null;

  return <Navbar userRol={userRol} />;
}
