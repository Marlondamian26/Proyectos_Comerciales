import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mi-Pyme — Plataforma Comercial para PYMES",
  description:
    "Gestión integral de productos, servicios, carrito, reservas, pedidos y facturación para tu negocio.",
  keywords: [
    "pymes",
    "ecommerce",
    "gestión",
    "facturación",
    "reservas",
    "logística",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.className} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}