"use client";

import { useRef, useCallback, useEffect, RefObject } from "react";
import type { SearchResultItem } from "@/data/sampleMockResults";
import { buildClusters, CoordsMap } from "@/lib/mapUtils";

interface UseNaverMapOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  coordsRef: RefObject<CoordsMap>;
  filteredItemsRef: RefObject<SearchResultItem[]>;
  onMarkerClick: (item: SearchResultItem) => void;
  onGeoError?: () => void;
  onBoundsChange?: () => void;
  onUserLocation?: (lat: number, lng: number) => void;
}

export function useNaverMap({
  containerRef,
  coordsRef,
  filteredItemsRef,
  onMarkerClick,
  onGeoError,
  onBoundsChange,
  onUserLocation,
}: UseNaverMapOptions) {
  const mapObjRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  function escHtml(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;
  const onUserLocationRef = useRef(onUserLocation);
  onUserLocationRef.current = onUserLocation;

  const renderMarkers = useCallback(
    (items: SearchResultItem[], map: any) => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      const clusters = buildClusters(items, map.getZoom(), coordsRef.current);

      clusters.forEach((cluster) => {
        const isCluster = cluster.items.length > 1;
        const content = isCluster
          ? `<div style="background:#8F4BC6;color:#fff;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;box-shadow:0 2px 10px rgba(0,0,0,0.25);border:3px solid #fff;cursor:pointer;">${cluster.items.length}</div>`
          : `<div style="background:#8F4BC6;color:#fff;border-radius:20px;padding:4px 10px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2);cursor:pointer;border:2px solid #fff;">${escHtml(cluster.items[0].imageEmoji)} ${escHtml(cluster.items[0].price)}</div>`;

        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(cluster.lat, cluster.lng),
          map,
          icon: {
            content,
            anchor: new window.naver.maps.Point(isCluster ? 22 : 0, isCluster ? 22 : 0),
          },
        });

        window.naver.maps.Event.addListener(marker, "click", () => {
          if (isCluster) {
            map.setCenter(new window.naver.maps.LatLng(cluster.lat, cluster.lng));
            map.setZoom(map.getZoom() + 3);
          } else {
            onMarkerClick(cluster.items[0]);
          }
        });

        markersRef.current.push(marker);
      });
    },
    [coordsRef, onMarkerClick],
  );

  const initMap = useCallback(() => {
    if (!containerRef.current || mapObjRef.current) return;
    if (!window.naver?.maps?.Map) { setTimeout(initMap, 100); return; }

    const map = new window.naver.maps.Map(containerRef.current, {
      center: new window.naver.maps.LatLng(37.5563, 126.9236),
      zoom: 12,
      mapTypeControl: false,
      scaleControl: false,
      logoControl: false,
      mapDataControl: false,
    });

    mapObjRef.current = map;
    renderMarkers(filteredItemsRef.current, map);

    // 사용자 인터랙션 준비 완료 플래그 — 지오로케이션 이동이 끝난 뒤에 세움
    let interactionReady = false;
    const setReady = () => {
      // 지도 애니메이션이 끝날 시간을 줌
      setTimeout(() => { interactionReady = true; }, 600);
    };

    // 줌 변경: 마커 재렌더 + 준비된 경우에만 bounds-change 알림
    window.naver.maps.Event.addListener(map, "zoom_changed", () => {
      renderMarkers(filteredItemsRef.current, map);
      if (interactionReady) onBoundsChangeRef.current?.();
    });

    // 드래그 종료: 항상 bounds-change 알림 (준비된 경우에만)
    window.naver.maps.Event.addListener(map, "drag_end", () => {
      if (interactionReady) onBoundsChangeRef.current?.();
    });

    // 위치 권한 요청
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude: lat, longitude: lng } }) => {
          map.setCenter(new window.naver.maps.LatLng(lat, lng));
          map.setZoom(14);
          new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(lat, lng),
            map,
            icon: {
              content: `<div style="width:16px;height:16px;border-radius:50%;background:#4A90E2;border:3px solid #fff;box-shadow:0 0 0 4px rgba(74,144,226,0.3);"></div>`,
              anchor: new window.naver.maps.Point(8, 8),
            },
          });
          onUserLocationRef.current?.(lat, lng);
          setReady();
        },
        () => {
          onGeoError?.();
          setReady();
        },
        { timeout: 5000 },
      );
    } else {
      setReady();
    }
  }, [containerRef, filteredItemsRef, renderMarkers]);

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

  return { mapObjRef, renderMarkers };
}
