import type { RegimenFiscal } from "@/generated/prisma/client";

export type RegimenFiscalValue = RegimenFiscal | string | null | undefined;

const LABELS: Record<string, { label: string; variant: "general" | "simplificado" | "exento" | "no_sujeto" }> = {
  GENERAL: { label: "General", variant: "general" },
  SIMPLIFICADO: { label: "Simplificado", variant: "simplificado" },
  EXENTO: { label: "Exento", variant: "exento" },
  NO_SUJETO: { label: "No sujeto", variant: "no_sujeto" },
};

const VARIANT_CLASSES: Record<string, string> = {
  general: "bg-primary/10 text-primary border-primary/20",
  simplificado: "bg-accent/10 text-accent border-accent/20",
  exento: "bg-warning/10 text-warning border-warning/20",
  no_sujeto: "bg-muted text-muted-foreground border-muted",
};

export interface RegimenFiscalBadgeProps {
  regimen: RegimenFiscalValue;
  className?: string;
}

export function RegimenFiscalBadge({ regimen, className }: RegimenFiscalBadgeProps) {
  const info = regimen ? LABELS[String(regimen)] ?? { label: String(regimen), variant: "general" } : null;
  if (!info) {
    return null;
  }
  const classes = `${VARIANT_CLASSES[info.variant]} inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border`;
  return (
    <span className={`${classes} ${className ?? ""}`} aria-label={`Régimen fiscal: ${info.label}`}>
      {info.label}
    </span>
  );
}
