"use client";

import { cn } from "@/lib/utils";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/ThemeProvider";
import { useId, useState, useRef, useEffect } from "react";

export function ThemeToggle() {
  const { theme, resolvedTheme, ready, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const buttonId = useId();

  const labels = {
    light: "Cambiar a modo oscuro",
    dark: "Cambiar a modo claro",
    system: "Cambiar a modo sistema",
  };

  const descriptions = {
    light: "Modo claro activado",
    dark: "Modo oscuro activado",
    system: "Siguiendo preferencia del sistema",
  };

  const currentLabel = ready ? labels[resolvedTheme] : "Cargando preferencia de tema";
  const currentDescription = ready ? descriptions[resolvedTheme] : "Inicializando tema";

  const options = [
    { value: "light" as const, label: "Claro", icon: <Sun className="h-4 w-4" />, description: "Forzar modo claro" },
    { value: "dark" as const, label: "Oscuro", icon: <Moon className="h-4 w-4" />, description: "Forzar modo oscuro" },
    { value: "system" as const, label: "Sistema", icon: <Monitor className="h-4 w-4" />, description: "Seguir preferencia del sistema" },
  ];

  return (
    <div className="relative inline-flex" data-testid="theme-toggle">
      <Button
        id={buttonId}
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="gap-2 min-w-[7.5rem] justify-start text-muted-foreground hover:text-foreground transition-colors duration-200"
        aria-label={currentLabel}
        aria-pressed={theme === "dark"}
        aria-describedby={`${buttonId}-description`}
        title={currentLabel}
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4 transition-transform duration-200 rotate-0 scale-100" aria-hidden="true" />
        ) : theme === "light" ? (
          <Moon className="h-4 w-4 transition-transform duration-200 -rotate-90 scale-0" aria-hidden="true" />
        ) : (
          <Monitor className="h-4 w-4 transition-transform duration-200 rotate-0 scale-100" aria-hidden="true" />
        )}
        <span className="truncate">{ready ? (isDark ? "Oscuro" : theme === "light" ? "Claro" : "Sistema") : "Tema"}</span>
      </Button>

      <div
        id={`${buttonId}-description`}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {currentDescription}
      </div>

      <ThemeDropdown
        buttonId={buttonId}
        currentTheme={theme}
        options={options}
        onSelect={setTheme}
      />
    </div>
  );
}

function ThemeDropdown({
  buttonId,
  currentTheme,
  options,
  onSelect,
}: {
  buttonId: string;
  currentTheme: "light" | "dark" | "system";
  options: Array<{ value: "light" | "dark" | "system"; label: string; icon: React.ReactNode; description: string }>;
  onSelect: (theme: "light" | "dark" | "system") => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-1 p-1.5 hover:bg-muted rounded-r-lg"
        aria-label="Opciones de tema"
        aria-expanded={isOpen}
        aria-controls={`${buttonId}-dropdown`}
        aria-haspopup="listbox"
      >
        <svg
          className="h-4 w-4 transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </Button>

      {isOpen && (
        <div
          ref={dropdownRef}
          id={`${buttonId}-dropdown`}
          role="listbox"
          aria-label="Seleccionar tema"
          aria-activedescendant={`${buttonId}-option-${currentTheme}`}
          className="absolute right-0 top-full mt-1.5 z-50 min-w-[140px] rounded-xl border bg-popover p-1.5 shadow-lg animate-scale-in"
        >
          {options.map((option) => (
            <button
              key={option.value}
              id={`${buttonId}-option-${option.value}`}
              role="option"
              aria-selected={currentTheme === option.value}
              onClick={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                currentTheme === option.value
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <span className="flex-shrink-0" aria-hidden="true">{option.icon}</span>
              <span className="truncate">{option.label}</span>
              {currentTheme === option.value && (
                <svg
                  className="ml-auto h-4 w-4 text-primary flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

ThemeToggle.displayName = "ThemeToggle";