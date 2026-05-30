"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/organisms/Header";
import { MOCK_RESULTS, SearchResultItem } from "@/data/sampleMockResults";
import { DUMMY_COORDS } from "@/data/MapdummyCoords";
import MapPanel from "@/components/organisms/MapPanel";
import MapSearchBar from "@/components/molecules/MapSearchBar";
import WritePostModal from "@/components/organisms/WritePostModal";
import { CATEGORIES } from "@/data/Categories";

declare global {
  interface Window {
    naver: any;
    __naverMapInit?: () => void;
  }
}

type CoordsMap = Record<number, { lat: number; lng: number }>;

/* ── 지역 검색 → 지도 이동 ── */
const REGION_CENTERS: Record<
  string,
  { lat: number; lng: number; zoom: number }
> = {
  서울: { lat: 37.5665, lng: 126.978, zoom: 11 },
  인천: { lat: 37.4563, lng: 126.7052, zoom: 12 },
  마포: { lat: 37.5563, lng: 126.9236, zoom: 14 },
  홍대: { lat: 37.5563, lng: 126.9236, zoom: 15 },
  서대문: { lat: 37.5791, lng: 126.9368, zoom: 14 },
  용산: { lat: 37.5326, lng: 126.9905, zoom: 14 },
  강남: { lat: 37.4979, lng: 127.0276, zoom: 14 },
  성동: { lat: 37.5633, lng: 127.0371, zoom: 14 },
  송파: { lat: 37.5146, lng: 127.1057, zoom: 14 },
  노원: { lat: 37.6556, lng: 127.0618, zoom: 14 },
  서구: { lat: 37.5456, lng: 126.6759, zoom: 14 },
};

/* ── 클러스터링 유틸 ── */
type Cluster = { items: SearchResultItem[]; lat: number; lng: number };

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

