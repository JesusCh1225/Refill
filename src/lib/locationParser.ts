import { KOREA_LOCATIONS } from "@/data/koreaLocations";

export interface ParsedLocation {
  si: string;
  gu: string;
  dong: string;
  filterVal: string; // 클라이언트 필터용 (dong > gu > si)
  label: string;     // 표시용 (e.g. "인천 남동구 논현동")
  restQuery: string; // 지역 제거 후 남은 검색어
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

/** 검색어에서 지역 정보를 추출합니다. 가장 구체적인 단위(동 > 구 > 시) 기준으로 매칭. */
export function parseLocationFromQuery(query: string): ParsedLocation | null {
  const q = query.trim();
  if (!q) return null;

  // 1) 동 수준 매칭
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

  // 2) 구/군 수준 매칭
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

  // 3) 시/도 수준 매칭
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
