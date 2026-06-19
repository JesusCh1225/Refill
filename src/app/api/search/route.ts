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
  const trimmed = (query ?? "").trim();

  const where: any = { status: "PUBLISHED" };
  let keywords: string[] = [];
  let regionNames: string[] = [];

  // 빈 쿼리: 위치 기반(근처) 검색용으로 최근 게시글을 폭넓게 가져옴
  if (trimmed) {
    const parsed = await parseSearchQuery(trimmed);
    keywords = parsed.keywords;
    regionNames = parsed.regions.map((r: any) => r.name);

    // 지역 필터
    if (parsed.regions.length > 0) {
      const regionKeywords = parsed.regions.flatMap((r: any) => r.keywords);
      where.locationTags = {
        some: { tag: { in: regionKeywords } },
      };
    }

    // 악기/서비스 키워드 필터
    // parsed.keywords: 사전 매칭 결과, 아무것도 안 맞으면 원본 단어 폴백 (해시태그 직접 검색 등)
    if (parsed.keywords.length > 0) {
      where.OR = parsed.keywords.flatMap((kw: string) => [
        { title: { contains: kw } },
        { hashtags: { some: { hashtag: { name: { contains: kw } } } } },
        { categories: { some: { category: { name: { contains: kw } } } } },
      ]);
    }
  }

  const results = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: trimmed ? 50 : 200,
    select: POST_SELECT,
  });

  const mapped = results.map(mapPost);
  const suggestions = trimmed && mapped.length === 0 ? await getGeminiSuggestions(trimmed) : [];

  return NextResponse.json({
    results: mapped,
    suggestions,
    keywords,
    regions: regionNames,
  });
}
