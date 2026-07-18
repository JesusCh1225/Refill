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

type MobileStep = "si" | "gu" | "dong";

export default function LocationPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LocationEntry[]>(value);
  const [activeSi, setActiveSi] = useState<string>(KOREA_LOCATIONS[0]?.si ?? "");
  const [focusedGu, setFocusedGu] = useState<string>("");
  const [mobileStep, setMobileStep] = useState<MobileStep>("si");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setDraft(value);
      setActiveSi(value[0]?.si || KOREA_LOCATIONS[0]?.si || "");
      setFocusedGu("");
      setMobileStep("si");
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

      {/* 데스크톱 드롭다운 */}
      {open && (
        <div
          className="hidden sm:flex absolute top-full left-0 mt-1 z-50 bg-white rounded-2xl shadow-lg border border-border-base overflow-hidden flex-col"
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
      {/* 모바일 바텀시트 */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          {/* 시트 */}
          <div className="relative bg-white rounded-t-2xl flex flex-col" style={{ maxHeight: "82vh" }}>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-base shrink-0">
              <div className="flex items-center gap-2">
                {mobileStep !== "si" && (
                  <button
                    onClick={() => mobileStep === "dong" ? setMobileStep("gu") : setMobileStep("si")}
                    className="text-text-muted border-none bg-transparent cursor-pointer text-[20px] leading-none mr-1 p-0"
                  >
                    ←
                  </button>
                )}
                <h3 className="text-[16px] font-bold text-text-heading">
                  {mobileStep === "si" && "시/도 선택"}
                  {mobileStep === "gu" && `${activeSi}`}
                  {mobileStep === "dong" && `${activeSi} ${focusedGu}`}
                </h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-text-muted border-none bg-transparent cursor-pointer text-[18px] leading-none p-0">
                ✕
              </button>
            </div>

            {/* 리스트 */}
            <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: "none" }}>
              {/* 시/도 */}
              {mobileStep === "si" && (
                <ul className="list-none m-0 p-0">
                  {KOREA_LOCATIONS.map((loc) => {
                    const c = countFor(loc.si);
                    return (
                      <li key={loc.si} className="border-b border-border-base last:border-0">
                        <button
                          onClick={() => { setActiveSi(loc.si); setMobileStep("gu"); setFocusedGu(""); }}
                          className="w-full flex items-center justify-between px-4 py-3.5 text-[14px] border-none bg-transparent cursor-pointer active:bg-surface-card"
                        >
                          <span className={activeSi === loc.si ? "font-bold text-brand" : "font-medium text-text-body"}>{loc.si}</span>
                          <div className="flex items-center gap-2">
                            {c > 0 && (
                              <span className="text-[10px] font-bold text-white bg-brand rounded-full w-5 h-5 flex items-center justify-center">{c}</span>
                            )}
                            <span className="text-text-placeholder text-[16px]">›</span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* 구/군 */}
              {mobileStep === "gu" && (
                <ul className="list-none m-0 p-0">
                  <li className="border-b border-border-base">
                    <button onClick={toggleWholeSi} className="w-full flex items-center gap-3 px-4 py-3.5 text-[14px] border-none bg-transparent cursor-pointer active:bg-surface-card">
                      <Check checked={isWholeSiChecked} />
                      <span className="text-text-body font-medium">전지역</span>
                    </button>
                  </li>
                  {siData?.gus.map((g) => {
                    const partial = guPartialCount(g.gu);
                    return (
                      <li key={g.gu} className="border-b border-border-base last:border-0">
                        <div className="flex items-center">
                          <button onClick={() => toggleGu(g.gu)} className="flex-1 flex items-center gap-3 px-4 py-3.5 text-[14px] font-medium border-none bg-transparent cursor-pointer active:bg-surface-card">
                            <Check checked={isGuChecked(g.gu)} />
                            <span className="text-text-body">{g.gu}</span>
                            {partial > 0 && <span className="text-brand text-[12px] font-bold">{partial}</span>}
                          </button>
                          {g.dongs && g.dongs.length > 0 && (
                            <button
                              onClick={() => { setFocusedGu(g.gu); setMobileStep("dong"); }}
                              className="px-4 py-3.5 text-text-placeholder border-none bg-transparent cursor-pointer text-[18px]"
                            >
                              ›
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* 동 */}
              {mobileStep === "dong" && guData && (
                <ul className="list-none m-0 p-0">
                  <li className="border-b border-border-base">
                    <button onClick={() => toggleGu(focusedGu)} className="w-full flex items-center gap-3 px-4 py-3.5 text-[14px] border-none bg-transparent cursor-pointer active:bg-surface-card">
                      <Check checked={isGuChecked(focusedGu)} />
                      <span className="text-text-body font-medium">전체</span>
                    </button>
                  </li>
                  {guData.dongs?.map((dong) => (
                    <li key={dong} className="border-b border-border-base last:border-0">
                      <button onClick={() => toggleDong(dong)} className="w-full flex items-center gap-3 px-4 py-3.5 text-[14px] font-medium border-none bg-transparent cursor-pointer active:bg-surface-card">
                        <Check checked={isDongChecked(focusedGu, dong)} />
                        <span className="text-text-body">{dong}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 선택된 지역 칩 */}
            {draft.length > 0 && (
              <div className="px-4 py-2.5 flex flex-wrap gap-1.5 max-h-20 overflow-y-auto border-t border-border-base shrink-0" style={{ scrollbarWidth: "thin" }}>
                {draft.map((d, i) => (
                  <span key={`${d.si}-${d.gu}-${d.dong}-${i}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-body bg-surface-card border border-border-base rounded-full pl-2.5 pr-1.5 py-1">
                    {entryLabel(d)}
                    <button onClick={() => removeEntry(d)} className="text-text-muted border-none bg-transparent cursor-pointer">✕</button>
                  </span>
                ))}
              </div>
            )}

            {/* 푸터 */}
            <div className="flex items-center justify-between px-4 py-3.5 border-t border-border-base shrink-0 bg-surface-card">
              <button onClick={() => setDraft([])} className="text-[13px] text-text-muted border-none bg-transparent cursor-pointer">↻ 초기화</button>
              <button onClick={handleApply} className="h-10 px-6 rounded-full text-[13px] font-semibold bg-brand text-white border-none cursor-pointer">적용하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
