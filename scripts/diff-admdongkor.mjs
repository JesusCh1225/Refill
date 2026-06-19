// admdongkor(vuski) 최신 GeoJSON과 현재 koreaLocations.ts를 비교해 차이를 출력한다.
// 실행: node scripts/diff-admdongkor.mjs
import fs from "node:fs";

const SI_MAP = {
  "서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구", "인천광역시": "인천",
  "광주광역시": "광주", "대전광역시": "대전", "울산광역시": "울산", "세종특별자치시": "세종",
  "경기도": "경기", "강원특별자치도": "강원", "충청북도": "충북", "충청남도": "충남",
  "전라북도": "전북", "전북특별자치도": "전북", "전라남도": "전남",
  "경상북도": "경북", "경상남도": "경남", "제주특별자치도": "제주",
};

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

// 1) admdongkor 쪽 구조 빌드
const newData = new Map(); // si -> Map(gu -> Set(dong))
for (const p of props) {
  const si = SI_MAP[p.sidonm];
  if (!si) { console.error("UNKNOWN SIDO:", p.sidonm); continue; }

  let gu = p.sggnm;
  if (si === "세종") {
    gu = "세종특별자치시";
  } else {
    // "수원시장안구" -> "수원시 장안구" / "강릉시" -> "강릉시"(그대로)
    gu = gu.replace(/^(.+시)(.+)$/, "$1 $2");
  }

  const dong = p.adm_nm.trim().split(/\s+/).pop();

  if (!newData.has(si)) newData.set(si, new Map());
  const gus = newData.get(si);
  if (!gus.has(gu)) gus.set(gu, new Set());
  gus.get(gu).add(dong);
}

// 2) 현재 koreaLocations.ts 로드
const src = fs.readFileSync(new URL("../src/data/koreaLocations.ts", import.meta.url), "utf-8");
const arrStart = src.indexOf("= [", src.indexOf("KOREA_LOCATIONS")) + 2;
const code = "const KOREA_LOCATIONS = " + src.slice(arrStart);
const KOREA_LOCATIONS = new Function(code + "\nreturn KOREA_LOCATIONS;")();

const oldData = new Map();
for (const { si, gus } of KOREA_LOCATIONS) {
  const m = new Map();
  for (const { gu, dongs } of gus) m.set(gu, new Set(dongs ?? []));
  oldData.set(si, m);
}

// 3) 비교
const collator = new Intl.Collator("ko");
let diffCount = 0;

for (const si of [...newData.keys()].sort(collator.compare)) {
  const newGus = newData.get(si);
  const oldGus = oldData.get(si) ?? new Map();

  const allGuNames = new Set([...newGus.keys(), ...oldGus.keys()]);
  for (const gu of [...allGuNames].sort(collator.compare)) {
    const newDongs = newGus.get(gu);
    const oldDongs = oldGus.get(gu);

    if (!oldDongs) {
      console.log(`[NEW GU] ${si} / ${gu} : ${newDongs ? [...newDongs].sort(collator.compare).join(", ") : "(no dongs)"}`);
      diffCount++;
      continue;
    }
    if (!newDongs) {
      console.log(`[REMOVED GU] ${si} / ${gu} (현재 데이터에만 존재, 최신 소스엔 없음)`);
      diffCount++;
      continue;
    }

    const added = [...newDongs].filter((d) => !oldDongs.has(d));
    const removed = [...oldDongs].filter((d) => !newDongs.has(d));
    if (added.length || removed.length) {
      console.log(`[DIFF] ${si} / ${gu}`);
      if (added.length) console.log(`  + 추가 필요: ${added.sort(collator.compare).join(", ")}`);
      if (removed.length) console.log(`  - 제거 후보: ${removed.sort(collator.compare).join(", ")}`);
      diffCount++;
    }
  }
}

console.log(`\n총 차이 발생 gu 개수: ${diffCount}`);
