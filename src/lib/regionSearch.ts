/**
 * 네이버 지도 api를 활용한 지역 검색
 * 아직 실제 api를 연동하지는 않았음.
 * 실제 데이터도 없기 때문에 smapleMockResult의 locationTags 필드를 활용해서 지역 매칭하는 방식으로 구현.
 * 연결 후 작업 재개할 예정 (2026.05.15)
 *
 * AI로 교체 시 ->
 * extractRegions 함수 전체를 AI API 호출로 대체.
 *
 */

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID ?? "";
const NAVER_CLIENT_SECRET = process.env.NAVER_SEARCH_CLIENT_SECRET ?? "";

const NAVER_GEOCODING_URL =
  "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode";

export interface RegionResult {
  name: string; /* 지역 이름*/
  keywords: string[]; /* 필터링용 키워드*/
}

// 지오코딩 API 없이도 약칭 → 공식명 양방향 검색 가능하도록
const REGION_FULL_NAMES: Record<string, string> = {
  "서울": "서울특별시",
  "인천": "인천광역시",
  "부산": "부산광역시",
  "대구": "대구광역시",
  "광주": "광주광역시",
  "대전": "대전광역시",
  "울산": "울산광역시",
  "세종": "세종특별자치시",
  "경기": "경기도",
  "강원": "강원특별자치도",
  "충북": "충청북도",
  "충남": "충청남도",
  "전북": "전북특별자치도",
  "전남": "전라남도",
  "경북": "경상북도",
  "경남": "경상남도",
  "제주": "제주특별자치도",
};

function extractRegionCandidates(query: string): string[] {
  const candidates: string[] = [];

  // "시", "구", "동", "군", "읍", "면" 패턴 감지
  const suffixPattern = /(\S+?)(시|구|군|동|읍|면)(?=\s|$|에서|에|의)/g;
  let match;
  while ((match = suffixPattern.exec(query)) !== null) {
    candidates.push(match[1] + match[2]); // "서구", "인천시"
    candidates.push(match[1]); // "서", "인천"
  }

  // 광역시/도 직접 감지 — 약칭·공식명 모두 포함
  const knownRegions = Object.keys(REGION_FULL_NAMES);
  for (const region of knownRegions) {
    if (query.includes(region)) {
      candidates.push(region);
      candidates.push(REGION_FULL_NAMES[region]);
    }
    // 공식명으로 검색한 경우 약칭도 추가 ("인천광역시" → "인천")
    const fullName = REGION_FULL_NAMES[region];
    if (query.includes(fullName)) {
      candidates.push(region);
      candidates.push(fullName);
    }
  }

  return [...new Set(candidates)].filter((c) => c.length >= 2);
}

/**
 * 네이버 Geocoding API로 지역명 검증
 */
async function searchRegionFromNaver(
  keyword: string,
): Promise<RegionResult | null> {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    const fullName = REGION_FULL_NAMES[keyword];
    return { name: keyword, keywords: [...new Set([keyword, ...(fullName ? [fullName] : [])])] };
  }

  try {
    const res = await fetch(
      `${NAVER_GEOCODING_URL}?query=${encodeURIComponent(keyword)}`,
      {
        headers: {
          "X-NCP-APIGW-API-KEY-ID": NAVER_CLIENT_ID,
          "X-NCP-APIGW-API-KEY": NAVER_CLIENT_SECRET,
        },
      },
    );

    const data = await res.json();

    if (data.status !== "OK" || data.addresses?.length === 0) return null;

    const first = data.addresses[0];

    // jibunAddress 또는 roadAddress에서 지역명 추출
    const fullAddress: string =
      first.jibunAddress || first.roadAddress || keyword;

    // "인천광역시 서구 ..." → ["인천", "서구", "인천광역시"] 생성
    const parts = fullAddress.split(/\s+/).slice(0, 3); // 시/구/동까지만
    const keywords = [
      ...parts,
      ...parts.map((p) =>
        p.replace(/(특별시|광역시|특별자치시|도|특별자치도)$/, ""),
      ),
      keyword,
    ].filter((k) => k.length >= 2);

    return {
      name: parts.slice(0, 2).join(" "),
      keywords: [...new Set(keywords)],
    };
  } catch {
    const fullName = REGION_FULL_NAMES[keyword];
    return { name: keyword, keywords: [...new Set([keyword, ...(fullName ? [fullName] : [])])] };
  }
}

/**
 * 검색어에서 지역 키워드를 추출합니다.
 *
 * AI로 교체 시 이 함수를 AI API 호출로 대체.
 */
export async function extractRegions(query: string): Promise<RegionResult[]> {
  const candidates = extractRegionCandidates(query);
  if (candidates.length === 0) return [];

  const results = await Promise.all(
    candidates.map((c) => searchRegionFromNaver(c)),
  );

  return results.filter((r): r is RegionResult => r !== null);
}
