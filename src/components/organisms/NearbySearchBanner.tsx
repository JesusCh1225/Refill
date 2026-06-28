"use client";

const RADIUS_OPTIONS = [5, 10, 20, 30];

export type GeoState = "idle" | "requesting" | "ready" | "denied";

interface NearbySearchBannerProps {
  geoState: GeoState;
  userCoords: { lat: number; lng: number } | null;
  nearbyRadius: number;
  onRadiusChange: (r: number) => void;
  onRetry: () => void;
}

export default function NearbySearchBanner({ geoState, userCoords, nearbyRadius, onRadiusChange, onRetry }: NearbySearchBannerProps) {
  return (
    <div className="mb-4 rounded-2xl border border-border-base bg-white px-4 py-3 flex flex-col gap-2">
      {geoState === "requesting" && (
        <div className="flex items-center gap-2 text-[13px] text-text-muted">
          <span className="w-3 h-3 rounded-full border-2 border-brand border-t-transparent animate-spin shrink-0" />
          현재 위치를 확인하는 중...
        </div>
      )}
      {geoState === "ready" && userCoords && (
        <>
          <div className="flex items-center gap-2 text-[13px] font-semibold text-brand">
            <span>📍</span>
            <span>현재 위치 기준 {nearbyRadius}km 이내</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => onRadiusChange(r)}
                className={`h-7 px-3 rounded-full text-[12px] font-semibold border cursor-pointer transition-colors ${nearbyRadius === r ? "bg-brand text-white border-brand" : "bg-white text-text-muted border-border-base hover:border-brand"}`}
              >
                {r}km
              </button>
            ))}
          </div>
        </>
      )}
      {geoState === "denied" && (
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-text-muted">⚠️ 위치 권한이 없어 근처 검색을 할 수 없어요.</span>
          <button onClick={onRetry} className="text-[12px] text-brand font-semibold border-none bg-transparent cursor-pointer hover:underline shrink-0">다시 시도</button>
        </div>
      )}
    </div>
  );
}
