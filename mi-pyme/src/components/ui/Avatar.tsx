import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

function getInitials(name?: string, email?: string) {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

const colors = [
  "bg-primary text-primary-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-accent text-accent-foreground",
  "bg-success text-white",
  "bg-warning text-white",
  "bg-error text-white",
];

function getColorFromString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src,
  alt,
  name,
  size = "md",
  className,
}: AvatarProps) {
  const initials = getInitials(name, alt);
  const bgColor = getColorFromString(name || alt || "user");

  if (src) {
    return (
      <Image
        src={src}
        alt={alt || name || "Avatar"}
        width={size === "sm" ? 32 : size === "lg" ? 48 : 40}
        height={size === "sm" ? 32 : size === "lg" ? 48 : 40}
        className={cn(
          "rounded-full object-cover ring-2 ring-background",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-semibold select-none",
        sizeClasses[size],
        bgColor,
        className
      )}
      aria-label={name || alt || "Usuario"}
    >
      {initials}
    </div>
  );
}

Avatar.displayName = "Avatar";

export interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  className?: string;
}

export function AvatarGroup({ children, max = 4, className }: AvatarGroupProps) {
  const childArray = React.Children.toArray(children);
  const visible = childArray.slice(0, max);
  const remaining = childArray.length - max;

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {visible.map((child, i) => (
        <div key={i} className="ring-2 ring-background rounded-full">
          {child}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-semibold text-xs",
            "bg-muted text-muted-foreground ring-2 ring-background",
            "h-8 w-8"
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

AvatarGroup.displayName = "AvatarGroup";
