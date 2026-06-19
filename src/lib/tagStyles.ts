// 카테고리 태그에 따른 배지 색상 클래스
export function tagChipCls(tags: string[]): string {
  if (tags.includes("lesson")) return "bg-violet-50 text-violet-600";
  if (tags.includes("band")) return "bg-teal-50 text-teal-600";
  return "bg-amber-50 text-amber-600";
}
