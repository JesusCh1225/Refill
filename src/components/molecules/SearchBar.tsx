"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import RpButton from "@/components/atom/RpButton";
import micIcon from "@/styles/mic_icon.png";
import { extractKeywords } from "@/lib/mapUtils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (voiceQuery?: string) => void;
}

export default function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
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

      <div className="relative shrink-0">
        {permDenied && (
          <div className="absolute bottom-full right-0 mb-2 z-50 bg-gray-900 text-white text-[11px] rounded-xl px-3 py-2 whitespace-nowrap shadow-lg leading-relaxed">
            마이크 권한이 차단되어 있어요.
            <br />
            주소창 왼쪽 🔒 아이콘 → <strong>마이크 → 허용</strong>
            <span className="absolute top-full right-4 border-4 border-transparent border-t-gray-900" />
          </div>
        )}
        <button
          onClick={isListening ? stopListening : startListening}
          title={isListening ? "음성 입력 중지" : "음성으로 검색"}
          className={`border-none cursor-pointer transition-all flex items-center justify-center rounded-full w-8 h-8 ${
            isListening ? "bg-red-500 animate-pulse" : "bg-transparent opacity-40 hover:opacity-80"
          }`}
        >
          {isListening ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          ) : (
            <Image src={micIcon} alt="음성 검색" width={18} height={18} />
          )}
        </button>
      </div>

      <RpButton variant="round" onClick={() => onSearch()} className="shrink-0">
        →
      </RpButton>
    </div>
  );
}
