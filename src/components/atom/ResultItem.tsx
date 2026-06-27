import BookmarkButton from "@/components/atom/BookmarkButton";
import { dirLabel } from "@/lib/dirLabel";
import { directionBadgeCls } from "@/lib/tagStyles";

interface ResultItemProps {
  title: string;
  category: string;
  location: string;
  timeAgo: string;
  price: string;
  imageEmoji: string;
  imageUrl?: string;
  tags?: string[];
  direction?: "offer" | "seek";
  directionLabel?: string;
  distanceLabel?: string;
  bookmarked?: boolean;
  onBookmark?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

export default function ResultItem({
  title, category, location, timeAgo, price,
  imageEmoji, imageUrl, tags, direction, directionLabel,
  distanceLabel, bookmarked, onBookmark, onClick,
}: ResultItemProps) {
  const resolvedLabel = directionLabel ?? (direction && tags ? dirLabel(tags, direction) : undefined);

  return (
    <div
      onClick={onClick}
      className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl hover:bg-surface-card transition-colors cursor-pointer border border-transparent hover:border-border-card group"
    >
      {/* 썸네일 */}
      <div className="w-18 h-18 sm:w-24 sm:h-24 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-2xl sm:text-4xl overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          imageEmoji
        )}
      </div>

      {/* 내용 */}
      <div className="flex flex-col justify-between flex-1 py-0.5 sm:py-1 min-w-0">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-[11px] sm:text-[12px] font-semibold text-brand bg-brand-bg px-2 py-0.5 rounded-full shrink-0">
              {category}
            </span>
            {resolvedLabel && direction && (
              <span className={`text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${directionBadgeCls(direction)}`}>
                {resolvedLabel}
              </span>
            )}
          </div>
          <h3 className="text-[14px] sm:text-[16px] font-semibold text-text-heading leading-snug group-hover:text-brand transition-colors truncate">
            {title}
          </h3>
        </div>
        <div>
          <p className="text-[16px] sm:text-[19px] font-bold text-text-heading">{price}</p>
          <p className="text-[12px] sm:text-[13px] text-text-muted mt-0.5">
            {location} · {timeAgo}
            {distanceLabel && (
              <span className="ml-1.5 font-semibold text-brand">📍 {distanceLabel}</span>
            )}
          </p>
        </div>
      </div>

      {/* 북마크 버튼 */}
      {onBookmark !== undefined && (
        <div className="flex items-start pt-1 shrink-0">
          <BookmarkButton bookmarked={bookmarked ?? false} onToggle={onBookmark} />
        </div>
      )}
    </div>
  );
}
