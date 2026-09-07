import type { Metadata } from "next";
import { Inter } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.className} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
