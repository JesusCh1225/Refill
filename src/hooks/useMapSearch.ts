"use client";

import { useCallback } from "react";
import type { MutableRefObject } from "react";
import type { SearchResultItem } from "@/data/sampleMockResults";
import { CATEGORIES, CATEGORY_TAG_MAP } from "@/data/Categories";
import { REGION_CENTERS } from "@/data/mapConstants";
import { extractKeywords, type CoordsMap } from "@/lib/mapUtils";

declare global {
  interface Window { naver: any; }
}

function matchesToken(item: SearchResultItem, token: string): boolean {
  const t = token.toLowerCase();
  return (
    item.title.toLowerCase().includes(t) ||
    item.category.toLowerCase().includes(t) ||
    item.keywords.some((kw) => kw.toLowerCase().includes(t)) ||
    item.locationTags.some((lt) => lt.toLowerCase().includes(t))
  );
}

export function applyChipFilter(items: SearchResultItem[], chip: string): SearchResultItem[] {
  return chip === "all" ? items : items.filter((item) =>
    (CATEGORY_TAG_MAP[chip] ?? []).some((tag) => item.tags.includes(tag)),
  );
}

interface UseMapSearchParams {
  allPosts: SearchResultItem[];
  chipFilter: string;
  coordsRef: MutableRefObject<CoordsMap>;
  filteredItemsRef: MutableRefObject<SearchResultItem[]>;
  mapObjRef: MutableRefObject<any>;
  setFilteredItems: (items: SearchResultItem[]) => void;
  setSelectedItem: (item: SearchResultItem | null) => void;
  setPanelOpen: (open: boolean) => void;
  setShowAreaSearch: (v: boolean) => void;
  setChipFilter: (id: string) => void;
  setSearchInput: (v: string) => void;
  renderMarkers: (items: SearchResultItem[], map: any) => void;
}

