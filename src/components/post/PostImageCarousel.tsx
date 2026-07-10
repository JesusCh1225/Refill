"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  imageUrls?: string[];
  imageEmoji: string;
}

function Lightbox({
  imageUrls,
  startIdx,
  onClose,
}: {
  imageUrls: string[];
  startIdx: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIdx);
  const [scale, setScale] = useState(1);

  const prev = () => { setIdx((i) => (i - 1 + imageUrls.length) % imageUrls.length); setScale(1); };
  const next = () => { setIdx((i) => (i + 1) % imageUrls.length); setScale(1); };
  const zoomIn = () => setScale((s) => Math.min(s + 0.5, 4));
  const zoomOut = () => setScale((s) => Math.max(s - 0.5, 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  return createPortal(
    <div
      className="fixed inset-0 z-9999 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 상단 우측 컨트롤 */}
      <div className="absolute top-3 right-3 flex items-center gap-1 z-10" onClick={(e) => e.stopPropagation()}>
        <button onClick={zoomIn} className="w-9 h-9 rounded-full bg-white/10 text-white border-none cursor-pointer flex items-center justify-center hover:bg-white/25 transition-colors" title="확대">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
          </svg>
        </button>
        <button onClick={zoomOut} disabled={scale <= 1} className="w-9 h-9 rounded-full bg-white/10 text-white border-none cursor-pointer flex items-center justify-center hover:bg-white/25 transition-colors disabled:opacity-30" title="축소">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6"/>
          </svg>
        </button>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 text-white border-none cursor-pointer flex items-center justify-center hover:bg-white/25 transition-colors" title="닫기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* 이미지 */}
      <div className="w-full h-full flex items-center justify-center overflow-auto" onClick={(e) => e.stopPropagation()}>
        <img
          src={imageUrls[idx]}
          alt={`이미지 ${idx + 1}`}
          style={{ transform: `scale(${scale})`, transformOrigin: "center", transition: "transform 0.2s" }}
          className="max-w-[90vw] max-h-[90vh] object-contain select-none"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* 좌우 화살표 */}
      {imageUrls.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white border-none cursor-pointer flex items-center justify-center text-xl hover:bg-white/25 transition-colors"
          >‹</button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white border-none cursor-pointer flex items-center justify-center text-xl hover:bg-white/25 transition-colors"
          >›</button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imageUrls.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIdx(i); setScale(1); }}
                className={`w-1.5 h-1.5 rounded-full border-none cursor-pointer transition-all ${i === idx ? "bg-white scale-125" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}

export default function PostImageCarousel({ imageUrls, imageEmoji }: Props) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!imageUrls?.length) {
    return (
      <div className="w-full h-44 sm:h-56 bg-slate-100 flex items-center justify-center text-7xl sm:text-8xl">
        {imageEmoji}
      </div>
    );
  }

  const prev = () => setIdx((i) => (i - 1 + imageUrls.length) % imageUrls.length);
  const next = () => setIdx((i) => (i + 1) % imageUrls.length);

  return (
    <>
      <div className="relative w-full bg-slate-900 overflow-hidden flex items-center justify-center">
        <img
          src={imageUrls[idx]}
          alt={`이미지 ${idx + 1}`}
          className="w-full max-h-130 object-contain cursor-zoom-in"
          onClick={() => setLightbox(true)}
        />
        {imageUrls.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white border-none cursor-pointer flex items-center justify-center text-sm hover:bg-black/60">‹</button>
            <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white border-none cursor-pointer flex items-center justify-center text-sm hover:bg-black/60">›</button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imageUrls.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} className={`w-1.5 h-1.5 rounded-full border-none cursor-pointer transition-all ${i === idx ? "bg-white scale-125" : "bg-white/50"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {lightbox && <Lightbox imageUrls={imageUrls} startIdx={idx} onClose={() => setLightbox(false)} />}
    </>
  );
}
