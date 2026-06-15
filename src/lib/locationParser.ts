import { KOREA_LOCATIONS } from "@/data/koreaLocations";

export interface ParsedLocation {
  si: string;
  gu: string;
  dong: string;
  filterVal: string;
  label: string;
  restQuery: string;
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeTerms(query: string, ...terms: string[]): string {
  let q = query;
  for (const t of terms) {
    if (t) q = q.replace(new RegExp(escape(t), "g"), "");
  }
  return q.replace(/\s+/g, " ").trim();
}

/**
 * 검색어에서 지역 정보를 추출합니다.
 * 우선순위: 동 > 구+시 동시 매칭 > 구만 매칭 > 시만 매칭
 */
export function parseLocationFromQuery(query: string): ParsedLocation | null {
  const q = query.trim();
  if (!q) return null;

  // 1) 동 수준 매칭 (가장 구체적)
  for (const siData of KOREA_LOCATIONS) {
    for (const guData of siData.gus) {
      for (const dong of guData.dongs ?? []) {
        if (q.includes(dong)) {
          return {
            si: siData.si,
            gu: guData.gu,
            dong,
            filterVal: dong,
            label: `${siData.si} ${guData.gu} ${dong}`,
            restQuery: removeTerms(q, dong, guData.gu, siData.si),
          };
        }
      }
    }
  }

  // 2) 구 매칭 — 쿼리에 시 이름도 함께 있는 경우 우선
  for (const siData of KOREA_LOCATIONS) {
    if (!q.includes(siData.si)) continue;          // 시가 쿼리에 있어야 우선 진입
    for (const guData of siData.gus) {
      if (q.includes(guData.gu)) {
        return {
          si: siData.si,
          gu: guData.gu,
          dong: "",
          filterVal: guData.gu,
          label: `${siData.si} ${guData.gu}`,
          restQuery: removeTerms(q, guData.gu, siData.si),
        };
      }
    }
  }

  // 3) 구만 매칭 (시 없이) — 첫 번째 발견 도시로
  for (const siData of KOREA_LOCATIONS) {
    for (const guData of siData.gus) {
      if (q.includes(guData.gu)) {
        return {
          si: siData.si,
          gu: guData.gu,
          dong: "",
          filterVal: guData.gu,
          label: `${siData.si} ${guData.gu}`,
          restQuery: removeTerms(q, guData.gu, siData.si),
        };
      }
    }
  }

  // 4) 시만 매칭
  for (const siData of KOREA_LOCATIONS) {
    if (q.includes(siData.si)) {
      return {
        si: siData.si,
        gu: "",
        dong: "",
        filterVal: siData.si,
        label: siData.si,
        restQuery: removeTerms(q, siData.si),
      };
    }
  }

  return null;
}
