"use client";

import Image from "next/image";
import RpButton from "@/components/atom/RpButton";
import micIcon from "@/styles/mic_icon.png";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (voiceQuery?: string) => void;
}

export default function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
  const {
    micStatus, permBlocked, errorMsg, diagInfo,
    startListening, stopListening, clearPermBlocked, clearDiagInfo,
  } = useSpeechRecognition(onChange);

  return (
    <div className="flex flex-col gap-2" style={{ maxWidth: "var(--max-w-search)", width: "100%" }}>
      <div className="w-full mx-auto h-14 sm:h-16 px-4 sm:px-5 bg-white border border-border-base rounded-full shadow-search flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex shrink-0 pr-4 border-r border-border-divider text-base font-bold text-brand">
          ✦ AI 검색
        </div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
          placeholder={
            micStatus === "requesting" ? "마이크 권한 요청 중…" :
            micStatus === "listening"  ? "🎤 말씀해 주세요…" :
            "레슨, 악기, 선생님, 모임 검색…"
          }
          className="flex-1 min-w-0 border-none outline-none text-[15px] sm:text-base text-text-body bg-transparent placeholder-text-placeholder"
        />

        <button
          onClick={(e) => micStatus === "listening" ? stopListening(e) : startListening(e)}
          disabled={micStatus === "requesting"}
          title={micStatus === "listening" ? "음성 입력 중지" : "음성으로 검색"}
          className={`border-none cursor-pointer transition-all flex items-center justify-center rounded-full w-8 h-8 shrink-0 ${
            micStatus === "listening"  ? "bg-red-500 animate-pulse" :
            micStatus === "requesting" ? "bg-yellow-400 cursor-wait" :
            "bg-transparent opacity-40 hover:opacity-80"
          }`}
        >
          {micStatus === "listening" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          ) : micStatus === "requesting" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="3" strokeDasharray="28 56" />
            </svg>
          ) : (
            <Image src={micIcon} alt="음성 검색" width={18} height={18} />
          )}
        </button>

        <RpButton variant="round" onClick={() => onSearch()} className="shrink-0">→</RpButton>
      </div>

      {diagInfo && (
        <div className="mx-4 px-4 py-2 bg-gray-100 border border-gray-300 rounded-2xl text-[11px] text-gray-700 font-mono break-all flex justify-between gap-2">
          <span>{diagInfo}</span>
          <button onClick={clearDiagInfo} className="border-none bg-transparent cursor-pointer text-gray-400 shrink-0">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="mx-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-2xl text-[12px] text-red-700 leading-relaxed">
          ⚠️ {errorMsg}
        </div>
      )}

      {permBlocked && (
        <div className="mx-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-2xl text-[12px] text-orange-900 leading-relaxed shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-bold mb-1.5">🎤 마이크가 차단됨</p>
              <ol className="list-decimal list-inside space-y-1 text-orange-800">
                <li>주소창 <strong>🔒 자물쇠</strong> 클릭 → <strong>사이트 설정</strong></li>
                <li><strong>마이크 → 허용</strong>으로 변경</li>
                <li>페이지 <strong>새로고침</strong> 후 재시도</li>
              </ol>
            </div>
            <button onClick={clearPermBlocked} className="text-orange-400 hover:text-orange-700 border-none bg-transparent cursor-pointer shrink-0 text-base leading-none">✕</button>
          </div>
          <button onClick={() => window.location.reload()} className="mt-3 w-full py-1.5 rounded-xl bg-orange-500 text-white text-[12px] font-semibold border-none cursor-pointer hover:bg-orange-600 transition-colors">
            새로고침
          </button>
        </div>
      )}
    </div>
  );
}
