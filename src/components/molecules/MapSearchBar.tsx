interface MapSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

export default function MapSearchBar({
  value,
  onChange,
  onSearch,
  onClear,
}: MapSearchBarProps) {
  return (
    <div
      className="absolute z-10 top-4 left-4 flex items-center gap-2 bg-white rounded-full shadow-search px-4 border border-border-base"
      style={{ height: "48px", minWidth: "320px", maxWidth: "420px" }}
    >
      <span className="text-sm font-bold text-brand shrink-0">✦</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
        placeholder="지역, 악기, 서비스로 검색"
        className="flex-1 border-none outline-none text-xs text-text-body bg-transparent placeholder:text-text-placeholder"
      />
      {value && (
        <button
          onClick={onClear}
          className="text-text-muted hover:text-text-body text-2xs border-none bg-transparent cursor-pointer"
        >
          ✕
        </button>
      )}
      <button
        onClick={onSearch}
        className="w-8 h-8 rounded-full bg-brand text-white text-xs flex items-center justify-center border-none cursor-pointer hover:opacity-80 transition-opacity shrink-0"
      >
        →
      </button>
    </div>
  );
}
