import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background pt-8 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p className="leading-none">
            © {new Date().getFullYear()} Mi-Pyme. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/privacidad"
              className="hover:text-foreground transition-colors"
            >
              Privacidad
            </Link>
            <Link
              href="/terminos"
              className="hover:text-foreground transition-colors"
            >
              Términos
            </Link>
            <Link
              href="/devoluciones"
              className="hover:text-foreground transition-colors"
            >
              Devoluciones
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
