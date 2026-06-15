"use client";

import { useState, useRef, useEffect } from "react";
import { KOREA_LOCATIONS } from "@/data/koreaLocations";

export interface LocationSelection {
  si: string;
  gu: string;
  dong: string;
}

interface Props {
  value: LocationSelection;
  onChange: (sel: LocationSelection) => void;
}

type Step = "si" | "gu" | "dong";

function getLabel({ si, gu, dong }: LocationSelection): string {
  if (dong) return `${si} ${gu} ${dong}`;
  if (gu)   return `${si} ${gu}`;
  if (si)   return si;
  return "전국";
}

function getStep({ si, gu }: LocationSelection): Step {
  if (!si) return "si";
  if (!gu) return "gu";
  return "dong";
}

export default function LocationPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(() => getStep(value));
  const [tempSi, setTempSi] = useState(value.si);
  const [tempGu, setTempGu] = useState(value.gu);
  const ref = useRef<HTMLDivElement>(null);

  // 드롭다운 열릴 때 부모 값으로 내부 상태 동기화
  useEffect(() => {
    if (open) {
      setTempSi(value.si);
      setTempGu(value.gu);
      setStep(getStep(value));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = getLabel(value);
  const isActive = !!value.si;
  const siData = KOREA_LOCATIONS.find((s) => s.si === tempSi);
  const guData = siData?.gus.find((g) => g.gu === tempGu);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ si: "", gu: "", dong: "" });
    setOpen(false);
  };

  const handleSelectSi = (si: string) => {
    setTempSi(si);
    setTempGu("");
    setStep("gu");
  };

  const handleSelectGu = (gu: string) => {
    const gd = siData?.gus.find((g) => g.gu === gu);
    if (!gd?.dongs || gd.dongs.length === 0) {
      onChange({ si: tempSi, gu, dong: "" });
      setOpen(false);
    } else {
      setTempGu(gu);
      setStep("dong");
    }
  };

  const handleSelectDong = (dong: string) => {
    onChange({ si: tempSi, gu: tempGu, dong });
    setOpen(false);
  };

  const goBack = () => {
    if (step === "dong") { setTempGu(""); setStep("gu"); }
    else                 { setTempSi(""); setStep("si"); }
  };

  const headerLabel =
    step === "si"   ? "시/도 선택"
    : step === "gu" ? tempSi
    : `${tempSi} · ${tempGu}`;

  return (
    <div className="relative" ref={ref}>
      {/* 트리거 버튼 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-[14px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
          isActive
            ? "bg-brand text-white border-brand"
            : "bg-white text-text-body border-border-base hover:border-brand"
        }`}
      >
        <span>📍</span>
        <span className="max-w-40 truncate">{label}</span>
        {isActive && (
          <span
            role="button"
            onClick={handleClear}
            className="opacity-70 hover:opacity-100 cursor-pointer ml-0.5"
            aria-label="지역 초기화"
          >
            ✕
          </span>
        )}
        {!isActive && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </button>

      {/* 드롭다운 패널 */}
      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-50 bg-white rounded-2xl shadow-lg border border-border-base overflow-hidden"
          style={{ width: "280px" }}
        >
          {/* 헤더 */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-header bg-surface-card shrink-0">
            {step !== "si" && (
              <button
                onClick={goBack}
                className="text-brand text-[13px] cursor-pointer border-none bg-transparent hover:underline shrink-0 font-semibold"
              >
                ←
              </button>
            )}
            <span className="text-[13px] font-semibold text-text-body flex-1 truncate">
              {headerLabel}
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-text-muted border-none bg-transparent cursor-pointer hover:text-text-body text-[13px] shrink-0 leading-none"
            >
              ✕
            </button>
          </div>

          {/* 목록 */}
          <ul
            className="list-none m-0 p-0 overflow-y-auto"
            style={{ maxHeight: "320px", scrollbarWidth: "thin" }}
          >
            {step === "si" && (
              <>
                <li>
                  <button
                    onClick={() => { onChange({ si: "", gu: "", dong: "" }); setOpen(false); }}
                    className="w-full text-left px-4 py-3 text-[14px] text-text-muted hover:bg-surface-card border-none bg-transparent cursor-pointer border-b border-border-header flex items-center gap-2"
                  >
                    <span className="w-4 h-4 rounded-full border-2 border-text-placeholder flex items-center justify-center shrink-0">
                      {!value.si && <span className="w-2 h-2 rounded-full bg-brand block" />}
                    </span>
                    🌏 전국
                  </button>
                </li>
                {KOREA_LOCATIONS.map((loc) => (
                  <li key={loc.si}>
                    <button
                      onClick={() => handleSelectSi(loc.si)}
                      className="w-full text-left px-4 py-3 text-[14px] font-medium text-text-body hover:bg-surface-card border-none bg-transparent cursor-pointer border-b border-border-header last:border-0 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-text-placeholder flex items-center justify-center shrink-0">
                          {value.si === loc.si && <span className="w-2 h-2 rounded-full bg-brand block" />}
                        </span>
                        {loc.si}
                      </span>
                      <span className="text-text-placeholder text-[12px]">›</span>
                    </button>
                  </li>
                ))}
              </>
            )}

            {step === "gu" && siData && (
              <>
                <li>
                  <button
                    onClick={() => { onChange({ si: tempSi, gu: "", dong: "" }); setOpen(false); }}
                    className="w-full text-left px-4 py-3 text-[14px] text-text-muted hover:bg-surface-card border-none bg-transparent cursor-pointer border-b border-border-header flex items-center gap-2"
                  >
                    <span className="w-4 h-4 rounded-full border-2 border-text-placeholder flex items-center justify-center shrink-0">
                      {value.si === tempSi && !value.gu && <span className="w-2 h-2 rounded-full bg-brand block" />}
                    </span>
                    {tempSi} 전체
                  </button>
                </li>
                {siData.gus.map((g) => (
                  <li key={g.gu}>
                    <button
                      onClick={() => handleSelectGu(g.gu)}
                      className="w-full text-left px-4 py-3 text-[14px] font-medium text-text-body hover:bg-surface-card border-none bg-transparent cursor-pointer border-b border-border-header last:border-0 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-text-placeholder flex items-center justify-center shrink-0">
                          {value.gu === g.gu && value.si === tempSi && <span className="w-2 h-2 rounded-full bg-brand block" />}
                        </span>
                        {g.gu}
                      </span>
                      {g.dongs && g.dongs.length > 0 && (
                        <span className="text-text-placeholder text-[12px]">›</span>
                      )}
                    </button>
                  </li>
                ))}
              </>
            )}

            {step === "dong" && guData && (
              <>
                <li>
                  <button
                    onClick={() => { onChange({ si: tempSi, gu: tempGu, dong: "" }); setOpen(false); }}
                    className="w-full text-left px-4 py-3 text-[14px] text-text-muted hover:bg-surface-card border-none bg-transparent cursor-pointer border-b border-border-header flex items-center gap-2"
                  >
                    <span className="w-4 h-4 rounded-full border-2 border-text-placeholder flex items-center justify-center shrink-0">
                      {value.gu === tempGu && !value.dong && <span className="w-2 h-2 rounded-full bg-brand block" />}
                    </span>
                    {tempGu} 전체
                  </button>
                </li>
                {guData.dongs?.map((dong) => (
                  <li key={dong}>
                    <button
                      onClick={() => handleSelectDong(dong)}
                      className="w-full text-left px-4 py-3 text-[14px] font-medium text-text-body hover:bg-surface-card border-none bg-transparent cursor-pointer border-b border-border-header last:border-0 flex items-center gap-2"
                    >
                      <span className="w-4 h-4 rounded-full border-2 border-text-placeholder flex items-center justify-center shrink-0">
                        {value.dong === dong && value.gu === tempGu && <span className="w-2 h-2 rounded-full bg-brand block" />}
                      </span>
                      {dong}
                    </button>
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
