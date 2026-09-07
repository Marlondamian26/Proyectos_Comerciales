import { cn } from "@/lib/utils";
import React, { useRef, useEffect } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      document.body.style.overflow = "hidden";
      dialog.showModal();
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      if (isOpen) onClose();
    };

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/50"
      )}
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      <dialog
        ref={dialogRef}
        className={cn(
          "mx-4 w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl",
          "open:fixed open:inset-0 open:flex open:items-center open:justify-center",
          className
        )}
      >
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          <div>{children}</div>
          {footer && <div className="flex justify-end gap-2">{footer}</div>}
        </div>
      </dialog>
    </div>
  );
}

Modal.displayName = "Modal";
