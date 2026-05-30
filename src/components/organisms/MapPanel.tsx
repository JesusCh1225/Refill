import { SearchResultItem } from "@/data/sampleMockResults";
import MapPanelItem from "@/components/organisms/MapPanelItem";

interface MapPanelProps {
  isOpen: boolean;
  items: SearchResultItem[];
  selectedItem: SearchResultItem | null;
  onItemClick: (item: SearchResultItem) => void;
  onBackToList: () => void;
  onClose: () => void;
  onDetailClick: (item: SearchResultItem) => void;
}

export default function MapPanel({
  isOpen,
  items,
  selectedItem,
  onItemClick,
  onBackToList,
  onClose,
  onDetailClick,
}: MapPanelProps) {
  return (
    <div
      className="absolute top-0 right-0 h-full bg-white shadow-2xl z-20 flex flex-col overflow-hidden"
      style={{
        width: "360px",
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* 패널 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-header bg-white shrink-0">
        <div>
          <p className="text-2xs text-text-muted">
            {selectedItem ? "선택한 장소" : `검색 결과 ${items.length}개`}
          </p>
          {selectedItem && (
            <button
              onClick={onBackToList}
              className="text-2xs text-brand border-none bg-transparent cursor-pointer hover:underline p-0 mt-0.5"
            >
              ← 목록으로
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:bg-surface-card border-none bg-transparent cursor-pointer text-md"
        >
          ✕
        </button>
      </div>

      {/* 패널 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {selectedItem ? (
          /* 단일 아이템 미리보기 */
          <div className="p-5">
            <div className="w-full h-40 rounded-card bg-surface-card flex items-center justify-center text-6xl mb-4 overflow-hidden">
              {selectedItem.imageUrl ? (
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                selectedItem.imageEmoji
              )}
            </div>
            <span className="inline-block mb-2 text-2xs font-semibold text-brand bg-brand-bg px-2 py-0.5 rounded-full">
              {selectedItem.category}
            </span>
            <h3 className="text-md font-bold text-text-heading leading-snug mb-2">
              {selectedItem.title}
            </h3>
            <p className="text-lg font-bold text-text-heading mb-1">
              {selectedItem.price}
            </p>
            <p className="text-2xs text-text-muted mb-5">
              {selectedItem.location} · {selectedItem.timeAgo}
            </p>
            <button
              onClick={() => onDetailClick(selectedItem)}
              className="w-full py-3 rounded-full bg-brand text-white font-semibold text-xs border-none cursor-pointer hover:opacity-80 transition-opacity"
            >
              상세 페이지 보기 →
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-text-muted text-xs">
            검색 결과가 없어요.
          </div>
        ) : (
          <ul className="list-none m-0 p-0">
            {items.map((item) => (
              <MapPanelItem key={item.id} item={item} onClick={onItemClick} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
