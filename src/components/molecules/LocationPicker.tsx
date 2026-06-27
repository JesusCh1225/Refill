"use client";

import { useState, useRef, useEffect } from "react";
import { KOREA_LOCATIONS } from "@/data/koreaLocations";

export interface LocationEntry { si: string; gu: string; dong: string }

interface Props {
  value: LocationEntry[];
  onChange: (sel: LocationEntry[]) => void;
}

function entryLabel(e: LocationEntry): string {
  if (e.dong) return `${e.si} › ${e.gu} › ${e.dong}`;
  if (e.gu) return `${e.si} › ${e.gu}`;
  return `${e.si} 전지역`;
}

function sameEntry(a: LocationEntry, b: LocationEntry) {
  return a.si === b.si && a.gu === b.gu && a.dong === b.dong;
}

function Check({ checked }: { checked: boolean }) {
  return (
    <span className={`text-[13px] shrink-0 ${checked ? "text-brand font-bold" : "text-text-placeholder"}`}>
      ✓
    </span>
  );
}

export default function LocationPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LocationEntry[]>(value);
  const [activeSi, setActiveSi] = useState<string>(KOREA_LOCATIONS[0]?.si ?? "");
  const [focusedGu, setFocusedGu] = useState<string>("");
  const ref = useRef<HTMLDivElement>(null);

  // 드롭다운 열릴 때 부모 값으로 내부 상태 동기화
  useEffect(() => {
    if (open) {
      setDraft(value);
      setActiveSi(value[0]?.si || KOREA_LOCATIONS[0]?.si || "");
      setFocusedGu("");
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

  const siData = KOREA_LOCATIONS.find((s) => s.si === activeSi);
  const guData = siData?.gus.find((g) => g.gu === focusedGu);

  const countFor = (si: string) => draft.filter((d) => d.si === si).length;
  const isWholeSiChecked = draft.some((d) => d.si === activeSi && !d.gu);
  const isGuChecked = (gu: string) => draft.some((d) => d.si === activeSi && d.gu === gu && !d.dong);
  const isDongChecked = (gu: string, dong: string) => draft.some((d) => d.si === activeSi && d.gu === gu && d.dong === dong);
  const guPartialCount = (gu: string) => draft.filter((d) => d.si === activeSi && d.gu === gu && d.dong).length;

  const toggleWholeSi = () => {
    if (isWholeSiChecked) {
      setDraft(draft.filter((d) => !(d.si === activeSi && !d.gu)));
    } else {
      setDraft([...draft.filter((d) => d.si !== activeSi), { si: activeSi, gu: "", dong: "" }]);
    }
  };

  const toggleGu = (gu: string) => {
    if (isGuChecked(gu)) {
      setDraft(draft.filter((d) => !(d.si === activeSi && d.gu === gu)));
    } else {
      setDraft([
        ...draft.filter((d) => !(d.si === activeSi && (!d.gu || d.gu === gu))),
        { si: activeSi, gu, dong: "" },
      ]);
    }
  };

  const focusGu = (gu: string) => {
    const gd = siData?.gus.find((g) => g.gu === gu);
    if (gd?.dongs && gd.dongs.length > 0) setFocusedGu((prev) => (prev === gu ? "" : gu));
  };

  const toggleDong = (dong: string) => {
    const gu = focusedGu;
    if (isDongChecked(gu, dong)) {
      setDraft(draft.filter((d) => !(d.si === activeSi && d.gu === gu && d.dong === dong)));
    } else {
      const base = draft.filter((d) => !(d.si === activeSi && d.gu === gu && !d.dong));
      setDraft([...base, { si: activeSi, gu, dong }]);
    }
  };

  const removeEntry = (e: LocationEntry) => setDraft(draft.filter((d) => !sameEntry(d, e)));

  const handleApply = () => {
    onChange(draft);
    setOpen(false);
  };

  const handleClearTrigger = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
    setOpen(false);
  };

  const triggerLabel =
    value.length === 0 ? "지역 선택"
    : value.length === 1 ? entryLabel(value[0])
    : `${entryLabel(value[0])} 외 ${value.length - 1}곳`;
  const isActive = value.length > 0;

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
        <span className="max-w-48 truncate">{triggerLabel}</span>
        {isActive && (
          <span role="button" onClick={handleClearTrigger} className="opacity-70 hover:opacity-100 cursor-pointer ml-0.5" aria-label="지역 초기화">
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
          className="absolute top-full left-0 mt-1 z-50 bg-white rounded-2xl shadow-lg border border-border-base overflow-hidden flex flex-col"
          style={{ width: focusedGu ? "480px" : "320px" }}
        >
          {/* 3컬럼 영역 */}
          <div className="flex" style={{ height: "300px" }}>
            {/* 시/도 컬럼 */}
            <ul className="list-none m-0 p-0 overflow-y-auto border-r border-border-header shrink-0" style={{ width: focusedGu ? "33%" : "50%", scrollbarWidth: "thin" }}>
              {KOREA_LOCATIONS.map((loc) => {
                const c = countFor(loc.si);
                return (
                  <li key={loc.si}>
                    <button
                      onClick={() => { setActiveSi(loc.si); setFocusedGu(""); }}
                      className={`w-full text-left px-3.5 py-3 text-[13px] border-none cursor-pointer flex items-center justify-between gap-1 ${
                        activeSi === loc.si ? "bg-surface-card font-bold text-text-heading" : "bg-transparent font-medium text-text-body hover:bg-surface-card"
                      }`}
                    >
                      <span className="truncate">{loc.si}</span>
                      {c > 0 && (
                        <span className="shrink-0 text-[10px] font-bold text-white bg-brand rounded-full w-4 h-4 flex items-center justify-center">
                          {c}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* 구/군 컬럼 */}
            <ul className="list-none m-0 p-0 overflow-y-auto border-r border-border-header shrink-0" style={{ width: focusedGu ? "33%" : "50%", scrollbarWidth: "thin" }}>
              <li>
                <button
                  onClick={toggleWholeSi}
                  className="w-full text-left px-3.5 py-3 text-[13px] text-text-body border-none bg-transparent cursor-pointer hover:bg-surface-card border-b border-border-header flex items-center gap-2"
                >
                  <Check checked={isWholeSiChecked} />
                  전지역
                </button>
              </li>
              {siData?.gus.map((g) => {
                const partial = guPartialCount(g.gu);
                return (
                  <li key={g.gu}>
                    <div
                      className={`w-full flex items-center border-b border-border-header last:border-0 ${
                        focusedGu === g.gu ? "bg-surface-card" : ""
                      }`}
                    >
                      <button
                        onClick={() => {
                          toggleGu(g.gu);
                          if (g.dongs && g.dongs.length > 0) setFocusedGu(g.gu);
                        }}
                        className="flex-1 text-left px-3.5 py-3 text-[13px] font-medium text-text-body border-none bg-transparent cursor-pointer hover:bg-surface-card flex items-center gap-2 min-w-0"
                      >
                        <Check checked={isGuChecked(g.gu)} />
                        <span className="truncate">{g.gu}</span>
                        {partial > 0 && (
                          <span className="shrink-0 text-[10px] font-bold text-brand">{partial}</span>
                        )}
                      </button>
                      {g.dongs && g.dongs.length > 0 && (
                        <button
                          onClick={() => focusGu(g.gu)}
                          className="px-2.5 py-3 text-text-placeholder border-none bg-transparent cursor-pointer hover:text-brand shrink-0"
                        >
                          ›
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* 동 컬럼 */}
            {focusedGu && guData && (
              <ul className="list-none m-0 p-0 overflow-y-auto shrink-0" style={{ width: "34%", scrollbarWidth: "thin" }}>
                <li>
                  <button
                    onClick={() => toggleGu(focusedGu)}
                    className="w-full text-left px-3.5 py-3 text-[13px] text-text-body border-none bg-transparent cursor-pointer hover:bg-surface-card border-b border-border-header flex items-center gap-2"
                  >
                    <Check checked={isGuChecked(focusedGu)} />
                    전체
                  </button>
                </li>
                {guData.dongs?.map((dong) => (
                  <li key={dong}>
                    <button
                      onClick={() => toggleDong(dong)}
                      className="w-full text-left px-3.5 py-3 text-[13px] font-medium text-text-body border-none bg-transparent cursor-pointer hover:bg-surface-card border-b border-border-header last:border-0 flex items-center gap-2"
                    >
                      <Check checked={isDongChecked(focusedGu, dong)} />
                      <span className="truncate">{dong}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 선택된 지역 칩 */}
          <div className="border-t border-border-header px-3 py-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            {draft.length === 0 ? (
              <span className="text-[12px] text-text-placeholder px-1 py-1">선택된 지역이 없어요</span>
            ) : (
              draft.map((d, i) => (
                <span
                  key={`${d.si}-${d.gu}-${d.dong}-${i}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-body bg-surface-card border border-border-base rounded-full pl-2.5 pr-1.5 py-1"
                >
                  {entryLabel(d)}
                  <button
                    onClick={() => removeEntry(d)}
                    className="text-text-muted hover:text-text-body border-none bg-transparent cursor-pointer leading-none px-0.5"
                    aria-label="선택 해제"
                  >
                    ✕
                  </button>
                </span>
              ))
            )}
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-border-header bg-surface-card">
            <button
              onClick={() => setDraft([])}
              className="flex items-center gap-1 text-[12px] text-text-muted border-none bg-transparent cursor-pointer hover:text-text-body"
            >
              ↻ 초기화
            </button>
            <button
              onClick={handleApply}
              className="h-8 px-4 rounded-full text-[12px] font-semibold bg-brand text-white border-none cursor-pointer hover:opacity-85 transition-opacity"
            >
              적용하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
