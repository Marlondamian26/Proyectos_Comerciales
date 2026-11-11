"use client";

import { cn } from "@/lib/utils";
import { Edit2, X } from "lucide-react";
import * as React from "react";
import { Button } from "./Button";
import { Input } from "./Input";

export interface InlineEditProps<T extends string | number> {
  value: T;
  onSave: (value: T) => void | Promise<void>;
  label: string;
  type?: "text" | "number" | "email";
  placeholder?: string;
  editClassName?: string;
  displayClassName?: string;
  inputClassName?: string;
  loadingMessage?: string;
  autoFocus?: boolean;
  validate?: (value: T) => string | undefined;
}

export function InlineEdit<T extends string | number>({
  value,
  onSave,
  label,
  type = "text",
  placeholder,
  editClassName,
  displayClassName,
  inputClassName,
  validate,
}: InlineEditProps<T>) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(String(value));
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const handleEdit = () => {
    setEditValue(String(value));
    setError(undefined);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(String(value));
    setError(undefined);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setError(undefined);

    if (validate) {
      const validationError = validate(editValue as T);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave(editValue as T);
      setIsEditing(false);
    } catch {
      setError("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-2", editClassName)}>
        <Input
          ref={inputRef}
          id={label}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder={placeholder}
          error={error}
          disabled={isSaving}
          className={cn("flex-1", inputClassName)}
          aria-label={label}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isSaving}
          aria-label="Cancelar"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 cursor-pointer",
        "hover:bg-muted/30 rounded px-2 py-1 transition-colors",
        displayClassName
      )}
      onClick={handleEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleEdit();
        }
      }}
      aria-label={`Editar ${label}`}
    >
      <span className="text-foreground">{value}</span>
      <Edit2 className="h-3.5 w-3.5 text-secondary opacity-60 transition-opacity" />
    </div>
  );
}

InlineEdit.displayName = "InlineEdit";