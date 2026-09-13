"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "outline"
  | "ghost"
  | "destructive"
  | "gradient"
  | "gradientSecondary"
  | "gradientAccent"
  | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  asChild?: boolean;
  children: React.ReactNode;
}

const Slot = React.forwardRef<
  HTMLElement,
  { children: React.ReactNode } & React.HTMLAttributes<HTMLElement>
>(({ children, ...props }, ref) => {
  const childArray = React.Children.toArray(children);
  const child = childArray[0];
  if (!React.isValidElement(child)) {
    return <span ref={ref} {...props}>{children}</span>;
  }
  // Only pass ref if child is a forwardRef component or native element
  const childProps = { ...props } as Record<string, unknown>;
  if (typeof child.type !== "string") {
    // For custom components, only pass ref if they accept it
    childProps.ref = ref;
  } else {
    // For native elements, ref is valid
    childProps.ref = ref;
  }
  return React.cloneElement(child, childProps);
});

Slot.displayName = "Slot";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-theme-sm hover:bg-primary/90 hover:shadow-theme-md active:scale-[0.98]",
  secondary:
    "bg-secondary text-secondary-foreground shadow-theme-sm hover:bg-secondary/90 hover:shadow-theme-md active:scale-[0.98]",
  accent:
    "bg-accent text-accent-foreground shadow-theme-sm hover:bg-accent/90 hover:shadow-theme-md active:scale-[0.98]",
  gradient:
    "bg-gradient-primary text-white shadow-theme-lg hover:shadow-theme-glow active:scale-[0.98]",
  gradientSecondary:
    "bg-gradient-to-r from-secondary to-emerald-600 text-white shadow-theme-lg hover:shadow-theme-glow active:scale-[0.98]",
  gradientAccent:
    "bg-gradient-to-r from-accent to-orange-600 text-white shadow-theme-lg hover:shadow-theme-glow active:scale-[0.98]",
  outline:
    "border border-border bg-background hover:bg-accent/10 hover:text-accent hover:border-accent/30 hover:shadow-theme-md active:scale-[0.98]",
  ghost:
    "hover:bg-accent/10 hover:text-accent-foreground active:scale-[0.98]",
  destructive:
    "bg-destructive text-destructive-foreground shadow-theme-sm hover:bg-destructive/90 hover:shadow-theme-md active:scale-[0.98]",
  link:
    "text-primary underline-offset-4 hover:underline active:scale-[0.98]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-base gap-2.5",
  icon: "h-10 w-10 p-0",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      asChild = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const classes = cn(
      "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:pointer-events-none disabled:opacity-50",
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    const renderIcon = () => {
      if (loading) {
        return (
          <Loader2
            className="h-4 w-4 animate-spin"
            aria-hidden="true"
          />
        );
      }
      if (icon) {
        return <span className="flex-shrink-0" aria-hidden="true">{icon}</span>;
      }
      return null;
    };

    if (asChild) {
      return (
        <Slot ref={ref} className={classes} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-disabled={disabled || loading || undefined}
        {...props}
      >
        {iconPosition === "left" && renderIcon()}
        {children}
        {iconPosition === "right" && renderIcon()}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };