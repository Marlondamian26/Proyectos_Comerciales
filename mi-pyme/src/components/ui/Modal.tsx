"use client";

import { cn } from "@/lib/utils";
import React, { useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  mobileAsSheet?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        handleClose();
      }

      if (event.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusableElements = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    },
    [closeOnEscape, handleClose]
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      dialog.showModal();
      dialog.addEventListener("keydown", handleKeyDown);

      const firstFocusable = dialog.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }

    return () => {
      document.body.style.overflow = "";
      dialog.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCloseEvent = () => {
      if (isOpen) handleClose();
    };

    dialog.addEventListener("close", handleCloseEvent);
    return () => dialog.removeEventListener("close", handleCloseEvent);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const modalId = "modal";

  return (
    <div
      className={cn(
        "fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
      )}
      aria-modal="true"
      role="dialog"
      aria-labelledby={`${modalId}-title`}
      aria-describedby={description ? `${modalId}-description` : undefined}
    >
      <div
        className={cn(
          "fixed inset-0 bg-overlay backdrop-blur-sm transition-opacity duration-200",
          "data-[state=open]:animate-fade-in"
        )}
        onClick={closeOnOverlayClick ? handleClose : undefined}
        aria-hidden="true"
      />

      <dialog
        ref={dialogRef}
        id="modal"
        className={cn(
          "fixed inset-0 z-50 w-full h-full sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
          "sm:w-auto sm:h-auto sm:max-w-lg sm:max-h-[90vh] sm:flex sm:flex-col sm:rounded-xl",
          "rounded-none border-0 sm:border sm:border-border bg-background shadow-strong",
          "flex flex-col p-0 sm:max-h-[90vh]",
          "data-[state=open]:animate-scale-in",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-4 sm:py-5 border-b border-border sticky top-0 bg-background z-10">
            <div className="flex-1 min-w-0">
              <h2
                id="modal-title"
                className="text-lg sm:text-xl font-semibold text-foreground"
              >
                {title}
              </h2>
              {description && (
                <p
                  id="modal-description"
                  className="text-sm text-muted-foreground mt-1"
                >
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={handleClose}
                className={cn(
                  "flex-shrink-0 flex items-center justify-center h-11 w-11 rounded-lg",
                  "text-muted-foreground hover:text-foreground hover:bg-surface-raised",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-2 px-4 sm:px-6 py-4 border-t border-border bg-background/50 sticky bottom-0 z-10">
              {footer}
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
}

Modal.displayName = "Modal";