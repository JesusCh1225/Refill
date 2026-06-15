export const NEARBY_KEYWORDS = ["근처", "주변", "가까운", "인근", "가까이"];
export const NEARBY_RADIUS_KM = 10;

export function isNearbyQuery(query: string): boolean {
  return NEARBY_KEYWORDS.some((kw) => query.includes(kw));
}

/** 쿼리에서 "근처/주변/..." 키워드 제거 후 나머지 반환 */
export function stripNearbyKeywords(query: string): string {
  let q = query;
  for (const kw of NEARBY_KEYWORDS) {
    q = q.replace(kw, "");
  }
  return q.replace(/\s+/g, " ").trim();
}

export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function fmtDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}
