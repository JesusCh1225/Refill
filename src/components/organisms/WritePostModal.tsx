"use client";

import { useRef, useState } from "react";
import { SearchResultItem } from "@/data/sampleMockResults";

const CATEGORY_OPTIONS = [
  { id: "lesson", label: "레슨", tags: ["lesson"] },
  { id: "band", label: "밴드/합주", tags: ["band"] },
  { id: "guitar", label: "기타/베이스", tags: ["guitar"] },
  { id: "drum", label: "드럼", tags: ["drum"] },
  { id: "piano", label: "피아노/건반", tags: ["piano"] },
  { id: "vocal", label: "보컬/노래", tags: ["vocal"] },
  { id: "wind", label: "관악기", tags: ["wind"] },
  { id: "string", label: "현악기", tags: ["string"] },
  { id: "dj", label: "DJ/전자음악", tags: ["dj"] },
  { id: "instrument", label: "악기거래", tags: ["instrument"] },
  { id: "equipment", label: "음향장비", tags: ["equipment"] },
];

const EMOJIS = ["🎸", "🥁", "🎤", "🎹", "🎵", "🎷", "🎻", "🎧", "🎺", "🪗", "🎼", "🎙️"];

interface WritePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<SearchResultItem, "id">) => void;
}

export default function WritePostModal({
  isOpen,
  onClose,
  onSubmit,
}: WritePostModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(["lesson"]),
  );
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [iconMode, setIconMode] = useState<"emoji" | "image">("emoji");
  const [emoji, setEmoji] = useState("🎵");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev; // 최소 1개 유지
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!title.trim() || !location.trim() || !price.trim()) return;

    const selected = CATEGORY_OPTIONS.filter((c) => selectedCategories.has(c.id));
    const tags = [...new Set(selected.flatMap((c) => c.tags))];
    const categoryLabel = selected.map((c) => c.label).join(" · ");
    const locationTags = location
      .trim()
      .split(/[\s,]+/)
      .filter((p) => p.length >= 2);

    onSubmit({
      title: title.trim(),
      category: categoryLabel,
      location: location.trim(),
      locationTags: [...new Set(locationTags)],
      timeAgo: "방금 전",
      price: price.trim(),
      imageEmoji: emoji,
      imageUrl: iconMode === "image" && imageUrl ? imageUrl : undefined,
      tags,
      keywords: [],
    });

    // 폼 초기화
    setSelectedCategories(new Set(["lesson"]));
    setTitle("");
    setLocation("");
    setPrice("");
    setEmoji("🎵");
    setImageUrl(null);
    setIconMode("emoji");
    onClose();
  };

  const isValid = title.trim() && location.trim() && price.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full mx-4 flex flex-col"
        style={{
          maxWidth: "440px",
          maxHeight: "90vh",
          boxShadow: "0 24px 64px rgba(15,23,42,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-base shrink-0">
          <span className="text-md font-bold text-text-primary">새 글 작성</span>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-body text-lg border-none bg-transparent cursor-pointer leading-none"
          >
            ✕
          </button>
        </div>

        {/* 폼 (스크롤 가능) */}
        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto flex-1">
          {/* 카테고리 — 체크박스 다중 선택 */}
          <div className="flex flex-col gap-2">
            <label className="text-2xs font-semibold text-text-muted">
              카테고리 <span className="text-brand">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((c) => {
                const checked = selectedCategories.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCategory(c.id)}
                    className={`px-3 py-1.5 rounded-full text-2xs font-semibold border cursor-pointer transition-colors ${
                      checked
                        ? "bg-brand text-white border-brand"
                        : "bg-white text-text-muted border-border-base hover:border-brand hover:text-brand"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 제목 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-2xs font-semibold text-text-muted">
              제목 <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 기타 입문 레슨 모집합니다"
              maxLength={50}
              className="border border-border-base rounded-lg px-3 py-2 text-xs text-text-body outline-none placeholder:text-text-placeholder focus:border-brand transition-colors"
            />
          </div>

          {/* 지역 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-2xs font-semibold text-text-muted">
              지역 <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: 서울 마포구, 인천 서구"
              className="border border-border-base rounded-lg px-3 py-2 text-xs text-text-body outline-none placeholder:text-text-placeholder focus:border-brand transition-colors"
            />
          </div>

          {/* 가격 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-2xs font-semibold text-text-muted">
              가격 <span className="text-brand">*</span>
            </label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="예: 월 100,000원 / 150,000원 / 무료"
              className="border border-border-base rounded-lg px-3 py-2 text-xs text-text-body outline-none placeholder:text-text-placeholder focus:border-brand transition-colors"
            />
          </div>

          {/* 아이콘 / 이미지 */}
          <div className="flex flex-col gap-2">
            <label className="text-2xs font-semibold text-text-muted">대표 이미지</label>

            {/* 탭 */}
            <div className="flex gap-1 p-1 bg-surface-card rounded-lg w-fit">
              {(["emoji", "image"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setIconMode(mode)}
                  className={`px-3 py-1 rounded-md text-2xs font-semibold border-none cursor-pointer transition-colors ${
                    iconMode === mode
                      ? "bg-white text-text-primary shadow-sm"
                      : "bg-transparent text-text-muted hover:text-text-body"
                  }`}
                >
                  {mode === "emoji" ? "이모지" : "이미지 업로드"}
                </button>
              ))}
            </div>

            {/* 이모지 선택 */}
            {iconMode === "emoji" && (
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`w-9 h-9 rounded-lg text-base border cursor-pointer transition-colors ${
                      emoji === e
                        ? "border-brand bg-brand-bg"
                        : "border-border-base bg-white hover:bg-surface-card"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}

            {/* 이미지 업로드 */}
            {iconMode === "image" && (
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imageUrl ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border-base">
                    <img
                      src={imageUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setImageUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white text-2xs border-none cursor-pointer flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 rounded-xl border-2 border-dashed border-border-base bg-surface-card text-text-muted text-xs cursor-pointer hover:border-brand hover:text-brand transition-colors flex flex-col items-center justify-center gap-1"
                  >
                    <span className="text-xl">+</span>
                    <span>클릭하여 이미지 선택</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 pb-5 pt-3 border-t border-border-base shrink-0">
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full h-11 rounded-xl bg-brand text-white text-xs font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            등록하기
          </button>
        </div>
      </div>
    </div>
  );
}
