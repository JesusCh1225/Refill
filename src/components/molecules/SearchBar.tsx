"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import RpButton from "@/components/atom/RpButton";
import micIcon from "@/styles/mic_icon.png";
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

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export default function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // ref로 최신 콜백 유지 — recognition 객체를 재생성하지 않기 위해
  const onChangeRef = useRef(onChange);
  const onSearchRef = useRef(onSearch);
  useEffect(() => { onChangeRef.current = onChange; });
  useEffect(() => { onSearchRef.current = onSearch; });

  // 인식 객체는 마운트 시 딱 한 번만 생성
  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) { setMicSupported(false); return; }

    const rec = new SR();
    rec.lang = "ko-KR";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (e) => {
      const raw = e.results[0][0].transcript.trim();
      // 한국어 조사/어미 제거 후 키워드만 추출
      const keywords = extractKeywords(raw.toLowerCase());
      const query = keywords.length > 0 ? keywords.join(" ") : raw;
      onChangeRef.current(query);
      setIsListening(false);
      // 검색창에 키워드 반영 후 자동 검색
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
        // 이미 시작 중인 경우 무시
        setIsListening(false);
      }
    }
  };

  return (
    <div
      className="w-full mx-auto h-14 sm:h-16 px-4 sm:px-5 bg-white border border-border-base rounded-full shadow-search flex items-center gap-2 sm:gap-3"
      style={{ maxWidth: "var(--max-w-search)" }}
    >
      <div className="hidden sm:flex shrink-0 pr-4 border-r border-border-divider text-base font-bold text-brand">
        ✦ AI 검색
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
        placeholder={isListening ? "🎤 말씀해 주세요…" : "레슨, 악기, 선생님, 모임 검색…"}
        className="flex-1 min-w-0 border-none outline-none text-[15px] sm:text-base text-text-body bg-transparent placeholder-text-placeholder"
      />
      {micSupported && (
        <button
          onClick={handleMicClick}
          title={isListening ? "음성 입력 중지" : "음성으로 검색"}
          className={`shrink-0 border-none bg-transparent cursor-pointer transition-all flex items-center justify-center rounded-full ${
            isListening
              ? "animate-pulse bg-red-50 scale-110 p-1"
              : "opacity-40 hover:opacity-80 p-1"
          }`}
        >
          <Image src={micIcon} alt="음성 검색" width={18} height={18} />
        </button>
      )}
      <RpButton variant="round" onClick={onSearch} className="shrink-0">
        →
      </RpButton>
    </div>
  );
}
