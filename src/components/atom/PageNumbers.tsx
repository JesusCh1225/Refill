"use client";

interface PageNumbersProps {
  current: number;
  total: number;
  onChange: (page: number) => void;
}

export default function PageNumbers({ current, total, onChange }: PageNumbersProps) {
  if (total <= 1) return null;

  const spread = typeof window !== "undefined" && window.innerWidth < 480 ? 1 : 2;
  const pages: (number | "...")[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > spread + 2) pages.push("...");
    for (let i = Math.max(2, current - spread); i <= Math.min(total - 1, current + spread); i++) pages.push(i);
    if (current < total - spread - 1) pages.push("...");
    pages.push(total);
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-6">
      <button disabled={current === 1} onClick={() => onChange(current - 1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[12px] sm:text-[13px] text-text-muted border border-border-base bg-white disabled:opacity-30 cursor-pointer hover:border-brand hover:text-brand transition-colors">‹</button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[12px] text-text-placeholder">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p)} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[12px] sm:text-[13px] font-semibold border cursor-pointer transition-colors ${p === current ? "bg-brand text-white border-brand" : "bg-white text-text-muted border-border-base hover:border-brand hover:text-brand"}`}>{p}</button>
        )
      )}
      <button disabled={current === total} onClick={() => onChange(current + 1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[12px] sm:text-[13px] text-text-muted border border-border-base bg-white disabled:opacity-30 cursor-pointer hover:border-brand hover:text-brand transition-colors">›</button>
    </div>
  );
}
