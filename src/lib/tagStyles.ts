// 카테고리 태그에 따른 배지 색상 (span 용)
export function tagChipCls(tags: string[]): string {
  if (tags.includes("lesson")) return "bg-violet-50 text-violet-600";
  if (tags.includes("band")) return "bg-teal-50 text-teal-600";
  return "bg-amber-50 text-amber-600";
}

// 카테고리 태그에 따른 링크 칩 색상 (테두리 + hover 포함)
export function tagLinkCls(tags: string[]): string {
  if (tags.includes("lesson"))
    return "bg-violet-50 text-violet-600 border-violet-200 hover:border-violet-400 hover:text-violet-700";
  if (tags.includes("band"))
    return "bg-teal-50 text-teal-600 border-teal-200 hover:border-teal-400 hover:text-teal-700";
  if (tags.includes("instrument") || tags.includes("equipment"))
    return "bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400 hover:text-amber-700";
  return "bg-surface-card text-text-muted border-border-base hover:border-brand hover:text-brand";
}

// direction에 따른 배지 색상
export function directionBadgeCls(direction: "offer" | "seek"): string {
  return direction === "seek" ? "bg-sky-100 text-sky-500" : "bg-brand-bg text-brand";
}
