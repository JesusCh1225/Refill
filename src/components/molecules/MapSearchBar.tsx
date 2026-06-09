"use client";

import { useState, useRef, useEffect } from "react";
import { extractKeywords } from "@/lib/mapUtils";

interface MapSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

type MicStatus = "idle" | "requesting" | "listening";

export default function MapSearchBar({ value, onChange, onSearch, onClear }: MapSearchBarProps) {
  const [micStatus, setMicStatus] = useState<MicStatus>("idle");
  const [permBlocked, setPermBlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const recRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => () => { recRef.current?.stop(); }, []);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 6000);
  };

  const startListening = () => {
    if (micStatus !== "idle") return;

    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) {
      showError("이 브라우저는 음성 인식을 지원하지 않아요. Chrome을 사용해 주세요.");
      return;
    }

    const rec = new SR();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = true;

    let accumulated = "";

    rec.onstart = () => setMicStatus("listening");

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
      console.error("[Mic] SpeechRecognition error:", e.error);
      setMicStatus("idle");
      if (recRef.current === rec) recRef.current = null;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setPermBlocked(true);
      } else if (e.error === "no-speech") {
        showError("음성이 감지되지 않았어요.");
      } else if (e.error !== "aborted") {
        showError(`음성 인식 오류: ${e.error}`);
      }
    };

    rec.onend = () => {
      if (accumulated.trim()) {
        const keywords = extractKeywords(accumulated.trim().toLowerCase());
        onChangeRef.current(keywords.length > 0 ? keywords.join(" ") : accumulated.trim());
      }
      setMicStatus("idle");
      if (recRef.current === rec) recRef.current = null;
    };

    recRef.current = rec;
    try {
      setMicStatus("requesting");
      rec.start();
    } catch (err: any) {
      console.error("[Mic] rec.start() threw:", err);
      setMicStatus("idle");
      showError(`음성 인식 시작 실패: ${err?.message ?? err}`);
    }
  };

  const stopListening = () => {
    recRef.current?.stop();
    recRef.current = null;
    setMicStatus("idle");
  };

  return (
    <div
      className="absolute z-10 top-4 left-4 right-4 md:right-auto flex flex-col gap-1.5"
      style={{ maxWidth: "420px" }}
    >
      <div className="flex items-center gap-2 bg-white rounded-full shadow-search px-4 border border-border-base" style={{ height: "48px" }}>
        <span className="text-sm font-bold text-brand shrink-0">✦</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder={
            micStatus === "requesting" ? "마이크 권한 요청 중…" :
            micStatus === "listening"  ? "🎤 말씀해 주세요…" :
            "지역, 악기, 서비스로 검색"
          }
          className="flex-1 border-none outline-none text-xs text-text-body bg-transparent placeholder:text-text-placeholder"
        />
        {value && micStatus === "idle" && (
          <button onClick={onClear} className="text-text-muted hover:text-text-body text-2xs border-none bg-transparent cursor-pointer shrink-0">
            ✕
          </button>
        )}

        <button
          onClick={micStatus === "listening" ? stopListening : startListening}
          disabled={micStatus === "requesting"}
          title={micStatus === "listening" ? "음성 입력 중지" : "음성으로 검색"}
          className={`border-none cursor-pointer transition-all flex items-center justify-center rounded-full w-7 h-7 shrink-0 ${
            micStatus === "listening"  ? "bg-red-500 animate-pulse" :
            micStatus === "requesting" ? "bg-yellow-400 cursor-wait" :
            "bg-transparent text-text-muted hover:text-brand"
          }`}
        >
          {micStatus === "listening" ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          ) : micStatus === "requesting" ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="3" strokeDasharray="28 56" />
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

      {errorMsg && (
        <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-2xl text-[11px] text-red-700 leading-relaxed shadow-sm">
          ⚠️ {errorMsg}
        </div>
      )}

      {permBlocked && (
        <div className="px-4 py-3 bg-orange-50 border border-orange-200 rounded-2xl text-[11px] text-orange-900 leading-relaxed shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold mb-1">🎤 마이크 권한을 허용해야 해요</p>
              <ol className="list-decimal list-inside space-y-1 text-orange-800">
                <li>주소창 <strong>🔒 자물쇠</strong> 클릭</li>
                <li><strong>사이트 설정 → 마이크 → 허용</strong></li>
                <li>페이지 <strong>새로고침</strong> 후 재시도</li>
              </ol>
            </div>
            <button onClick={() => setPermBlocked(false)} className="text-orange-400 hover:text-orange-700 border-none bg-transparent cursor-pointer shrink-0">✕</button>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 w-full py-1.5 rounded-xl bg-orange-500 text-white text-[11px] font-semibold border-none cursor-pointer hover:bg-orange-600 transition-colors"
          >
            새로고침
          </button>
        </div>
      )}
    </div>
  );
}
