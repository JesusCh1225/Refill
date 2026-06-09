"use client";

import { useState, useEffect, useRef } from "react";
import { extractKeywords } from "@/lib/mapUtils";

interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface ISpeechRecognitionEvent {
  results: { 0: { transcript: string } }[];
}

interface MapSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

export default function MapSearchBar({ value, onChange, onSearch, onClear }: MapSearchBarProps) {
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const onChangeRef = useRef(onChange);
  const onSearchRef = useRef(onSearch);
  useEffect(() => { onChangeRef.current = onChange; });
  useEffect(() => { onSearchRef.current = onSearch; });

  useEffect(() => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) { setMicSupported(false); return; }

    const rec: ISpeechRecognition = new SR();
    rec.lang = "ko-KR";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (e) => {
      const raw = e.results[0][0].transcript.trim();
      const keywords = extractKeywords(raw.toLowerCase());
      const query = keywords.length > 0 ? keywords.join(" ") : raw;
      onChangeRef.current(query);
      setIsListening(false);
      setTimeout(() => onSearchRef.current(), 150);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);

    recognitionRef.current = rec;
    return () => { rec.abort(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMicClick = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (isListening) {
      rec.stop();
      setIsListening(false);
    } else {
      try {
        rec.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
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
        <button onClick={onClear} className="text-text-muted hover:text-text-body text-2xs border-none bg-transparent cursor-pointer">
          ✕
        </button>
      )}
      {micSupported && (
        <button
          onClick={handleMicClick}
          title={isListening ? "음성 입력 중지" : "음성으로 검색"}
          className={`shrink-0 border-none bg-transparent cursor-pointer transition-all flex items-center justify-center text-base ${
            isListening ? "animate-pulse text-red-500" : "text-text-muted hover:text-brand"
          }`}
        >
          {isListening ? "⏹" : "🎤"}
        </button>
      )}
      <button
        onClick={onSearch}
        className="w-8 h-8 rounded-full bg-brand text-white text-xs flex items-center justify-center border-none cursor-pointer hover:opacity-80 transition-opacity shrink-0"
      >
        →
      </button>
    </div>
  );
}
