import { SearchResultItem } from "@/data/sampleMockResults";

function tagChipClass(tags: string[]) {
  if (tags.includes("lesson"))
    return "bg-violet-50 text-violet-600 border-violet-200";
  if (tags.includes("band"))
    return "bg-teal-50 text-teal-600 border-teal-200";
  if (tags.includes("instrument") || tags.includes("equipment"))
    return "bg-amber-50 text-amber-600 border-amber-200";
  return "bg-surface-card text-text-muted border-border-base";
}
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
    <div className={`map-panel-responsive${isOpen ? "" : " panel-closed"}`}>
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
          /* 단일 아이템 상세 */
          <div className="p-5 flex flex-col gap-4">
            {/* 이미지 */}
            <div className="w-full h-36 rounded-card bg-surface-card flex items-center justify-center text-6xl overflow-hidden shrink-0">
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

            {/* 카테고리 + 제목 */}
            <div>
              <span className="inline-block mb-1.5 text-2xs font-semibold text-brand bg-brand-bg px-2 py-0.5 rounded-full">
                {selectedItem.category}
              </span>
              <h3 className="text-md font-bold text-text-heading leading-snug">
                {selectedItem.title}
              </h3>
            </div>

            {/* 가격 + 지역 + 작성자 */}
            <div className="flex flex-col gap-1">
              <p className="text-lg font-bold text-text-heading">
                {selectedItem.price}
              </p>
              <p className="text-2xs text-text-muted">
                {selectedItem.location} · {selectedItem.timeAgo}
              </p>
              {selectedItem.author && (
                <p className="text-2xs text-text-muted">
                  작성자{" "}
                  <span className="font-semibold text-text-body">
                    {selectedItem.author}
                  </span>
                </p>
              )}
            </div>

            {/* 설명 */}
            {selectedItem.description && (
              <div>
                <p className="text-[11px] font-semibold text-text-muted mb-1">
                  기타 사항
                </p>
                <p className="text-2xs text-text-body leading-relaxed">
                  {selectedItem.description}
                </p>
              </div>
            )}

            {/* 해시태그 */}
            {selectedItem.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedItem.keywords.map((kw) => (
                  <span
                    key={kw}
                    className={`px-2 py-0.5 rounded-full border text-[11px] ${tagChipClass(selectedItem.tags)}`}
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            )}

            {/* 상세 페이지 이동 */}
            <button
              onClick={() => onDetailClick(selectedItem)}
              className="w-full py-4 rounded-full bg-brand text-white font-semibold text-sm border-none cursor-pointer hover:opacity-80 transition-opacity"
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
