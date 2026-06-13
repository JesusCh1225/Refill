"use client";

import { SearchResultItem } from "@/data/sampleMockResults";
import { dirLabel } from "@/lib/dirLabel";

interface Props {
  isOpen: boolean;
  items: SearchResultItem[];
  userLat?: number;
  userLng?: number;
  onItemClick: (item: SearchResultItem) => void;
  onClose: () => void;
}

function distKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

function chipCls(tags: string[]) {
  if (tags.includes("lesson")) return "bg-violet-50 text-violet-600";
  if (tags.includes("band")) return "bg-teal-50 text-teal-600";
  return "bg-amber-50 text-amber-600";
}

export default function MapListPanel({ isOpen, items, userLat, userLng, onItemClick, onClose }: Props) {
  const hasLocation = userLat !== undefined && userLng !== undefined;

  const sorted = hasLocation
    ? [...items].sort((a, b) => {
        const da = a.lat && a.lng ? distKm(userLat!, userLng!, a.lat, a.lng) : Infinity;
        const db = b.lat && b.lng ? distKm(userLat!, userLng!, b.lat, b.lng) : Infinity;
        return da - db;
      })
    : items;

  return (
    <div className={`map-list-panel${isOpen ? "" : " panel-closed"}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-header bg-white shrink-0">
        <div>
          <p className="text-[13px] font-bold text-text-heading">
            {hasLocation ? "내 주변 게시글" : "전체 목록"}
          </p>
          <p className="text-2xs text-text-muted mt-0.5">
            {hasLocation ? "거리순" : "최신순"} · {items.length}개
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:bg-surface-card border-none bg-transparent cursor-pointer text-md"
        >
          ✕
        </button>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-text-muted text-xs">
            게시글이 없어요.
          </div>
        ) : (
          <ul className="list-none m-0 p-0">
            {sorted.map((item) => {
              const dist =
                hasLocation && item.lat && item.lng
                  ? distKm(userLat!, userLng!, item.lat, item.lng)
                  : null;
              return (
                <li
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="flex gap-3 px-4 py-3 border-b border-border-header cursor-pointer hover:bg-surface-card transition-colors"
                >
                  {/* 썸네일 */}
                  <div className="w-12 h-12 rounded-xl bg-[#f1f5f9] flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      item.imageEmoji
                    )}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5 justify-center">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${chipCls(item.tags)}`}>
                        {item.category}
                      </span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          color: item.direction === "seek" ? "#0ea5e9" : "#8F4BC6",
                          background: item.direction === "seek" ? "#e0f2fe" : "#f3e8ff",
                        }}
                      >
                        {dirLabel(item.tags, item.direction)}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-text-heading leading-snug truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {item.price}
                      {dist !== null && (
                        <span className="ml-2 text-text-placeholder">📍 {fmtDist(dist)}</span>
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
