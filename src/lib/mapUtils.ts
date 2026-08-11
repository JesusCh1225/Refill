import type { SearchResultItem } from "@/data/sampleMockResults";
import { REGION_CENTERS } from "@/data/mapConstants";

export type CoordsMap = Record<number, { lat: number; lng: number }>;
export type Cluster = { items: SearchResultItem[]; lat: number; lng: number };

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function clusterRadiusKm(zoom: number): number {
  if (zoom >= 14) return 0;
  return 100 / Math.pow(2.5, zoom - 8);
}

function spreadOverlapping(clusters: Cluster[]): Cluster[] {
  const groups = new Map<string, Cluster[]>();
  for (const c of clusters) {
    const key = `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  const result: Cluster[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }
    const offsetDeg = 0.001;
    group.forEach((cluster, i) => {
      const angle = (2 * Math.PI * i) / group.length - Math.PI / 2;
      result.push({
        ...cluster,
        lat: cluster.lat + offsetDeg * Math.cos(angle),
        lng: cluster.lng + offsetDeg * Math.sin(angle),
      });
    });
  }
  return result;
}

export function buildClusters(
  items: SearchResultItem[],
  zoom: number,
  coords: CoordsMap,
): Cluster[] {
  const radius = clusterRadiusKm(zoom);
  const assigned = new Set<number>();
  const clusters: Cluster[] = [];

  for (const item of items) {
    if (assigned.has(item.id)) continue;
    const c = coords[item.id];
    if (!c) continue;

    const group: SearchResultItem[] = [item];
    assigned.add(item.id);

    if (radius > 0) {
      for (const other of items) {
        if (assigned.has(other.id)) continue;
        const oc = coords[other.id];
        if (!oc) continue;
        if (haversineKm(c, oc) <= radius) {
          group.push(other);
          assigned.add(other.id);
        }
      }
    }

    const all = group.map((i) => coords[i.id]).filter(Boolean);
    const lat = all.reduce((s, p) => s + p.lat, 0) / all.length;
    const lng = all.reduce((s, p) => s + p.lng, 0) / all.length;
    clusters.push({ items: group, lat, lng });
  }

  return spreadOverlapping(clusters);
}

export function coordsFromLocation(
  location: string,
  id: number,
): { lat: number; lng: number } {
  // 가장 긴(더 구체적인) 키를 우선 선택 — "인천 서해구"에서 "인천"보다 "서해구"를 먼저 매칭
  const key = Object.keys(REGION_CENTERS)
    .filter((k) => location.includes(k))
    .sort((a, b) => b.length - a.length)[0];
  const base = key ? REGION_CENTERS[key] : { lat: 37.5665, lng: 126.978 };
  const offset = ((id % 10) - 5) * 0.0002;
  return { lat: base.lat + offset, lng: base.lng + offset };
}

// 한국어 조사 및 어미를 제거한 검색 토큰 추출
export function extractKeywords(query: string): string[] {
  const PARTICLES =
    /(에서도|에서는|에서만|에서|에게서|에게|한테서|한테|으로부터|으로서|으로|이라고|이라는|이라서|이랑|이라도|이라면|이지만|하고서|하고|랑|와|과|의|을|를|은|는|이|가|도|만|까지|부터|보다|처럼|같이)$/;

  return query
    .replace(
      /하고\s*싶어요?|하고\s*싶다|싶어요?|싶다|해\s*줘요?|해요|합니다|주세요|알려줘|찾아줘|있나요?|있어요?|있습니다?|있어|할게요|할까요|하나요|인가요?/g,
      " ",
    )
    .split(/\s+/)
    .map((word) => word.replace(PARTICLES, "").trim())
    .filter((token) => token.length >= 2);
}
