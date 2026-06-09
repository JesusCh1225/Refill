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

type MicStatus = "idle" | "requesting" | "listening";

export default function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
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
        showError("음성이 감지되지 않았어요. 마이크에 대고 말씀해 주세요.");
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
          onClick={micStatus === "listening" ? stopListening : startListening}
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

        <RpButton variant="round" onClick={() => onSearch()} className="shrink-0">
          →
        </RpButton>
      </div>

      {/* 일반 오류 */}
      {errorMsg && (
        <div className="mx-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-2xl text-[12px] text-red-700 leading-relaxed">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* 마이크 권한 차단 안내 */}
      {permBlocked && (
        <div className="mx-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-2xl text-[12px] text-orange-900 leading-relaxed shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold mb-1.5">🎤 마이크 권한을 허용해야 해요</p>
              <p className="text-orange-700 mb-2">Chrome이 이 사이트의 마이크를 차단하고 있어요. 아래 순서대로 해제해 주세요.</p>
              <ol className="list-decimal list-inside space-y-1 text-orange-800">
                <li>주소창 왼쪽 <strong>🔒 자물쇠(또는 ℹ️)</strong> 아이콘 클릭</li>
                <li><strong>사이트 설정</strong> 클릭</li>
                <li><strong>마이크</strong> 항목을 <strong>허용</strong>으로 변경</li>
                <li>페이지 <strong>새로고침</strong> 후 다시 시도</li>
              </ol>
            </div>
            <button
              onClick={() => setPermBlocked(false)}
              className="text-orange-400 hover:text-orange-700 border-none bg-transparent cursor-pointer shrink-0 text-base leading-none"
            >
              ✕
            </button>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 w-full py-1.5 rounded-xl bg-orange-500 text-white text-[12px] font-semibold border-none cursor-pointer hover:bg-orange-600 transition-colors"
          >
            새로고침
          </button>
        </div>
      )}
    </div>
  );
}
