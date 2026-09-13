"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, Home } from "lucide-react";

export default function ContactoPage() {
  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-16">
            <div className="mb-6 flex items-center justify-between gap-4">
              <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                <Home className="h-4 w-4" />
                Volver al inicio
              </Link>
              <ThemeToggle />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
              Contacto
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ¿Tienes preguntas o necesitas ayuda? Nuestro equipo está listo para ayudarte.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <Card className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Email</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Escríbenos y te responderemos en menos de 24 horas.
              </p>
              <a
                href="mailto:soporte@mi-pyme.com"
                className="text-sm text-primary hover:underline font-medium"
              >
                soporte@mi-pyme.com
              </a>
            </Card>

            <Card className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Teléfono</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Lun-Vie de 9:00 a 18:00 hs.
              </p>
              <a
                href="tel:+5491112345678"
                className="text-sm text-primary hover:underline font-medium"
              >
                +54 9 11 1234-5678
              </a>
            </Card>

            <Card className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Oficina</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Av. Corrientes 1234, Buenos Aires, Argentina.
              </p>
              <span className="text-sm text-muted-foreground font-medium">
                CABA, Argentina
              </span>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-bold">Envíanos un mensaje</h2>
              </div>
              <p className="text-muted-foreground mb-8">
                Completa el formulario y nos pondremos en contacto contigo a la brevedad.
              </p>

              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="nombre" className="text-sm font-medium">
                      Nombre
                    </label>
                    <input
                      id="nombre"
                      type="text"
                      placeholder="Tu nombre"
                      className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="asunto" className="text-sm font-medium">
                    Asunto
                  </label>
                  <input
                    id="asunto"
                    type="text"
                    placeholder="¿En qué podemos ayudarte?"
                    className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="mensaje" className="text-sm font-medium">
                    Mensaje
                  </label>
                  <textarea
                    id="mensaje"
                    rows={5}
                    placeholder="Cuéntanos más detalles..."
                    className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>
                <Button size="lg" className="w-full sm:w-auto">
                  <Send className="h-4 w-4 mr-2" />
                  Enviar mensaje
                </Button>
              </form>
            </div>

            <div className="space-y-8">
              <Card>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Horario de atención</h3>
                    <p className="text-sm text-muted-foreground">
                      Lunes a Viernes: 9:00 - 18:00 hs
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sábados: 9:00 - 13:00 hs
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Soporte técnico</h3>
                    <p className="text-sm text-muted-foreground">
                      Para problemas técnicos, envía un email a:
                    </p>
                    <a
                      href="mailto:tech@mi-pyme.com"
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      tech@mi-pyme.com
                    </a>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Ventas</h3>
                    <p className="text-sm text-muted-foreground">
                      Para consultas sobre planes y precios:
                    </p>
                    <a
                      href="tel:+5491112345678"
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      +54 9 11 1234-5678
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