export function useMapSearch({
  allPosts,
  chipFilter,
  coordsRef,
  filteredItemsRef,
  mapObjRef,
  setFilteredItems,
  setSelectedItem,
  setPanelOpen,
  setShowAreaSearch,
  setChipFilter,
  setSearchInput,
  renderMarkers,
}: UseMapSearchParams) {
  const filterByBounds = useCallback((items: SearchResultItem[]) => {
    if (!mapObjRef.current) return items;
    const bounds = mapObjRef.current.getBounds();
    const inBounds = items.filter((item) => {
      const coords = coordsRef.current[item.id];
      return coords ? bounds.hasLatLng(new window.naver.maps.LatLng(coords.lat, coords.lng)) : false;
    });
    return inBounds.length > 0 ? inBounds : items;
  }, [mapObjRef, coordsRef]);

  const applyAndRender = useCallback((items: SearchResultItem[]) => {
    setFilteredItems(items);
    filteredItemsRef.current = items;
    setSelectedItem(null);
    setPanelOpen(true);
    if (mapObjRef.current) renderMarkers(items, mapObjRef.current);
  }, [setFilteredItems, filteredItemsRef, setSelectedItem, setPanelOpen, mapObjRef, renderMarkers]);

  const handleChipFilter = useCallback((categoryId: string) => {
    setChipFilter(categoryId);
    const result = applyChipFilter(allPosts, categoryId);
    filteredItemsRef.current = result;
    setFilteredItems(result);
    setSelectedItem(null);
    if (mapObjRef.current) renderMarkers(result, mapObjRef.current);
  }, [allPosts, setChipFilter, filteredItemsRef, setFilteredItems, setSelectedItem, mapObjRef, renderMarkers]);

  const handleSearch = useCallback(async (searchInput: string) => {
    const q = searchInput.trim();
    const base = applyChipFilter(allPosts, chipFilter);

    let keywordFiltered: SearchResultItem[];
    if (q) {
      let instruments: string[] = [], services: string[] = [], rawTokens: string[] = [];
      try {
        const res = await fetch(`/api/search/parse?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        instruments = data.instruments ?? [];
        services = data.services ?? [];
        rawTokens = data.rawTokens ?? [];
      } catch { /* 실패 시 폴백 */ }

      if (instruments.length > 0 || services.length > 0 || rawTokens.length > 0) {
        keywordFiltered = base.filter((item) => {
          const matchInstr = instruments.length === 0 || instruments.some((kw) => matchesToken(item, kw));
          const matchSvc = services.length === 0 || services.some((kw) => matchesToken(item, kw));
          const matchRaw = rawTokens.every((t) => matchesToken(item, t));
          return matchInstr && matchSvc && matchRaw;
        });
      } else {
        const tokens = extractKeywords(q.toLowerCase());
        keywordFiltered = tokens.length ? base.filter((item) => tokens.every((t) => matchesToken(item, t))) : base;
      }
    } else {
      keywordFiltered = base;
    }

    if (!mapObjRef.current) { applyAndRender(keywordFiltered); return; }

    const regionKey = Object.keys(REGION_CENTERS).find((key) => q.toLowerCase().includes(key));
    if (regionKey) {
      const { lat, lng, zoom } = REGION_CENTERS[regionKey];
      mapObjRef.current.setCenter(new window.naver.maps.LatLng(lat, lng));
      mapObjRef.current.setZoom(zoom);
      applyAndRender(keywordFiltered);
      setShowAreaSearch(false);
      return;
    }

    if (window.naver?.maps?.Service && q) {
      window.naver.maps.Service.geocode({ query: searchInput.trim() }, (status: any, response: any) => {
        if (status === window.naver.maps.Service.Status.OK && response.v2.addresses.length > 0) {
          const { x, y } = response.v2.addresses[0];
          mapObjRef.current?.setCenter(new window.naver.maps.LatLng(parseFloat(y), parseFloat(x)));
          mapObjRef.current?.setZoom(14);
          setTimeout(() => { applyAndRender(filterByBounds(keywordFiltered)); setShowAreaSearch(false); }, 300);
        } else {
          applyAndRender(filterByBounds(keywordFiltered));
          setShowAreaSearch(false);
        }
      });
      return;
    }

    applyAndRender(filterByBounds(keywordFiltered));
    setShowAreaSearch(false);
  }, [allPosts, chipFilter, mapObjRef, applyAndRender, filterByBounds, setShowAreaSearch]);

  const handleClear = useCallback((setSearchInput: (v: string) => void) => {
    const result = applyChipFilter(allPosts, chipFilter);
    setSearchInput("");
    setFilteredItems(result);
    filteredItemsRef.current = result;
    setSelectedItem(null);
    setPanelOpen(false);
    if (mapObjRef.current) renderMarkers(result, mapObjRef.current);
  }, [allPosts, chipFilter, filteredItemsRef, mapObjRef, renderMarkers, setFilteredItems, setSelectedItem, setPanelOpen]);

  const handleAreaSearch = useCallback(() => {
    if (!mapObjRef.current) return;
    const bounds = mapObjRef.current.getBounds();
    const result = applyChipFilter(
      allPosts.filter((item) => {
        const coords = coordsRef.current[item.id];
        return coords ? bounds.hasLatLng(new window.naver.maps.LatLng(coords.lat, coords.lng)) : false;
      }),
      chipFilter,
    );
    setFilteredItems(result);
    filteredItemsRef.current = result;
    renderMarkers(result, mapObjRef.current);
    setSelectedItem(null);
    setPanelOpen(true);
    setShowAreaSearch(false);
  }, [allPosts, chipFilter, coordsRef, filteredItemsRef, mapObjRef, renderMarkers, setFilteredItems, setSelectedItem, setPanelOpen, setShowAreaSearch]);

  const handleHashtagClick = useCallback((tag: string) => {
    setSearchInput(`#${tag}`);
    const result = applyChipFilter(allPosts, chipFilter).filter((item) =>
      item.keywords.some((kw) => kw.toLowerCase() === tag.toLowerCase()),
    );
    setFilteredItems(result);
    filteredItemsRef.current = result;
    setSelectedItem(null);
    setPanelOpen(true);
    if (mapObjRef.current) renderMarkers(result, mapObjRef.current);
  }, [allPosts, chipFilter, filteredItemsRef, mapObjRef, renderMarkers, setFilteredItems, setSelectedItem, setPanelOpen, setSearchInput]);

  // URL 파라미터 처리 (?filter=lesson, ?q=바이올린)
  const handleUrlParams = useCallback((posts: SearchResultItem[]) => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get("filter");
    if (filter) {
      const filtered = posts.filter((item) => item.tags.includes(filter));
      if (filtered.length > 0) {
        setFilteredItems(filtered);
        filteredItemsRef.current = filtered;
        if (mapObjRef.current) renderMarkers(filtered, mapObjRef.current);
      }
      const label = CATEGORIES.find((c) => c.id === filter)?.label;
      if (label) setSearchInput(label);
      setPanelOpen(true);
    }
    const q = params.get("q");
    if (q) {
      setSearchInput(q);
      const tokens = extractKeywords(q.toLowerCase());
      const result = tokens.length ? posts.filter((item) => tokens.every((t) => matchesToken(item, t))) : posts;
      setFilteredItems(result);
      filteredItemsRef.current = result;
      setPanelOpen(true);
      if (mapObjRef.current) renderMarkers(result, mapObjRef.current);
    }
  }, [filteredItemsRef, mapObjRef, renderMarkers, setFilteredItems, setPanelOpen, setSearchInput]);

  return { handleChipFilter, handleSearch, handleClear, handleAreaSearch, handleHashtagClick, handleUrlParams };
}
