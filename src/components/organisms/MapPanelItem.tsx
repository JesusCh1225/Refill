import { SearchResultItem } from "@/data/sampleMockResults";
import ResultItem from "@/components/atom/ResultItem";

interface MapPanelItemProps {
  item: SearchResultItem;
  onClick: (item: SearchResultItem) => void;
}

export default function MapPanelItem({ item, onClick }: MapPanelItemProps) {
  return (
    <li
      onClick={() => onClick(item)}
      className="px-2 cursor-pointer border-b border-border-header list-none"
    >
      <ResultItem
        title={item.title}
        category={item.category}
        location={item.location}
        timeAgo={item.timeAgo}
        price={item.price}
        imageEmoji={item.imageEmoji}
        imageUrl={item.imageUrl}
        tags={item.tags}
        direction={item.direction}
      />
    </li>
  );
}
