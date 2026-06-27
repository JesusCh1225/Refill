"use client";

import { SearchResultItem } from "@/data/sampleMockResults";
import { dirLabel } from "@/lib/dirLabel";
import { haversineKm as distKm, fmtDist } from "@/lib/nearbySearch";
import { tagChipCls as chipCls, directionBadgeCls } from "@/lib/tagStyles";

interface Props {
  isOpen: boolean;
  items: SearchResultItem[];
  userLat?: number;
  userLng?: number;
  onItemClick: (item: SearchResultItem) => void;
  onClose: () => void;
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
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
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
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${directionBadgeCls(item.direction)}`}>
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
