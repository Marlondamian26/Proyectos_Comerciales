"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface LegalDocumentProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalDocument({
  title,
  lastUpdated,
  children,
}: LegalDocumentProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground dark:text-[#A5BBCF] hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <header className="mb-8 sm:mb-12 border-b border-border pb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground dark:text-[#E6EEF6] mb-2">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground dark:text-[#A5BBCF]">
            Última actualización: {lastUpdated}
          </p>
        </header>

        <article className="max-w-none legal-content space-y-6">
          {children}
        </article>

        <footer className="mt-12 pt-6 border-t border-border text-sm text-muted-foreground dark:text-[#A5BBCF]">
          <p>
            Si tienes dudas sobre este documento, contacta a{" "}
            <a href="mailto:legal@mi-pyme.cu" className="text-primary underline dark:text-[#99E0C7]">
              legal@mi-pyme.cu
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
