"use client";

import { useState } from "react";

const STAR_PATH = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

interface StarRatingProps {
  rating: number;
  size?: number;
}

// 표시 전용 별점 (리뷰 목록 등)
export function StarRating({ rating, size = 16 }: StarRatingProps) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= rating ? "#f59e0b" : "#e5e7eb"}>
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

interface InteractiveStarsProps {
  value: number;
  onChange: (v: number) => void;
}

// 클릭/호버로 점수를 매기는 입력용 별점 (리뷰 작성 등)
export function InteractiveStars({ value, onChange }: InteractiveStarsProps) {
  const [hover, setHover] = useState(0);
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="border-none bg-transparent cursor-pointer p-0"
        >
          <svg width={24} height={24} viewBox="0 0 24 24" fill={s <= (hover || value) ? "#f59e0b" : "#e5e7eb"}>
            <path d={STAR_PATH} />
          </svg>
        </button>
      ))}
    </span>
  );
}
