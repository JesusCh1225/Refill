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
  const [permDenied, setPermDenied] = useState(false);
  const recRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => () => {
    recRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const startListening = async () => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) {
      setPermDenied(true);
      setTimeout(() => setPermDenied(false), 4000);
      return;
    }

    // getUserMedia로 마이크 접근 권한 획득 — 브라우저 기본 다이얼로그 표시
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch {
      setPermDenied(true);
      setTimeout(() => setPermDenied(false), 5000);
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
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setPermDenied(true);
        setTimeout(() => setPermDenied(false), 5000);
      }
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setIsListening(false);
      if (recRef.current === rec) recRef.current = null;
    };

    rec.onend = () => {
      // 인식 종료 시 스트림 해제
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
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
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setIsListening(false);
    }
  };

  const stopListening = () => {
    // stop()은 onend를 발생시켜 거기서 스트림도 해제됨
    recRef.current?.stop();
    recRef.current = null;
    setIsListening(false);
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

      <div className="relative shrink-0">
        {permDenied && (
          <div className="absolute bottom-full right-0 mb-2 z-50 bg-gray-900 text-white text-[11px] rounded-xl px-3 py-2 whitespace-nowrap shadow-lg leading-relaxed">
            마이크 권한이 차단되어 있어요.
            <br />
            주소창 🔒 → <strong>마이크 → 허용</strong>
            <span className="absolute top-full right-3 border-4 border-transparent border-t-gray-900" />
          </div>
        )}
        <button
          onClick={isListening ? stopListening : startListening}
          title={isListening ? "음성 입력 중지" : "음성으로 검색"}
          className={`border-none cursor-pointer transition-all flex items-center justify-center rounded-full w-7 h-7 ${
            isListening ? "bg-red-500 animate-pulse" : "bg-transparent text-text-muted hover:text-brand"
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
      </div>

      <button
        onClick={onSearch}
        className="w-8 h-8 rounded-full bg-brand text-white text-xs flex items-center justify-center border-none cursor-pointer hover:opacity-80 transition-opacity shrink-0"
      >
        →
      </button>
    </div>
  );
}
