import { NextRequest, NextResponse } from "next/server";
import { parseSearchQuery } from "@/lib/SearchParser";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ instruments: [], services: [], direction: null });

  const parsed = await parseSearchQuery(q);
  // keywords 중 instruments/services 확장어가 아닌 것 = 미등록 악기 등 raw 토큰
  const knownKws = new Set([...parsed.instruments, ...parsed.services]);
  const rawTokens = parsed.keywords.filter((k) => !knownKws.has(k));
  return NextResponse.json({
    instruments: parsed.instruments,
    services: parsed.services,
    rawTokens,
    direction: parsed.direction,
  });
}
