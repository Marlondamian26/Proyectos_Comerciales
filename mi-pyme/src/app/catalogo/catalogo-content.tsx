"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/ui/SearchInput";
import { useDebounce } from "@/hooks/useDebounce";

interface CatalogoContentProps {
  initialQ: string;
}

export function CatalogoContent({ initialQ }: CatalogoContentProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialQ);
  const debouncedTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedTerm === initialQ) return;

    const currentParams = new URLSearchParams(window.location.search);
    const params = new URLSearchParams();

    const preservedKeys = ["areaId", "subareaId", "disponibleHoy", "orden", "page"];
    for (const key of preservedKeys) {
      const value = currentParams.get(key);
      if (value) params.set(key, value);
    }

    const trimmed = debouncedTerm.trim();
    if (trimmed) {
      params.set("q", trimmed);
    }

    router.replace(`/catalogo?${params.toString()}`, { scroll: false });
  }, [debouncedTerm]); // ⚠️ SOLO debouncedTerm, evita bucles tras router.replace

  return (
    <SearchInput
      name="q"
      value={searchTerm}
      onChange={setSearchTerm}
      placeholder="Buscar productos, servicios, negocios..."
      aria-label="Buscar en catálogo"
    />
  );
}
