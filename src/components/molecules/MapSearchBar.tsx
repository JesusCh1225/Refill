"use client";

import { useState, useRef, useEffect } from "react";
import { extractKeywords } from "@/lib/mapUtils";

interface MapSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

export default function MapSearchBar({ value, onChange, onSearch, onClear }: MapSearchBarProps) {
  const [isListening, setIsListening] = useState(false);
  const recRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => () => { recRef.current?.abort(); }, []);

  const startListening = () => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("음성 검색은 Chrome 또는 Edge 브라우저에서 사용 가능해요.");
      return;
    }

    const rec = new SR();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = true;

    let accumulated = "";

    rec.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) accumulated += e.results[i][0].transcript;
      }
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) interim += e.results[i][0].transcript;
      }
      const live = (accumulated + interim).trim();
      if (live) onChangeRef.current(live);
    };

    rec.onerror = (e: any) => {
      if (e.error === "not-allowed") alert("마이크 사용 권한을 허용해 주세요.");
      setIsListening(false);
      if (recRef.current === rec) recRef.current = null;
    };

    rec.onend = () => {
      if (accumulated.trim()) {
        const keywords = extractKeywords(accumulated.trim().toLowerCase());
        onChangeRef.current(keywords.length > 0 ? keywords.join(" ") : accumulated.trim());
      }
      setIsListening(false);
      if (recRef.current === rec) recRef.current = null;
    };

    recRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    recRef.current?.stop();
    recRef.current = null;
  };

  return (
    <div
      className="absolute z-10 top-4 left-4 right-4 md:right-auto flex items-center gap-2 bg-white rounded-full shadow-search px-4 border border-border-base"
      style={{ height: "48px", maxWidth: "420px" }}
    >
      <span className="text-sm font-bold text-brand shrink-0">✦</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
        placeholder={isListening ? "🎤 말씀해 주세요…" : "지역, 악기, 서비스로 검색"}
        className="flex-1 border-none outline-none text-xs text-text-body bg-transparent placeholder:text-text-placeholder"
      />
      {value && !isListening && (
        <button onClick={onClear} className="text-text-muted hover:text-text-body text-2xs border-none bg-transparent cursor-pointer shrink-0">
          ✕
        </button>
      )}
      <button
        onClick={isListening ? stopListening : startListening}
        title={isListening ? "음성 입력 중지" : "음성으로 검색"}
        className={`shrink-0 border-none cursor-pointer transition-all flex items-center justify-center rounded-full w-7 h-7 ${
          isListening
            ? "bg-red-500 animate-pulse"
            : "bg-transparent text-text-muted hover:text-brand"
        }`}
      >
        {isListening ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        ) : (
          <span className="text-sm">🎤</span>
        )}
      </button>
      <button
        onClick={onSearch}
        className="w-8 h-8 rounded-full bg-brand text-white text-xs flex items-center justify-center border-none cursor-pointer hover:opacity-80 transition-opacity shrink-0"
      >
        →
      </button>
    </div>
  );
}
