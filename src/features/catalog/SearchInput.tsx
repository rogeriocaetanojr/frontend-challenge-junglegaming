/**
 * Campo de Busca com Debounce e Acessibilidade (SearchInput).
 *
 * Em conformidade estrita com WCAG 2.1 AA:
 * - role="searchbox" com rótulo semântico via aria-label.
 * - Resposta visual imediata da digitação mantendo debounce no disparo de onChange.
 * - Botão dedicado para limpar a busca (aria-label="Limpar busca").
 * - Atalho de teclado nativo: pressionar Escape limpa a busca instantaneamente.
 * - Foco visível com anel de destaque (focus-visible:ring-2).
 */
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delayMs?: number;
  "aria-label"?: string;
  className?: string;
  id?: string;
}

export function SearchInput({
  value: controlledValue = "",
  onChange,
  placeholder = "Buscar NFTs por título, coleção...",
  delayMs = 350,
  "aria-label": ariaLabel = "Buscar NFTs",
  className,
  id = "catalog-search-input",
}: SearchInputProps) {
  const [prevControlledValue, setPrevControlledValue] = useState(controlledValue);
  const [localValue, setLocalValue] = useState(controlledValue);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza estado durante a renderização se a prop externa value for alterada
  if (controlledValue !== prevControlledValue) {
    setPrevControlledValue(controlledValue);
    setLocalValue(controlledValue);
  }

  // Limpeza de timers pendentes ao desmontar o componente
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const triggerDebouncedChange = (nextValue: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onChange(nextValue);
    }, delayMs);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setLocalValue(nextVal);
    triggerDebouncedChange(nextVal);
  };

  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setLocalValue("");
    onChange("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClear();
    }
  };

  return (
    <div className={cn("relative flex w-full items-center", className)}>
      <Search
        className="pointer-events-none absolute left-3.5 size-4 text-text-muted"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        role="searchbox"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        spellCheck="false"
        className="h-10 w-full rounded-button border border-border bg-surface-dark pl-10 pr-9 text-sm text-foreground placeholder:text-text-muted transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-search-cancel-button]:hidden"
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpar busca"
          className="absolute right-2.5 flex size-6 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
