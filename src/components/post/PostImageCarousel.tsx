"use client";

import { useState } from "react";

interface Props {
  imageUrls?: string[];
  imageEmoji: string;
}

export default function PostImageCarousel({ imageUrls, imageEmoji }: Props) {
  const [idx, setIdx] = useState(0);

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
    <div className="relative w-full h-56 sm:h-72 bg-slate-100 overflow-hidden">
      <img src={imageUrls[idx]} alt={`이미지 ${idx + 1}`} className="w-full h-full object-cover" />
      {imageUrls.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white border-none cursor-pointer flex items-center justify-center text-sm hover:bg-black/60"
          >‹</button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white border-none cursor-pointer flex items-center justify-center text-sm hover:bg-black/60"
          >›</button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imageUrls.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full border-none cursor-pointer transition-all ${i === idx ? "bg-white scale-125" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
