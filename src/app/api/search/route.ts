import { NextRequest, NextResponse } from "next/server";
import { parseSearchQuery } from "@/lib/SearchParser";
import { prisma } from "@/lib/prisma";
import { POST_SELECT, mapPost } from "@/lib/postMapper";

async function getGeminiSuggestions(query: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `음악 레슨·밴드합주·악기거래 플랫폼에서 사용자가 "${query}"로 검색했는데 결과가 없었습니다. 관련된 검색 키워드 3~5개를 추천해주세요. 키워드만 콤마로 구분해서 답해주세요. 예: 드럼 레슨,드럼 강습,타악기 레슨`,
            }],
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 80 },
        }),
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return text.split(",").map((s: string) => s.trim()).filter(Boolean).slice(0, 5);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query?.trim()) {
    return NextResponse.json({ results: [], keywords: [] });
  }

  const parsed = await parseSearchQuery(query);

  const where: any = { status: "PUBLISHED" };

  // 지역 필터
  if (parsed.regions.length > 0) {
    const regionKeywords = parsed.regions.flatMap((r: any) => r.keywords);
    where.locationTags = {
      some: { tag: { in: regionKeywords } },
    };
  }

  // 악기/서비스 키워드 필터
  const keywords = [...parsed.instruments, ...parsed.services];
  if (keywords.length > 0) {
    where.OR = keywords.flatMap((kw: string) => [
      { title: { contains: kw } },
      { hashtags: { some: { hashtag: { name: { contains: kw } } } } },
      { categories: { some: { category: { name: { contains: kw } } } } },
    ]);
  }

  const results = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: POST_SELECT,
  });

  const mapped = results.map(mapPost);
  const suggestions = mapped.length === 0 ? await getGeminiSuggestions(query.trim()) : [];

  return NextResponse.json({
    results: mapped,
    suggestions,
    keywords: parsed.keywords,
    regions: parsed.regions.map((r: any) => r.name),
  });
}
