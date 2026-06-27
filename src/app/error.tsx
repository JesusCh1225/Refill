"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface-page flex flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-6xl font-bold text-brand">500</p>
      <p className="text-[18px] font-semibold text-text-heading">문제가 발생했어요</p>
      <p className="text-[14px] text-text-muted">
        일시적인 오류입니다. 잠시 후 다시 시도해 주세요.
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-full bg-brand text-white text-[13px] font-medium hover:opacity-80 transition-opacity border-none cursor-pointer"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-full border border-border-base text-text-body text-[13px] font-medium hover:bg-surface-card transition-colors"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
