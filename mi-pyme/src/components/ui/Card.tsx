import { cn } from "@/lib/utils";
import Link from "next/link";

export interface CardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  image?: { src: string; alt: string };
  badge?: { text: string; variant?: "default" | "success" | "warning" | "error" };
}

const badgeClasses = {
  default: "bg-neutral-100 text-neutral-800",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
};

export function Card({
  title,
  description,
  icon,
  footer,
  children,
  onClick,
  className,
  image,
  badge,
}: CardProps) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      className={cn(
        "flex flex-col rounded-xl border bg-card text-card-foreground",
        "transition-shadow duration-200 hover:shadow-md",
        onClick && "cursor-pointer text-left",
        className
      )}
      onClick={onClick}
      aria-label={title}
    >
      {image && (
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.alt}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {badge && (
            <span
              className={cn(
                "absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                badgeClasses[badge.variant ?? "default"]
              )}
            >
              {badge.text}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-col flex-1 p-4">
        {(title || icon) && (
          <div className="mb-2 flex items-center gap-2">
            {icon}
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
          </div>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <div className="mt-3 flex-1">{children}</div>
      </div>
      {footer && <div className="border-t px-4 py-3">{footer}</div>}
    </Wrapper>
  );
}

Card.displayName = "Card";

export interface CardLinkProps extends CardProps {
  href: string;
}

export function CardLink({ href, ...props }: CardLinkProps) {
  return (
    <Link href={href} legacyBehavior>
      <Card {...props} />
    </Link>
  );
}

CardLink.displayName = "CardLink";
