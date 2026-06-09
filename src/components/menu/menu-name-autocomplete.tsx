"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MenuNameSuggestion } from "@/lib/types";
import type { MenuCategoryId } from "@/lib/menu-meta";

interface MenuNameAutocompleteProps {
  categoryId: MenuCategoryId;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

export function MenuNameAutocomplete({
  categoryId,
  value,
  onChange,
  required,
  placeholder,
}: MenuNameAutocompleteProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<MenuNameSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setOpen(false);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      fetch(
        `/api/menu-requests/suggestions?category=${categoryId}&q=${encodeURIComponent(query)}`,
        { cache: "no-store" }
      )
        .then((res) => (res.ok ? res.json() : { suggestions: [] }))
        .then((data: { suggestions?: MenuNameSuggestion[] }) => {
          const next = data.suggestions ?? [];
          setSuggestions(next);
          setOpen(next.length > 0);
          setActiveIndex(-1);
        })
        .catch(() => {
          setSuggestions([]);
          setOpen(false);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [categoryId, value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function selectSuggestion(name: string) {
    onChange(name);
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex].name);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const showDropdown = open && (loading || suggestions.length > 0);

  return (
    <div ref={containerRef} className="relative">
      <Input
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
      />

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-border/70 bg-white py-1 shadow-lg"
        >
          {loading && suggestions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Mencari menu...</p>
          ) : (
            suggestions.map((suggestion, index) => (
              <button
                key={suggestion.name}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-accent",
                  index === activeIndex && "bg-accent"
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion.name)}
              >
                <span className="font-semibold">{suggestion.name}</span>
                <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-primary">
                  📨 {suggestion.requestCount}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {value.trim().length >= 2 && !loading && suggestions.length === 0 && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Menu baru — akan ditambahkan sebagai request baru.
        </p>
      )}
    </div>
  );
}
