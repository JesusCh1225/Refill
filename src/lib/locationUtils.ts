const PROVINCE_ABBR: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원특별자치도: "강원도",
  충청북도: "충북",
  충청남도: "충남",
  전북특별자치도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
  전남광주통합특별시: "광주특별시",
};

/**
 * 카드 표시용 주소 축약
 * - 시·도명을 약칭으로 변환 (강원특별자치도 → 강원도, 전북특별자치도 → 전북 …)
 * - 동/읍/면/리 단위까지만 포함, 이후 도로명·번지는 제거
 * 예) "강원특별자치도 삼척시 신기면 신기역길 89" → "강원도 삼척시 신기면"
 *     "서울특별시 강남구 역삼동 테헤란로 123"     → "서울 강남구 역삼동"
 */
export function trimAddressToDong(address: string): string {
  const tokens = address.trim().split(/\s+/);
  if (tokens.length === 0) return address;

  // 첫 토큰이 시·도명이면 약칭으로 교체
  // 테이블에 없는 신설 행정구역은 접미사 제거로 폴백
  const abbr = PROVINCE_ABBR[tokens[0]]
    ?? tokens[0].replace(/(?:통합특별시|특별자치도|특별자치시|광역시|특별시)$/, "")
    ?? tokens[0];
  tokens[0] = abbr;

  // 마지막 동/읍/면/리 위치 탐색
  let lastDongIdx = -1;
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (/[동읍면리]$/.test(tokens[i])) { lastDongIdx = i; break; }
  }

  // 동/읍/면/리가 없으면 원본 반환 (도로명만 있는 경우 등)
  if (lastDongIdx === -1) return tokens.join(" ");

  return tokens.slice(0, lastDongIdx + 1).join(" ");
}
