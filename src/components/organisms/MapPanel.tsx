import "@/styles/map.css";
import { SearchResultItem } from "@/data/sampleMockResults";
import { dirLabel } from "@/lib/dirLabel";
import { haversineKm as distKm, fmtDist } from "@/lib/nearbySearch";
import { tagChipCls, directionBadgeCls } from "@/lib/tagStyles";

interface MapPanelProps {
  isOpen: boolean;
  items: SearchResultItem[];
  selectedItem: SearchResultItem | null;
  userLat?: number;
  userLng?: number;
  onItemClick: (item: SearchResultItem) => void;
  onBackToList: () => void;
  onClose: () => void;
  onDetailClick: (item: SearchResultItem) => void;
  onHashtagClick?: (tag: string) => void;
}

export default function MapPanel({
  isOpen, items, selectedItem, userLat, userLng,
  onItemClick, onBackToList, onClose, onDetailClick, onHashtagClick,
}: MapPanelProps) {
  const hasLocation = userLat !== undefined && userLng !== undefined;

  const sortedItems = hasLocation
    ? [...items].sort((a, b) => {
        const da = a.lat && a.lng ? distKm(userLat!, userLng!, a.lat, a.lng) : Infinity;
        const db = b.lat && b.lng ? distKm(userLat!, userLng!, b.lat, b.lng) : Infinity;
        return da - db;
      })
    : items;

  return (
    <div className={`map-panel-responsive${isOpen ? "" : " panel-closed"}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-header bg-white shrink-0">
        <div>
          <p className="text-[12px] text-text-muted">
            {selectedItem ? "선택한 장소" : hasLocation ? `내 주변 · ${items.length}개` : `검색 결과 ${items.length}개`}
          </p>
          {selectedItem && (
            <button onClick={onBackToList} className="text-2xs text-brand border-none bg-transparent cursor-pointer hover:underline p-0 mt-0.5">
              ← 목록으로
            </button>
          )}
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:bg-surface-card border-none bg-transparent cursor-pointer text-md">
          ✕
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {selectedItem ? (
          /* ── 상세 뷰 ── */
          <div className="p-5 flex flex-col gap-4">
            <div className="w-full h-32 rounded-card bg-slate-100 flex items-center justify-center text-5xl overflow-hidden shrink-0">
              {selectedItem.imageUrl ? (
                <img src={selectedItem.imageUrl} alt={selectedItem.title} className="w-full h-full object-cover" />
              ) : (
                selectedItem.imageEmoji
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${tagChipCls(selectedItem.tags)}`}>
                  {selectedItem.category}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${directionBadgeCls(selectedItem.direction)}`}>
                  {dirLabel(selectedItem.tags, selectedItem.direction)}
                </span>
              </div>
              <h3 className="text-[15px] font-bold text-text-heading leading-snug">{selectedItem.title}</h3>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[16px] font-bold text-text-heading">{selectedItem.price}</p>
              <p className="text-2xs text-text-muted">{selectedItem.location} · {selectedItem.timeAgo}</p>
              {selectedItem.author && (
                <p className="text-2xs text-text-muted">
                  작성자 <span className="font-semibold text-text-body">{selectedItem.author}</span>
                </p>
              )}
            </div>

            {selectedItem.description && (
              <div>
                <p className="text-[11px] font-semibold text-text-muted mb-1">기타 사항</p>
                <p className="text-2xs text-text-body leading-relaxed">{selectedItem.description}</p>
              </div>
            )}

            {selectedItem.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedItem.keywords.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => onHashtagClick?.(kw)}
                    className={`px-2 py-0.5 rounded-full border text-[10px] cursor-pointer bg-transparent transition-opacity hover:opacity-70 ${tagChipCls(selectedItem.tags)}`}
                  >
                    #{kw}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => onDetailClick(selectedItem)}
              className="w-full py-3.5 rounded-full bg-brand text-white font-semibold text-sm border-none cursor-pointer hover:opacity-80 transition-opacity"
            >
              상세 페이지 보기 →
            </button>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-text-muted text-xs">
            검색 결과가 없어요.
          </div>
        ) : (
          /* ── 목록 뷰 ── */
          <ul className="list-none m-0 p-0">
            {sortedItems.map((item) => {
              const dist = hasLocation && item.lat && item.lng
                ? distKm(userLat!, userLng!, item.lat, item.lng)
                : null;
              return (
                <li
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="flex gap-3 px-4 py-4 border-b border-border-header cursor-pointer hover:bg-surface-card transition-colors"
                >
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      item.imageEmoji
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${tagChipCls(item.tags)}`}>
                        {item.category}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${directionBadgeCls(item.direction)}`}>
                        {dirLabel(item.tags, item.direction)}
                      </span>
                    </div>
                    <p className="text-[14px] font-semibold text-text-heading leading-snug truncate">{item.title}</p>
                    <p className="text-[12px] text-text-muted">
                      {item.price}
                      {dist !== null && (
                        <span className="ml-1.5 text-text-placeholder">· {fmtDist(dist)}</span>
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
