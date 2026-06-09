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
    rec.continuous = true;      // 수동으로 멈출 때까지 계속 인식
    rec.interimResults = true;  // 말하는 도중에도 실시간으로 텍스트 표시

    let accumulated = ""; // 이 세션의 최종 확정된 텍스트

    rec.onresult = (e: any) => {
      // 새로 확정된 부분만 accumulated에 추가
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) accumulated += e.results[i][0].transcript;
      }
      // 아직 확정 안 된 인식 중 텍스트
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) interim += e.results[i][0].transcript;
      }
      // 검색창에 실시간으로 표시
      const live = (accumulated + interim).trim();
      if (live) onChangeRef.current(live);
    };

    rec.onerror = (e: any) => {
      if (e.error === "not-allowed") alert("마이크 사용 권한을 허용해 주세요.");
      setIsListening(false);
      if (recRef.current === rec) recRef.current = null;
    };

    rec.onend = () => {
      // 인식이 끝나면 조사/어미 제거한 키워드로 정리
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
    recRef.current?.stop(); // abort() 대신 stop() → 남은 음성도 처리해서 onend 발생
    recRef.current = null;
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
      <button
        onClick={isListening ? stopListening : startListening}
        title={isListening ? "음성 입력 중지" : "음성으로 검색"}
        className={`shrink-0 border-none cursor-pointer transition-all flex items-center justify-center rounded-full w-8 h-8 ${
          isListening
            ? "bg-red-500 animate-pulse"
            : "bg-transparent opacity-40 hover:opacity-80"
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
      <RpButton variant="round" onClick={() => onSearch()} className="shrink-0">
        →
      </RpButton>
    </div>
  );
}
