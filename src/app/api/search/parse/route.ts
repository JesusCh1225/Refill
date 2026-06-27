import { NextRequest, NextResponse } from "next/server";
import { parseSearchQuery } from "@/lib/SearchParser";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ instruments: [], services: [], direction: null });

  const parsed = await parseSearchQuery(q);
  return NextResponse.json({
    instruments: parsed.instruments,
    services: parsed.services,
    direction: parsed.direction,
  });
}
