"use client";

import { Navbar } from "@/components/Navbar";
import { Rol } from "@/lib/auth/roles";

export function AuthAwareNavbar({ userRol }: { userRol?: Rol }) {
  return <Navbar userRol={userRol} />;
}
