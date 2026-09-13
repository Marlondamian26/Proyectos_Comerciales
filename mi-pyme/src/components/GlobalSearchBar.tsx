"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Rol } from "@/lib/auth/roles";
import { useId } from "react";

interface SearchResult {
  id: string;
  nombre: string;
  negocio?: { nombre: string };
  price?: number;
  email_masked?: string;
  rol?: string;
}

interface SearchResponse {
  query: string;
  results: {
    products: SearchResult[];
    services: SearchResult[];
    logistics: SearchResult[];
    users: SearchResult[];
  };
  meta: { limit: number; offset: number };
}

interface GlobalSearchBarProps {
  userRol?: Rol;
  compact?: boolean;
}

interface Group {
  key: string;
  label: string;
  items: SearchResult[];
  hrefPrefix: string;
}

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

export function GlobalSearchBar({ userRol, compact }: GlobalSearchBarProps) {
  const router = useRouter();
  const uniqueId = useId();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const listboxId = useMemo(() => `search-listbox-${uniqueId}`, []);

  const groups: Group[] = useMemo(() => {
    if (!results) return [];
    const g: Group[] = [];
    if (results.results.products.length > 0) {
      g.push({ key: "products", label: "Productos", items: results.results.products, hrefPrefix: "/catalogo" });
    }
    if (results.results.services.length > 0) {
      g.push({ key: "services", label: "Servicios", items: results.results.services, hrefPrefix: "/servicios" });
    }
    if (results.results.logistics.length > 0) {
      g.push({ key: "logistics", label: "Logística", items: results.results.logistics, hrefPrefix: "/logistica" });
    }
    if (results.results.users.length > 0) {
      g.push({ key: "users", label: "Usuarios", items: results.results.users, hrefPrefix: "/admin" });
    }
    return g;
  }, [results]);

  const flatItems = useMemo(() => {
    return groups.flatMap((g) => g.items);
  }, [groups]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (query.length < MIN_CHARS) {
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      abortControllerRef.current = new AbortController();
      setIsLoading(true);
      setError(false);
      setActiveIndex(-1);
      try {
        const params = new URLSearchParams({ q: query, limit: "8" });
        const res = await fetch(`/api/search/quick?${params.toString()}`, {
          signal: abortControllerRef.current.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data: SearchResponse = await res.json();
        setResults(data);
        setIsOpen(true);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleFocus = () => {
    if (query.length >= MIN_CHARS) {
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults(null);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleSelect = (item: SearchResult, group: Group) => {
    setIsOpen(false);
    setQuery("");
    setResults(null);
    setActiveIndex(-1);
    router.push(`${group.hrefPrefix}?q=${encodeURIComponent(item.nombre)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || flatItems.length === 0) {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % flatItems.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < flatItems.length) {
          let currentIndex = 0;
          for (const group of groups) {
            if (activeIndex < currentIndex + group.items.length) {
              handleSelect(group.items[activeIndex - currentIndex], group);
              return;
            }
            currentIndex += group.items.length;
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query || query.length < MIN_CHARS) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-accent/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const totalResults = results ? results.results.products.length + results.results.services.length + results.results.logistics.length + results.results.users.length : 0;

  return (
    <div className="relative flex items-center" ref={containerRef}>
      <div className={cn("relative", compact ? "w-48" : "w-64 sm:w-80")}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder="Buscar productos, servicios…"
            className={cn(
              "w-full rounded-lg border bg-background pl-9 pr-8 py-2 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "transition-all duration-150",
              "placeholder:text-muted-foreground",
              isOpen && "rounded-b-none border-b-transparent"
            )}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
            aria-label="Búsqueda global"
            autoComplete="off"
          />
          {query.length > 0 && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Limpiar búsqueda"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {query.length === 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hidden sm:block">
              /
            </span>
          )}
        </div>

        {isOpen && (isLoading || results || error) && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-50 left-0 right-0 top-full mt-1 rounded-lg border bg-card shadow-theme-lg overflow-hidden animate-slide-down"
          >
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Buscando…
              </div>
            )}

            {error && !isLoading && (
              <div className="flex flex-col items-center gap-2 py-4 text-sm text-destructive">
                <span>Error al buscar</span>
                <button
                  onClick={() => {
                    setQuery("");
                    requestAnimationFrame(() => setQuery(query));
                  }}
                  className="text-primary hover:underline text-xs"
                  type="button"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!isLoading && !error && results && totalResults === 0 && (
              <div className="flex flex-col items-center gap-2 py-4 text-sm text-muted-foreground">
                <span>No se encontraron resultados</span>
                <Link
                  href={`/catalogo?q=${encodeURIComponent(query)}`}
                  onClick={() => setIsOpen(false)}
                  className="text-primary hover:underline text-xs"
                >
                  Ver catálogo completo
                </Link>
              </div>
            )}

            {!isLoading && !error && results && totalResults > 0 && (
              <>
                {groups.map((group, groupIndex) => {
                  const groupStartIndex = groups.slice(0, groupIndex).reduce((sum, g) => sum + g.items.length, 0);
                  return (
                    <div key={group.key} className="border-b last:border-b-0">
                      <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.label} ({group.items.length})
                      </div>
                      {group.items.map((item, itemIndex) => {
                        const globalIndex = groupStartIndex + itemIndex;
                        const isActive = globalIndex === activeIndex;
                        return (
                          <button
                            key={`${group.key}-${item.id}`}
                            id={`${listboxId}-option-${globalIndex}`}
                            role="option"
                            aria-selected={isActive}
                            onClick={() => handleSelect(item, group)}
                            className={cn(
                              "w-full text-left px-3 py-2 text-sm transition-colors duration-100",
                              isActive ? "bg-muted text-foreground" : "text-foreground hover:bg-muted/50"
                            )}
                            onMouseEnter={() => setActiveIndex(globalIndex)}
                            type="button"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">{highlightText(item.nombre, query)}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.negocio?.nombre ?? item.email_masked ?? ""}
                                  {item.rol ? ` · ${item.rol}` : ""}
                                </p>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            </div>
                          </button>
                        );
                      })}
                      <div className="px-3 py-1.5 border-t">
                        <Link
                          href={`${group.hrefPrefix}?q=${encodeURIComponent(query)}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          Ver más
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

GlobalSearchBar.displayName = "GlobalSearchBar";
