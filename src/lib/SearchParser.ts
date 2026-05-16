// 검색 파서
/**
 * 검색어에서 키워드를 추출.
 *
 * AI 모델이 검색어를 분석하여 카테고리와 위치 정보를 추출하는 역할을 합니다.
 *
 * 나중에 AI로 교체하고 지금은 직접 검색어를 파싱해서
 * 키워드를 추출하는 방식으로 구현할 예정입니다.
 *
 * ai 교체시 ->
 * parseSearchQeury 함수 내부를 ai api 호출로 바꿈.
 * ParsedQuery 반환 타입은 그대로 유지
 */

import { INSTRUMENT_DICT } from "@/data/instruments";
import { SERVICE_DICT } from "@/data/Services";
import { extractRegions, RegionResult } from "./regionSearch";

export interface ParsedQuery {
  regions: RegionResult[]; // 지역 키워드
  instruments: string[]; // 악기 키워드
  services: string[]; // 서비스 키워드 (레슨, 밴드, 거래 등)
  keywords: string[]; // 전체 키워드 - 필터링에 사용
}

export async function parseSearchQuery(query: string): Promise<ParsedQuery> {
  const q = query.trim();

  const [regions, instruments, services] = await Promise.all([
    extractRegions(q),
    Promise.resolve(extractFromDict(q, INSTRUMENT_DICT)),
    Promise.resolve(extractFromDict(q, SERVICE_DICT)),
  ]);

  const regionKeywords = regions.flatMap((r) => r.keywords);
  const keywords =
    regionKeywords.length === 0 &&
    instruments.length === 0 &&
    services.length === 0
      ? q.split(/\s+/).filter(Boolean) // 아무것도 매칭 안 되면 원본 단어로 폴백
      : [...new Set([...regionKeywords, ...instruments, ...services])];

  return { regions, instruments, services, keywords };
}

// 데이터 객체에서 키워드 추출
function extractFromDict(
  query: string,
  dict: Record<string, string[]>,
): string[] {
  const result: string[] = [];
  for (const [key, values] of Object.entries(dict)) {
    if (query.includes(key)) result.push(...values);
  }
  return [...new Set(result)];
}
