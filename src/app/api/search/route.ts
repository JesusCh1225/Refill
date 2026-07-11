import { NextRequest, NextResponse } from "next/server";
import { parseSearchQuery } from "@/lib/SearchParser";
import { prisma } from "@/lib/prisma";
import { POST_SELECT, mapPost } from "@/lib/postMapper";

async function getGeminiSuggestions(query: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];
  // 프롬프트 인젝션 방어: 따옴표·역슬래시 제거, 100자 제한
  const safeQuery = query.replace(/["'\\]/g, "").trim().slice(0, 100);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `음악 레슨·밴드합주·악기거래 플랫폼에서 사용자가 [${safeQuery}](으)로 검색했는데 결과가 없었습니다. 관련된 검색 키워드 3~5개를 추천해주세요. 키워드만 콤마로 구분해서 답해주세요. 예: 드럼 레슨,드럼 강습,타악기 레슨`,
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

const SEARCH_PAGE_SIZE = 50;

export async function POST(req: NextRequest) {
  const { query, page = 1 } = await req.json();
  const pageNum = Math.max(1, parseInt(String(page)) || 1);
  const trimmed = (query ?? "").trim();

  const where: any = { status: "PUBLISHED" };
  let keywords: string[] = [];
  let regionNames: string[] = [];
  let detectedDirection: "OFFER" | "SEEK" | null = null;

  // 빈 쿼리: 위치 기반(근처) 검색용으로 최근 게시글을 폭넓게 가져옴
  if (trimmed) {
    const parsed = await parseSearchQuery(trimmed);
    keywords = parsed.keywords;
    regionNames = parsed.regions.map((r: any) => r.name);
    detectedDirection = parsed.direction;

    // 지역 필터
    if (parsed.regions.length > 0) {
      const regionKeywords = parsed.regions.flatMap((r: any) => r.keywords);
      where.locationTags = {
        some: { tag: { in: regionKeywords } },
      };
    }

    // 악기/서비스 키워드 필터
    if (parsed.keywords.length > 0) {
      where.OR = parsed.keywords.flatMap((kw: string) => [
        { title: { contains: kw } },
        { hashtags: { some: { hashtag: { name: { contains: kw } } } } },
        { categories: { some: { category: { name: { contains: kw } } } } },
      ]);
    }

    // 의도 방향 필터: 구하는 사람 → OFFER 게시글, 제공하는 사람 → SEEK 게시글
    if (parsed.direction === "SEEK") where.direction = "OFFER";
    else if (parsed.direction === "OFFER") where.direction = "SEEK";
  }

  const [results, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: trimmed ? SEARCH_PAGE_SIZE : 200,
      skip: trimmed ? (pageNum - 1) * SEARCH_PAGE_SIZE : 0,
      select: POST_SELECT,
    }),
    trimmed ? prisma.post.count({ where }) : Promise.resolve(0),
  ]);

  const mapped = results.map(mapPost);
  const suggestions = trimmed && mapped.length === 0 ? await getGeminiSuggestions(trimmed) : [];
  const totalPages = trimmed ? Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE)) : 1;

  return NextResponse.json({
    results: mapped,
    total,
    page: pageNum,
    totalPages,
    suggestions,
    keywords,
    regions: regionNames,
    direction: detectedDirection,
  });
}
