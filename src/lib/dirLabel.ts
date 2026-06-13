export function dirLabel(tags: string[], direction: "offer" | "seek"): string {
  if (tags.includes("lesson")) return direction === "offer" ? "가르칩니다" : "배웁니다";
  if (tags.includes("band"))   return direction === "offer" ? "모집합니다" : "합류 원합니다";
  return direction === "offer" ? "팝니다" : "삽니다";
}
