"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showDragHandle?: boolean;
  closeOnOverlayClick?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw] mx-2",
};

export function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  size = "md",
  showDragHandle = true,
  closeOnOverlayClick = true,
}: BottomSheetProps) {
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleTouchEnd = (e: Event) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    const overlay = document.querySelector(".bottom-sheet-overlay");
    overlay?.addEventListener("touchend", handleTouchEnd as EventListener);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
      overlay?.removeEventListener("touchend", handleTouchEnd as EventListener);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (closeOnOverlayClick) {
      setIsClosing(true);
      setTimeout(() => onClose(), 200);
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-modal flex items-end justify-center bg-overlay",
        "backdrop-blur-sm data-[closing]:animate-slide-down",
        "bottom-sheet-overlay",
        isClosing && "animate-slide-down"
      )}
      onClick={closeOnOverlayClick ? handleClose : undefined}
      aria-hidden={!isOpen ? "true" : undefined}
    >
      <div
        ref={sheetRef}
        className={cn(
          "w-full bg-surface-elevated border-t border-border-subtle",
          "rounded-t-2xl shadow-strong",
          "animate-bounce-in data-[state=open]:animate-bounce-in",
          sizeClasses[size],
          "max-h-[90vh] flex flex-col",
          isClosing && "animate-slide-down",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "bottom-sheet-title" : undefined}
      >
        {showDragHandle && (
          <div className="flex justify-center py-2">
            <div className="h-1 w-10 rounded-full bg-border-subtle" />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {title && (
            <h2
              id="bottom-sheet-title"
              className="text-lg font-semibold text-foreground mb-1"
            >
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-secondary mb-4">{description}</p>
          )}
          {children}
        </div>

        {footer && (
          <div className="border-t border-border-subtle px-5 py-3">
            {footer}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

BottomSheet.displayName = "BottomSheet";