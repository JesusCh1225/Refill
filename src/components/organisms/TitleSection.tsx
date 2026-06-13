"use client";

import { useState, useRef } from "react";
import SearchBar from "@/components/molecules/SearchBar";
import anim from "@/styles/animations.module.css";

interface TitleSectionProps {
  onSearch: (query: string) => void;
}

export default function TitleSection({ onSearch }: TitleSectionProps) {
  const [query, setQuery] = useState("");
  const queryRef = useRef("");

  const handleSetQuery = (q: string) => {
    queryRef.current = q;
    setQuery(q);
  };

  const handleSearch = (voiceQuery?: string) => {
    const q = voiceQuery ?? queryRef.current;
    if (!q.trim()) return;
    onSearch(q);
  };

  return (
    <main
      className="mx-auto text-center px-4 pt-16 sm:pt-42.5"
      style={{ maxWidth: "var(--max-w-hero)" }}
    >
      <h1
        className={`m-0 font-bold leading-snug text-[32px] sm:text-[46px] md:text-[58px] lg:text-[64px] ${anim.fadeUp}`}
        style={{
          letterSpacing: "-2.5px",
          color: "var(--color-text-primary)",
          animationDelay: "80ms",
        }}
      >
        음악을 더 쉽게{" "}
        <span style={{ color: "var(--color-brand)" }}>채우다.</span>
      </h1>

      <p
        className={`mt-6 mb-8 sm:mb-13 text-[14px] sm:text-[18px] md:text-[22px] leading-relaxed ${anim.fadeUp}`}
        style={{
          color: "var(--color-text-muted)",
          animationDelay: "200ms",
        }}
      >
        AI가 찾아주고, 음악 레슨부터 중고거래까지, <br className="sm:hidden" />
        필요한 순간마다 리필이 연결합니다.
      </p>

      <SearchBar
        value={query}
        onChange={handleSetQuery}
        onSearch={handleSearch}
      />
    </main>
  );
}
