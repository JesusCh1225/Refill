// 행정동 코드 데이터를 받아 src/data/koreaLocations.ts를 재생성한다.
// 출처: kr-juso/administrationCode (행정안전부 공식 데이터 기준 매일 갱신)
// 실행: node scripts/build-admdong.mjs

const SOURCE_URL =
  "https://raw.githubusercontent.com/kr-juso/administrationCode/main/administrationCode.tsv";
const OUTPUT_PATH = new URL("../src/data/koreaLocations.ts", import.meta.url);

const SI_MAP = {
  "서울특별시": "서울",
  "부산광역시": "부산",
  "대구광역시": "대구",
  "인천광역시": "인천",
  "광주광역시": "광주",
  "대전광역시": "대전",
  "울산광역시": "울산",
  "세종특별자치시": "세종",
  "경기도": "경기",
  "강원특별자치도": "강원",
  "충청북도": "충북",
  "충청남도": "충남",
  "전라북도": "전북",
  "전라남도": "전남",
  "경상북도": "경북",
  "경상남도": "경남",
  "제주특별자치도": "제주",
};

const SI_ORDER = [
  "강원", "경기", "경남", "경북", "광주", "대구", "대전", "부산", "서울",
  "세종", "울산", "인천", "전남", "전북", "제주", "충남", "충북",
];

// 소스(kr-juso/administrationCode)가 아직 반영하지 못한 최신 개편 내역 수동 보정.
// si -> { 제거할 gu 이름들, 추가할 GuData[] }
const MANUAL_OVERRIDES = {
  "경기": {
    remove: ["부천시"],
    add: [
      { gu: "부천시 소사구", dongs: ["괴안동", "범박동", "송내1동", "송내2동", "소사본1동", "소사본동", "심곡본1동", "심곡본동", "역곡3동", "옥길동"] },
      { gu: "부천시 오정구", dongs: ["고강1동", "고강본동", "신흥동", "오정동", "성곡동", "원종1동", "원종2동"] },
      { gu: "부천시 원미구", dongs: ["도당동", "상1동", "상2동", "상3동", "상동", "소사동", "심곡1동", "심곡2동", "심곡3동", "약대동", "역곡1동", "역곡2동", "원미1동", "원미2동", "중1동", "중2동", "중3동", "중4동", "중동", "춘의동"] },
    ],
    // 2024.1.1. 부천시 광역동제 폐지, 3구 37동 체제로 복구 (kr-juso 소스 미반영분)
  },
};

async function main() {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`다운로드 실패: ${res.status}`);
  const tsv = await res.text();

  const rows = tsv.split("\n").filter(Boolean).slice(1).map((l) => l.split("\t"));

  const result = new Map(); // si -> Map(gu -> Set(dong))

  for (const [, sidoRaw, sigunguRaw, dongRaw, , revokeRaw] of rows) {
    if (revokeRaw) continue; // 말소된 코드 제외
    const si = SI_MAP[sidoRaw];
    if (!si) continue; // 출장소 등 매핑 안 되는 고아 코드 제외

    if (si === "세종") {
      // 세종은 구 단계가 없어 시군구 컬럼에 읍면동이 직접 들어옴
      if (!sigunguRaw) continue;
      if (!result.has(si)) result.set(si, new Map());
      const gus = result.get(si);
      if (!gus.has("세종특별자치시")) gus.set("세종특별자치시", new Set());
      gus.get("세종특별자치시").add(sigunguRaw);
      continue;
    }

    if (!sigunguRaw) continue; // 시/도 단독 행
    if (!result.has(si)) result.set(si, new Map());
    const gus = result.get(si);
    if (!gus.has(sigunguRaw)) gus.set(sigunguRaw, new Set());
    if (dongRaw) gus.get(sigunguRaw).add(dongRaw);
  }

  // 수동 보정 적용
  for (const [si, { remove, add }] of Object.entries(MANUAL_OVERRIDES)) {
    const gus = result.get(si);
    if (!gus) continue;
    for (const gu of remove) gus.delete(gu);
    for (const { gu, dongs } of add) gus.set(gu, new Set(dongs));
  }

  const collator = new Intl.Collator("ko");

  let out = `export interface GuData { gu: string; dongs?: string[] }\n`;
  out += `export interface SiData { si: string; gus: GuData[] }\n\n`;
  out += `export const KOREA_LOCATIONS: SiData[] = [\n`;

  let totalGu = 0;
  let totalDong = 0;

  for (const si of SI_ORDER) {
    const gus = result.get(si);
    if (!gus) throw new Error(`시도 누락: ${si}`);
    out += `  {\n    si: "${si}",\n    gus: [\n`;
    const guNames = [...gus.keys()]
      .filter((gu) => gus.get(gu).size > 0) // 하위 동이 없는 빈 코드(시 단독/출장소 등) 제외
      .sort(collator.compare);
    for (const gu of guNames) {
      totalGu++;
      const dongs = [...gus.get(gu)].sort(collator.compare);
      totalDong += dongs.length;
      out += `      { gu: "${gu}", dongs: [${dongs.map((d) => `"${d}"`).join(", ")}] },\n`;
    }
    out += `    ],\n  },\n`;
  }
  out += `];\n`;

  const fs = await import("node:fs");
  fs.writeFileSync(OUTPUT_PATH, out, "utf-8");
  console.log(`koreaLocations.ts 생성 완료 — 시도 ${SI_ORDER.length} / 시군구 ${totalGu} / 행정동 ${totalDong}`);
}

main();
