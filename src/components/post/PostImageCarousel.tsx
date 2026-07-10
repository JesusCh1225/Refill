"use client";

import { useState, useEffect, useRef } from "react";
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
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const hasDraggedRef = useRef(false);

  const resetTransform = () => { setPos({ x: 0, y: 0 }); };

  const changeIdx = (next: number) => { setIdx(next); setScale(1); resetTransform(); };
  const prev = () => changeIdx((idx - 1 + imageUrls.length) % imageUrls.length);
  const next = () => changeIdx((idx + 1) % imageUrls.length);
  const zoomIn = () => setScale((s) => Math.min(s + 0.5, 4));
  const zoomOut = () => { setScale((s) => { const ns = Math.max(s - 0.5, 1); if (ns === 1) resetTransform(); return ns; }); };

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

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    hasDraggedRef.current = false;
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y };
    setDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDraggedRef.current = true;
    setPos({ x: dragRef.current.originX + dx, y: dragRef.current.originY + dy });
  };

  const onMouseUp = () => { dragRef.current = null; setDragging(false); };

  const handleOverlayClick = () => {
    if (!hasDraggedRef.current) onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-9999 bg-black/90 flex items-center justify-center"
      onClick={handleOverlayClick}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ cursor: dragging ? "grabbing" : "default" }}
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
      <img
        src={imageUrls[idx]}
        alt={`이미지 ${idx + 1}`}
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          transformOrigin: "center",
          transition: dragging ? "none" : "transform 0.2s",
          cursor: dragging ? "grabbing" : "grab",
        }}
        className="max-w-[90vw] max-h-[90vh] object-contain select-none"
        onMouseDown={onMouseDown}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* 좌우 화살표 */}
      {imageUrls.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white border-none cursor-pointer flex items-center justify-center text-xl hover:bg-white/25 transition-colors">‹</button>
          <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white border-none cursor-pointer flex items-center justify-center text-xl hover:bg-white/25 transition-colors">›</button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imageUrls.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); changeIdx(i); }} className={`w-1.5 h-1.5 rounded-full border-none cursor-pointer transition-all ${i === idx ? "bg-white scale-125" : "bg-white/40"}`} />
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
