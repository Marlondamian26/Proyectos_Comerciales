import type { TratamientoIVA } from "@/generated/prisma/client";

export type TratamientoIVAValue = TratamientoIVA | string | null | undefined;

const LABELS: Record<string, { label: string; variant: "gravado" | "exento" | "no_sujeto" }> = {
  GRAVADO: { label: "Gravado", variant: "gravado" },
  EXENTO: { label: "Exento", variant: "exento" },
  NO_SUJETO: { label: "No sujeto", variant: "no_sujeto" },
};

const VARIANT_CLASSES: Record<string, string> = {
  gravado: "bg-primary/10 text-primary border-primary/20",
  exento: "bg-warning/10 text-warning border-warning/20",
  no_sujeto: "bg-muted text-muted-foreground border-muted",
};

export interface TratamientoIVABadgeProps {
  tratamiento: TratamientoIVAValue;
  className?: string;
}

export function TratamientoIVABadge({ tratamiento, className }: TratamientoIVABadgeProps) {
  const info = tratamiento ? LABELS[String(tratamiento)] ?? { label: String(tratamiento), variant: "gravado" } : null;
  if (!info) {
    return null;
  }
  const classes = `${VARIANT_CLASSES[info.variant]} inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border`;
  return (
    <span className={`${classes} ${className ?? ""}`} aria-label={`Tratamiento fiscal: ${info.label}`}>
      {info.label}
    </span>
  );
}
