// admdongkor 최신 경계 데이터를 기준으로 koreaLocations.ts를 보정한다.
// 원칙:
//  - 추가(add)는 전부 반영 (최신 소스에 실존하는 행정동)
//  - 삭제(remove)는 같은 gu에 추가가 동반된 경우(병합·분동·개명)에만 반영
//  - 삭제만 있고 추가가 없는 경우는 보존 (출장소 등 경계 미수록 가능성 — 코드 기준 소스엔 존재)
//    단, 별도로 사실관계를 확인한 예외는 EXTRA_REMOVE로 명시 처리
import fs from "node:fs";

const SI_MAP = {
  "서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구", "인천광역시": "인천",
  "광주광역시": "광주", "대전광역시": "대전", "울산광역시": "울산", "세종특별자치시": "세종",
  "경기도": "경기", "강원특별자치도": "강원", "충청북도": "충북", "충청남도": "충남",
  "전라북도": "전북", "전북특별자치도": "전북", "전라남도": "전남",
  "경상북도": "경북", "경상남도": "경남", "제주특별자치도": "제주",
};

// 추가 없이 삭제만 확인된 항목 중, 별도 검색으로 사실관계를 확인한 예외
// (경주시 중부동 -> 2025-09-01 황오동으로 통합, 황오동은 기존 데이터에 이미 존재)
const EXTRA_REMOVE = [{ si: "경북", gu: "경주시", dong: "중부동" }];

async function fetchLatestGeo() {
  const listRes = await fetch("https://api.github.com/repos/vuski/admdongkor/contents/");
  const list = await listRes.json();
  const latest = list
    .map((e) => e.name)
    .filter((n) => /^ver\d{8}$/.test(n))
    .sort()
    .pop();
  const fileRes = await fetch(`https://api.github.com/repos/vuski/admdongkor/contents/${latest}`);
  const files = await fileRes.json();
  const geoFile = files.find((f) => f.name.endsWith(".geojson"));
  const geoRes = await fetch(geoFile.download_url);
  return geoRes.json();
}

const geo = await fetchLatestGeo();
const props = geo.features.map((f) => f.properties);

const newData = new Map();
for (const p of props) {
  const si = SI_MAP[p.sidonm];
  if (!si) continue;
  let gu = p.sggnm;
  if (si === "세종") gu = "세종특별자치시";
  else gu = gu.replace(/^(.+시)(.+)$/, "$1 $2");
  const dong = p.adm_nm.trim().split(/\s+/).pop();
  if (!newData.has(si)) newData.set(si, new Map());
  const gus = newData.get(si);
  if (!gus.has(gu)) gus.set(gu, new Set());
  gus.get(gu).add(dong);
}

const src = fs.readFileSync(new URL("../src/data/koreaLocations.ts", import.meta.url), "utf-8");
const arrStart = src.indexOf("= [", src.indexOf("KOREA_LOCATIONS")) + 2;
const code = "const KOREA_LOCATIONS = " + src.slice(arrStart);
const KOREA_LOCATIONS = new Function(code + "\nreturn KOREA_LOCATIONS;")();

const result = new Map(); // si -> Map(gu -> Set(dong))  (기존 데이터를 복사해서 시작)
for (const { si, gus } of KOREA_LOCATIONS) {
  const m = new Map();
  for (const { gu, dongs } of gus) m.set(gu, new Set(dongs ?? []));
  result.set(si, m);
}

const collator = new Intl.Collator("ko");
const log = [];

for (const si of [...newData.keys()].sort(collator.compare)) {
  const newGus = newData.get(si);
  if (!result.has(si)) result.set(si, new Map());
  const oldGus = result.get(si);

  const allGuNames = new Set([...newGus.keys(), ...oldGus.keys()]);
  for (const gu of allGuNames) {
    const newDongs = newGus.get(gu);
    const oldDongs = oldGus.get(gu);

    if (!oldDongs && newDongs) {
      // 새로 생긴 gu (예: 화성시 동탄구 등) — 그대로 추가
      oldGus.set(gu, new Set(newDongs));
      log.push(`[NEW GU] ${si} / ${gu}`);
      continue;
    }
    if (!newDongs && oldDongs) {
      // 최신 소스에서 gu 자체가 사라짐 (예: 화성시 flat 엔트리) — 새 gu들로 대체된 경우만 제거
      const supersededByNewGu = [...newGus.keys()].some((g) => g !== gu && g.startsWith(gu.split(" ")[0]));
      if (supersededByNewGu) {
        oldGus.delete(gu);
        log.push(`[REMOVE GU] ${si} / ${gu} (분할로 대체됨)`);
      }
      continue;
    }
    if (!newDongs || !oldDongs) continue;

    const added = [...newDongs].filter((d) => !oldDongs.has(d));
    const removed = [...oldDongs].filter((d) => !newDongs.has(d));

    for (const d of added) oldDongs.add(d);
    if (added.length) log.push(`[ADD] ${si} / ${gu}: ${added.sort(collator.compare).join(", ")}`);

    if (added.length > 0 && removed.length > 0) {
      for (const d of removed) oldDongs.delete(d);
      log.push(`[REMOVE-PAIRED] ${si} / ${gu}: ${removed.sort(collator.compare).join(", ")}`);
    } else if (removed.length > 0) {
      log.push(`[SKIP-REMOVE] ${si} / ${gu}: ${removed.sort(collator.compare).join(", ")} (대체 없음 — 보존)`);
    }
  }
}

// 별도 확인된 예외 삭제 적용
for (const { si, gu, dong } of EXTRA_REMOVE) {
  const d = result.get(si)?.get(gu);
  if (d?.has(dong)) {
    d.delete(dong);
    log.push(`[EXTRA-REMOVE] ${si} / ${gu}: ${dong} (사실 확인 완료)`);
  }
}

// 출력
const SI_ORDER = [
  "강원", "경기", "경남", "경북", "광주", "대구", "대전", "부산", "서울",
  "세종", "울산", "인천", "전남", "전북", "제주", "충남", "충북",
];

let out = `export interface GuData { gu: string; dongs?: string[] }\n`;
out += `export interface SiData { si: string; gus: GuData[] }\n\n`;
out += `export const KOREA_LOCATIONS: SiData[] = [\n`;

let totalGu = 0, totalDong = 0;
for (const si of SI_ORDER) {
  const gus = result.get(si);
  out += `  {\n    si: "${si}",\n    gus: [\n`;
  const guNames = [...gus.keys()].filter((g) => gus.get(g).size > 0).sort(collator.compare);
  for (const gu of guNames) {
    totalGu++;
    const dongs = [...gus.get(gu)].sort(collator.compare);
    totalDong += dongs.length;
    out += `      { gu: "${gu}", dongs: [${dongs.map((d) => `"${d}"`).join(", ")}] },\n`;
  }
  out += `    ],\n  },\n`;
}
out += `];\n`;

fs.writeFileSync(new URL("../src/data/koreaLocations.ts", import.meta.url), out, "utf-8");
fs.writeFileSync(new URL("./apply-log.txt", import.meta.url), log.join("\n"), "utf-8");
console.log(`완료 — 시도 ${SI_ORDER.length} / 시군구 ${totalGu} / 행정동 ${totalDong}`);
console.log(`로그 ${log.length}줄 -> scripts/apply-log.txt`);
