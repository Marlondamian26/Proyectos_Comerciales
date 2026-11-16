import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthAwareNavbar } from "@/components/Navbar/AuthAwareNavbar";
import { DashboardChrome } from "@/components/DashboardChrome";
import { Footer } from "@/components/Footer";
import { ScrollRestoration } from "@/components/ScrollRestoration";
import { auth } from "@/lib/auth";
import "./globals.css";
import "@/styles/tokens.css";
import "@/styles/gradients.css";

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
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const userRol = session?.user?.rol;

  return (
    <html lang="es" className={inter.className} suppressHydrationWarning data-scroll-behavior="smooth">
      <script
        id="theme-init"
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('mi-pyme-theme');if(!t){var m=document.cookie.match('(?:^|; )mi-pyme-theme=([^;]*)');t=m?m[1]:null}if(t==='light'||t==='dark'||t==='system'){var s=window.matchMedia('(prefers-color-scheme: dark)').matches?t==='system'?'dark':t:t;document.documentElement.setAttribute('data-theme',s);document.documentElement.style.colorScheme=s;}}catch(e){}})()`,
        }}
      />
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SessionProvider>
          <ThemeProvider>
            <AuthAwareNavbar userRol={userRol} />
            <Suspense fallback={null}>
              <ScrollRestoration />
            </Suspense>
            <DashboardChrome userRol={userRol}>{children}</DashboardChrome>
            <Footer />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}