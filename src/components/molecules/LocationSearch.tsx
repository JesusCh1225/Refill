"use client";

import { useState, useEffect, useRef } from "react";
import type { PlaceResult } from "@/app/api/places/route";

interface LocationSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceResult) => void;
  placeholder?: string;
}

export default function LocationSearch({
  value,
  onChange,
  onSelect,
  placeholder = "장소명 또는 주소를 입력하세요",
}: LocationSearchProps) {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    setSelected(false);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (v.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(v.trim())}`);
        const data: PlaceResult[] = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setOpen(Array.isArray(data) && data.length > 0);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = (place: PlaceResult) => {
    onChange(place.roadAddress || place.address);
    onSelect(place);
    setSelected(true);
    setOpen(false);
    setResults([]);
  };

  const lastCategory = (cat: string) =>
    cat.split(">").pop()?.split(",").pop()?.trim() ?? "";

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => results.length > 0 && !selected && setOpen(true)}
          placeholder={placeholder}
          className={`w-full h-10 px-3 pr-8 rounded-lg border text-[13px] text-text-body placeholder:text-text-placeholder focus:outline-none transition-colors ${
            selected
              ? "border-brand bg-brand-bg"
              : "border-border-base focus:border-brand"
          }`}
        />
        {loading ? (
          <span className="absolute right-3 text-[11px] text-text-muted animate-pulse">검색중</span>
        ) : selected ? (
          <svg className="absolute right-3 text-brand" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg className="absolute right-3 text-text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        )}
      </div>

      {open && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-border-base rounded-xl shadow-search overflow-hidden">
          {results.map((place, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handleSelect(place)}
                className="w-full px-4 py-3 text-left hover:bg-surface-card transition-colors border-none bg-transparent cursor-pointer border-b border-border-base last:border-b-0"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] font-semibold text-text-heading truncate">
                    {place.name}
                  </span>
                  {place.category && (
                    <span className="text-[10px] font-semibold text-brand bg-brand-bg px-1.5 py-0.5 rounded-full shrink-0">
                      {lastCategory(place.category)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted truncate">
                  {place.roadAddress || place.address}
                </p>
                {place.telephone && (
                  <p className="text-[11px] text-text-placeholder mt-0.5">{place.telephone}</p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
