import { NextRequest, NextResponse } from "next/server";
import { parseSearchQuery } from "@/lib/SearchParser";
import { MOCK_RESULTS } from "@/data/sampleMockResults";

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query?.trim()) {
    return NextResponse.json({ results: [], keywords: [] });
  }

  /**
   * 🔄 AI로 교체 시 이 줄만 바꾸면 됩니다:
   * const parsed = await parseWithAI(query);
   * ParsedQuery 타입을 반환하면 됩니다.
   */
  const parsed = await parseSearchQuery(query);

  const results = MOCK_RESULTS.filter((item) => {
    // 지역 필터
    const regionMatch =
      parsed.regions.length === 0 ||
      parsed.regions.some((r) =>
        r.keywords.some((rk) =>
          item.locationTags.some((lt) =>
            lt.toLowerCase().includes(rk.toLowerCase()),
          ),
        ),
      );

    // 악기/서비스 필터
    const hasInstrumentOrService =
      parsed.instruments.length > 0 || parsed.services.length > 0;

    const keywordMatch =
      !hasInstrumentOrService ||
      [...parsed.instruments, ...parsed.services].some(
        (kw) =>
          item.title.toLowerCase().includes(kw.toLowerCase()) ||
          item.category.toLowerCase().includes(kw.toLowerCase()) ||
          item.keywords.some((ik) =>
            ik.toLowerCase().includes(kw.toLowerCase()),
          ),
      );

    return regionMatch && keywordMatch;
  });

  return NextResponse.json({
    results,
    keywords: parsed.keywords,
    regions: parsed.regions.map((r) => r.name),
  });
}
