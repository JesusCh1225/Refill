"use client";
import { useState, useRef, useEffect } from "react";
import { extractKeywords } from "@/lib/mapUtils";

export type MicStatus = "idle" | "requesting" | "listening";

export function useSpeechRecognition(
  onChange: (value: string) => void,
  { continuous = false }: { continuous?: boolean } = {},
) {
  const [micStatus, setMicStatusState] = useState<MicStatus>("idle");
  const [permBlocked, setPermBlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [diagInfo, setDiagInfo] = useState<string | null>(null);

  const recRef = useRef<any>(null);
  const statusRef = useRef<MicStatus>("idle");
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => () => { try { recRef.current?.abort(); } catch {} }, []);

  const setStatus = (s: MicStatus) => {
    statusRef.current = s;
    setMicStatusState(s);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 6000);
  };

  const startListening = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (statusRef.current !== "idle") return;

    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) {
      showError("이 브라우저는 음성 인식을 지원하지 않아요. Chrome을 사용해 주세요.");
      return;
    }

    setPermBlocked(false);
    setErrorMsg("");

    const rec = new SR();
    rec.lang = "ko-KR";
    rec.continuous = continuous;
    rec.interimResults = true;
    let accumulated = "";

    try {
      rec.start();
      setStatus("requesting");
      recRef.current = rec;
    } catch (err: any) {
      setStatus("idle");
      showError(`음성 인식 시작 실패: ${err?.message ?? err}`);
      return;
    }

    rec.onstart = () => setStatus("listening");

    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) accumulated += event.results[i][0].transcript;
      }
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) interim += event.results[i][0].transcript;
      }
      const live = (accumulated + interim).trim();
      if (live) onChangeRef.current(live);
    };

    rec.onerror = async (errEvent: any) => {
      if (errEvent.error === "aborted") return;
      let permState = "알 수 없음";
      try {
        const ps = await navigator.permissions.query({ name: "microphone" as PermissionName });
        permState = ps.state;
      } catch {}
      const info = `오류: ${errEvent.error} | URL: ${window.location.host} | 보안컨텍스트: ${window.isSecureContext} | 권한: ${permState}`;
      setDiagInfo(info);
      setStatus("idle");
      recRef.current = null;
      if (errEvent.error === "not-allowed" || errEvent.error === "service-not-allowed") {
        setPermBlocked(true);
      } else if (errEvent.error === "no-speech") {
        showError("음성이 감지되지 않았어요. 마이크에 대고 말씀해 주세요.");
      } else {
        showError(`음성 인식 오류: ${errEvent.error}`);
      }
    };

    rec.onend = () => {
      if (accumulated.trim()) {
        const keywords = extractKeywords(accumulated.trim().toLowerCase());
        onChangeRef.current(keywords.length > 0 ? keywords.join(" ") : accumulated.trim());
      }
      setStatus("idle");
      recRef.current = null;
    };
  };

  const stopListening = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    try { recRef.current?.stop(); } catch {}
    setStatus("idle");
    recRef.current = null;
  };

  return {
    micStatus,
    permBlocked,
    errorMsg,
    diagInfo,
    startListening,
    stopListening,
    clearPermBlocked: () => setPermBlocked(false),
    clearDiagInfo: () => setDiagInfo(null),
  };
}