function buildClusters(
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

// 동일 위치 클러스터를 원형으로 펼침 (겹침 방지)
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

// 지역명으로 근사 좌표 반환
function coordsFromLocation(
  location: string,
  id: number,
): { lat: number; lng: number } {
  const key = Object.keys(REGION_CENTERS).find((k) => location.includes(k));
  const base = key ? REGION_CENTERS[key] : { lat: 37.5665, lng: 126.978 };
  const offset = ((id % 10) - 5) * 0.0002;
  return { lat: base.lat + offset, lng: base.lng + offset };
}

// 자연어 쿼리에서 검색 키워드 추출
function extractKeywords(query: string): string[] {
  const WORD_END_PARTICLES =
    /(에서도|에서는|에서만|에서|에게서|에게|한테서|한테|으로부터|으로서|으로|이라고|이라는|이라서|이랑|이라도|이라면|이지만|하고서|하고|랑|와|과|의|을|를|은|는|이|가|도|만|까지|부터|보다|처럼|같이)$/;

  const tokens = query
    .replace(
      /하고\s*싶어요?|하고\s*싶다|싶어요?|싶다|해\s*줘요?|해요|합니다|주세요|알려줘|찾아줘|있나요?|있어요?|있습니다?|있어|할게요|할까요|하나요|인가요?/g,
      " ",
    )
    .split(/\s+/)
    .map((word) => word.replace(WORD_END_PARTICLES, "").trim())
    .filter((token) => token.length >= 2);

  // 데이터셋에 매칭되지 않는 토큰 제거 (동사·어미 잔재 처리)
  return tokens.filter((token) =>
    MOCK_RESULTS.some(
      (item) =>
        item.title.toLowerCase().includes(token) ||
        item.category.toLowerCase().includes(token) ||
        item.keywords.some((kw) => kw.toLowerCase().includes(token)) ||
        item.locationTags.some((lt) => lt.toLowerCase().includes(token)),
    ),
  );
}

export default function MusicMapPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObjRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const coordsRef = useRef<CoordsMap>({ ...DUMMY_COORDS });

  const [customPosts, setCustomPosts] = useState<SearchResultItem[]>([]);
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [filteredItems, setFilteredItems] =
    useState<SearchResultItem[]>(MOCK_RESULTS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResultItem | null>(
    null,
  );

  const filteredItemsRef = useRef<SearchResultItem[]>(MOCK_RESULTS);
  filteredItemsRef.current = filteredItems;

  /* ── URL 필터 (레슨/마켓 페이지 리다이렉트 처리) ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get("filter");
    if (!filter) return;

    const allItems = [...MOCK_RESULTS, ...customPosts];
    const filtered = allItems.filter((item) => item.tags.includes(filter));
    if (filtered.length > 0) {
      setFilteredItems(filtered);
      filteredItemsRef.current = filtered;
    }
    const label = CATEGORIES.find((c) => c.id === filter)?.label;
    if (label) setSearchInput(label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 마커 렌더링 (클러스터 + 개별) ── */
  const renderMarkers = useCallback((items: SearchResultItem[], map: any) => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const zoom = map.getZoom();
    const clusters = buildClusters(items, zoom, coordsRef.current);

    clusters.forEach((cluster) => {
      const isCluster = cluster.items.length > 1;

      const content = isCluster
        ? `<div style="
            background:#8DC53E;color:#fff;
            border-radius:50%;width:44px;height:44px;
            display:flex;align-items:center;justify-content:center;
            font-size:15px;font-weight:700;
            box-shadow:0 2px 10px rgba(0,0,0,0.25);
            border:3px solid #fff;cursor:pointer;
          ">${cluster.items.length}</div>`
        : `<div style="
            background:#8DC53E;color:#fff;
            border-radius:20px;padding:4px 10px;
            font-size:12px;font-weight:600;white-space:nowrap;
            box-shadow:0 2px 8px rgba(0,0,0,0.2);
            cursor:pointer;border:2px solid #fff;
          ">${cluster.items[0].imageEmoji} ${cluster.items[0].price}</div>`;

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(cluster.lat, cluster.lng),
        map,
        icon: {
          content,
          anchor: new window.naver.maps.Point(
            isCluster ? 22 : 0,
            isCluster ? 22 : 0,
          ),
        },
      });

      if (isCluster) {
        window.naver.maps.Event.addListener(marker, "click", () => {
          map.setCenter(new window.naver.maps.LatLng(cluster.lat, cluster.lng));
          map.setZoom(map.getZoom() + 3);
        });
      } else {
        window.naver.maps.Event.addListener(marker, "click", () => {
          setSelectedItem(cluster.items[0]);
          setPanelOpen(true);
        });
      }

      markersRef.current.push(marker);
    });
  }, []);

  /* ── 지도 초기화 ── */
  const initMap = useCallback(() => {
    if (!mapRef.current || mapObjRef.current) return;
    if (!window.naver?.maps?.Map) {
      setTimeout(initMap, 100);
      return;
    }

    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(37.5563, 126.9236),
      zoom: 12,
      mapTypeControl: false,
      scaleControl: false,
      logoControl: false,
      mapDataControl: false,
    });

    mapObjRef.current = map;
    renderMarkers(filteredItemsRef.current, map);

    // 줌 변경 시 클러스터 재계산
    window.naver.maps.Event.addListener(map, "zoom_changed", () => {
      renderMarkers(filteredItemsRef.current, map);
    });
  }, [renderMarkers]);

  /* ── 네이버 지도 스크립트 로드 ── */
  useEffect(() => {
    window.__naverMapInit = () => initMap();

    if (document.getElementById("naver-map-script")) {
      if (window.naver?.maps) initMap();
      return;
    }

    const script = document.createElement("script");
    script.id = "naver-map-script";
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}&submodules=geocoder&callback=__naverMapInit`;
    script.async = true;
    document.head.appendChild(script);
  }, [initMap]);

  /* ── 새 글 등록 ── */
  const handlePostSubmit = (item: Omit<SearchResultItem, "id">) => {
    const id = Date.now();
    const newPost: SearchResultItem = { ...item, id };

    const addToMap = (lat: number, lng: number) => {
      coordsRef.current[id] = { lat, lng };
      const updated = [...filteredItemsRef.current, newPost];
      setCustomPosts((prev) => [...prev, newPost]);
      setFilteredItems(updated);
      filteredItemsRef.current = updated;
      setPanelOpen(true);
      if (mapObjRef.current) {
        renderMarkers(updated, mapObjRef.current);
        mapObjRef.current.panTo(new window.naver.maps.LatLng(lat, lng));
      }
    };

    // Geocoding API로 정확한 좌표 조회, 실패 시 근사값 사용
    if (window.naver?.maps?.Service) {
      window.naver.maps.Service.geocode(
        { query: item.location },
        (status: any, response: any) => {
          if (
            status === window.naver.maps.Service.Status.OK &&
            response.v2.addresses.length > 0
          ) {
            const { x, y } = response.v2.addresses[0]; // x=lng, y=lat
            addToMap(parseFloat(y), parseFloat(x));
          } else {
            const approx = coordsFromLocation(item.location, id);
            addToMap(approx.lat, approx.lng);
          }
        },
      );
    } else {
      const approx = coordsFromLocation(item.location, id);
      addToMap(approx.lat, approx.lng);
    }
  };

  /* ── 검색 ── */
  const handleSearch = () => {
    const q = searchInput.trim().toLowerCase();
    const allItems = [...MOCK_RESULTS, ...customPosts];

    // 자연어에서 키워드 추출 후 AND 필터
    const tokens = extractKeywords(q);
    const matchesToken = (item: SearchResultItem, token: string) =>
      item.title.toLowerCase().includes(token) ||
      item.category.toLowerCase().includes(token) ||
      item.keywords.some((kw) => kw.toLowerCase().includes(token)) ||
      item.locationTags.some((lt) => lt.toLowerCase().includes(token));
    const result = tokens.length
      ? allItems.filter((item) => tokens.every((t) => matchesToken(item, t)))
      : allItems;

    setFilteredItems(result);
    filteredItemsRef.current = result;
    setSelectedItem(null);
    setPanelOpen(true);

    if (!mapObjRef.current) return;

    // 1순위: 추출된 토큰 중 로컬 테이블 매칭
    const regionKey = Object.keys(REGION_CENTERS).find(
      (key) => tokens.includes(key) || q.includes(key),
    );
    if (regionKey) {
      const { lat, lng, zoom } = REGION_CENTERS[regionKey];
      mapObjRef.current.setCenter(new window.naver.maps.LatLng(lat, lng));
      mapObjRef.current.setZoom(zoom);
      return;
    }

    // 2순위: Geocoding API로 임의 지역 검색
    if (window.naver?.maps?.Service) {
      window.naver.maps.Service.geocode(
        { query: searchInput.trim() },
        (status: any, response: any) => {
          if (
            status === window.naver.maps.Service.Status.OK &&
            response.v2.addresses.length > 0
          ) {
            const { x, y } = response.v2.addresses[0];
            mapObjRef.current?.setCenter(
              new window.naver.maps.LatLng(parseFloat(y), parseFloat(x)),
            );
            mapObjRef.current?.setZoom(14);
          }
        },
      );
      return;
    }

    renderMarkers(result, mapObjRef.current);
  };

  const handleClear = () => {
    const allItems = [...MOCK_RESULTS, ...customPosts];
    setSearchInput("");
    setFilteredItems(allItems);
    filteredItemsRef.current = allItems;
    setSelectedItem(null);
    setPanelOpen(false);
    if (mapObjRef.current) renderMarkers(allItems, mapObjRef.current);
  };

  /* ── 아이템 클릭 → 지도 이동 + 미리보기 ── */
  const handleItemClick = (item: SearchResultItem) => {
    setSelectedItem(item);
    const coords = coordsRef.current[item.id];
    if (coords && mapObjRef.current) {
      mapObjRef.current.panTo(
        new window.naver.maps.LatLng(coords.lat, coords.lng),
      );
    }
  };

  /* ── 상세 페이지 이동 ── */
  const handleDetailClick = (item: SearchResultItem) => {
    router.push(`/market/${item.id}`); // TODO: 실제 라우팅 경로 확정 후 수정
  };

  return (
    // layout.tsx의 body가 h-full flex flex-col이므로 flex-1로 남은 높이 채움
    <div className="flex flex-col flex-1">
      <Header />
      {/* 헤더 아래 나머지 전체를 지도 영역으로 */}
      <div className="relative flex-1">
        {/* 네이버 지도 — absolute 대신 w-full h-full: 라이브러리가 position:relative를 주입하므로 */}
        <div ref={mapRef} className="w-full h-full" />

        {/* 검색창 오버레이 */}
        <MapSearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSearch={handleSearch}
          onClear={handleClear}
        />

        {/* 글쓰기 버튼 */}
        <button
          onClick={() => setWriteModalOpen(true)}
          className="absolute bottom-6 right-6 z-10 flex items-center gap-2 bg-brand text-white text-xs font-semibold px-4 rounded-full border-none cursor-pointer hover:opacity-85 transition-opacity shadow-search"
          style={{ height: "44px" }}
        >
          ✦ 글쓰기
        </button>

        {/* 오른쪽 슬라이드 패널 */}
        <MapPanel
          isOpen={panelOpen}
          items={filteredItems}
          selectedItem={selectedItem}
          onItemClick={handleItemClick}
          onBackToList={() => setSelectedItem(null)}
          onClose={() => {
            setPanelOpen(false);
            setSelectedItem(null);
          }}
          onDetailClick={handleDetailClick}
        />
      </div>

      {/* 글쓰기 모달 */}
      <WritePostModal
        isOpen={writeModalOpen}
        onClose={() => setWriteModalOpen(false)}
        onSubmit={handlePostSubmit}
      />
    </div>
  );
}
