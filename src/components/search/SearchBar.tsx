"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setIsOpen(false);
      }
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(query);
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search clips by topic, startup, or concept..."
          className="w-full pl-12 pr-4 py-6 text-lg rounded-xl border-2 border-border/50
                     focus:border-primary focus:ring-2 focus:ring-primary/20
                     transition-all duration-200"
        />
      </div>

      {/* Suggestions dropdown - will be populated with real data later */}
      {isOpen && query.length >= 2 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-background
                        rounded-xl shadow-lg border border-border z-50 overflow-hidden"
        >
          <div className="p-4 text-sm text-muted-foreground">
            Press Enter to search for &quot;{query}&quot;
          </div>
        </div>
      )}
    </div>
  );
}
