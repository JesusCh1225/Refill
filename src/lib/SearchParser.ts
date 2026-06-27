import { INSTRUMENT_DICT } from "@/data/instruments";
import { SERVICE_DICT } from "@/data/Services";
import { extractRegions, RegionResult } from "./regionSearch";

export interface ParsedQuery {
  regions: RegionResult[];
  instruments: string[];
  services: string[];
  keywords: string[];
  direction: "OFFER" | "SEEK" | null;
}

interface AIParsed {
  instruments: string[];
  services: string[];
  direction: "OFFER" | "SEEK" | null;
}

async function parseWithAI(query: string): Promise<AIParsed | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `음악 레슨·밴드합주·악기거래 플랫폼 검색어를 분석해 JSON으로 답해주세요.

검색어: "${query}"

규칙:
- instruments: 언급된 악기 (기타, 베이스, 드럼, 피아노, 건반, 보컬, 관악기, 색소폰, 트럼펫, 플루트, 바이올린, 첼로, DJ, 신디사이저 중 해당하는 것)
- services: 서비스 유형 (레슨, 밴드, 합주, 악기거래, 음향장비 중 해당하는 것)
- direction: 구하는 입장이면 "SEEK", 제공·판매하는 입장이면 "OFFER", 불명확하면 null
  - SEEK 예: "레슨 받고 싶어요", "선생님 구해요", "기타 사고 싶어요", "배우고 싶어요"
  - OFFER 예: "레슨 합니다", "가르쳐드려요", "기타 팝니다", "밴드원 구인"`,
            }],
          }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 100,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                instruments: { type: "ARRAY", items: { type: "STRING" } },
                services: { type: "ARRAY", items: { type: "STRING" } },
                direction: { type: "STRING", nullable: true },
              },
              required: ["instruments", "services", "direction"],
            },
          },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return JSON.parse(text) as AIParsed;
  } catch {
    return null;
  }
}

function expandKeywords(names: string[], dict: Record<string, string[]>): string[] {
  const result: string[] = [];
  for (const name of names) {
    const expanded = dict[name];
    result.push(...(expanded ?? [name]));
  }
  return [...new Set(result)];
}

function extractFromDict(query: string, dict: Record<string, string[]>): string[] {
  const result: string[] = [];
  for (const [key, values] of Object.entries(dict)) {
    if (query.includes(key)) result.push(...values);
  }
  return [...new Set(result)];
}

export async function parseSearchQuery(query: string): Promise<ParsedQuery> {
  const q = query.trim();

  const [regions, aiResult] = await Promise.all([
    extractRegions(q),
    parseWithAI(q),
  ]);

  let instruments: string[];
  let services: string[];
  let direction: "OFFER" | "SEEK" | null;

  if (aiResult) {
    instruments = expandKeywords(aiResult.instruments, INSTRUMENT_DICT);
    services = expandKeywords(aiResult.services, SERVICE_DICT);
    // 밴드/합주는 구인·구직 양방향이 모두 유의미해서 direction 필터 적용 안 함
    const hasBand = aiResult.services.some((s) => ["밴드", "합주"].includes(s));
    direction = hasBand ? null : aiResult.direction;
  } else {
    // dict 폴백
    instruments = extractFromDict(q, INSTRUMENT_DICT);
    services = extractFromDict(q, SERVICE_DICT);
    direction = null;
  }

  const contentKeywords = [...new Set([...instruments, ...services])];
  const keywords =
    contentKeywords.length === 0 && regions.length === 0
      ? q.split(/\s+/).filter(Boolean)
      : contentKeywords;

  return { regions, instruments, services, keywords, direction };
}
