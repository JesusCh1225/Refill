"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/organisms/Header";
import { MOCK_RESULTS, SearchResultItem } from "@/data/sampleMockResults";
import { DUMMY_COORDS } from "@/data/MapdummyCoords";
import MapPanel from "@/components/organisms/MapPanel";
import MapSearchBar from "@/components/molecules/MapSearchBar";

declare global {
  interface Window {
    naver: any;
  }
}

export default function MusicMapPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObjRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [filteredItems, setFilteredItems] =
    useState<SearchResultItem[]>(MOCK_RESULTS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResultItem | null>(
    null,
  );

  /* ── 마커 렌더링 ── */
  const renderMarkers = useCallback((items: SearchResultItem[], map: any) => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    items.forEach((item) => {
      const coords = DUMMY_COORDS[item.id];
      if (!coords) return;

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(coords.lat, coords.lng),
        map,
        icon: {
          content: `
            <div style="
              background:#2563eb;
              color:#fff;
              border-radius:20px;
              padding:4px 10px;
              font-size:12px;
              font-weight:600;
              white-space:nowrap;
              box-shadow:0 2px 8px rgba(0,0,0,0.2);
              cursor:pointer;
              border:2px solid #fff;
            ">${item.imageEmoji} ${item.price}</div>
          `,
          anchor: new window.naver.maps.Point(0, 0),
        },
      });

      window.naver.maps.Event.addListener(marker, "click", () => {
        setSelectedItem(item);
        setPanelOpen(true);
      });

      markersRef.current.push(marker);
    });
  }, []);

  /* ── 지도 초기화 ── */
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.naver) return;

    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(37.5563, 126.9236),
      zoom: 12,
      mapTypeControl: false,
      scaleControl: false,
      logoControl: false,
      mapDataControl: false,
    });

    mapObjRef.current = map;
    renderMarkers(MOCK_RESULTS, map);
  }, [renderMarkers]);

  /* ── 네이버 지도 스크립트 로드 ── */
  useEffect(() => {
    if (document.getElementById("naver-map-script")) {
      if (window.naver) initMap();
      return;
    }
    const script = document.createElement("script");
    script.id = "naver-map-script";
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}`;
    script.async = true;
    script.onload = () => initMap();
    document.head.appendChild(script);
  }, [initMap]);

  /* ── 검색 ── */
  const handleSearch = () => {
    const q = searchInput.trim().toLowerCase();
    const result = q
      ? MOCK_RESULTS.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.keywords.some((kw) => kw.toLowerCase().includes(q)) ||
            item.locationTags.some((lt) => lt.toLowerCase().includes(q)),
        )
      : MOCK_RESULTS;

    setFilteredItems(result);
    setSelectedItem(null);
    setPanelOpen(true);
    if (mapObjRef.current) renderMarkers(result, mapObjRef.current);
  };

  const handleClear = () => {
    setSearchInput("");
    setFilteredItems(MOCK_RESULTS);
    setSelectedItem(null);
    setPanelOpen(false);
    if (mapObjRef.current) renderMarkers(MOCK_RESULTS, mapObjRef.current);
  };

  /* ── 아이템 클릭 → 지도 이동 + 미리보기 ── */
  const handleItemClick = (item: SearchResultItem) => {
    setSelectedItem(item);
    const coords = DUMMY_COORDS[item.id];
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
    // layout.tsx의 body가 min-h-full flex flex-col이므로 flex-1로 남은 높이 채움
    <div className="flex flex-col flex-1">
      <Header />
      {/* 헤더 아래 나머지 전체를 지도 영역으로 */}
      <div className="relative flex-1">
        {/* 네이버 지도 */}
        <div ref={mapRef} className="absolute inset-0" />

        {/* 검색창 오버레이 */}
        <MapSearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSearch={handleSearch}
          onClear={handleClear}
        />

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
    </div>
  );
}
