import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

interface SearchBarProps {
  className?: string;
  initialQuery?: string;
}

export default function SearchBar({ className, initialQuery }: SearchBarProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState(initialQuery || "");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      setLocation(`/search/${encodeURIComponent(query.trim())}`);
      setQuery("");
    } else if (e.key === "Escape") {
      setQuery("");
    }
  };

  return (
    <div ref={searchRef} className={`relative input-container ${className}`}>
      <div className="flex justify-center">
        <div className="relative w-220px">
          <Input
            data-testid="input-search"
            type="text"
            placeholder="Search anime..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input w-full h-10 px-4 transition-colors duration-200 border-2 border-black text-foreground placeholder:text-muted-foreground text-sm uppercase tracking-widest focus:outline-none focus:border-black focus:shadow-[-5px_-5px_0px_black]"
            onFocus={() => {}}
          />
        </div>
      </div>
    </div>
  );
}