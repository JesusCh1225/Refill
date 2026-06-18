"use client";

import { useState, useEffect } from "react";
import CategorySelector, { type CategoryEntry, type EntryType } from "@/components/molecules/CategorySelector";
import ImagePicker from "@/components/molecules/ImagePicker";
import TagInput from "@/components/molecules/TagInput";
import RpInput from "@/components/atom/RpInput";
import LocationSearch from "@/components/molecules/LocationSearch";
import RpTextarea from "@/components/atom/RpTextarea";
import Field from "@/components/atom/Field";
import { ALL_KEYWORDS } from "@/data/sampleMockResults";
import { PRICE_TYPES, generatePriceDisplay } from "@/data/postOptions";
import type { PostDraft, PostDirection, SearchResultItem } from "@/data/sampleMockResults";

interface WritePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (draft: PostDraft) => void;
  editData?: SearchResultItem;
  onEditComplete?: (updated: SearchResultItem) => void;
}

const ALL_SUBCAT_IDS = ["guitar", "drum", "piano", "vocal", "wind", "string", "dj", "equipment"];

// tags + direction → CategoryEntry[] 역변환 (수정 모드 초기화용)
function tagsToEntries(tags: string[], direction: PostDirection): CategoryEntry[] {
  const entries: CategoryEntry[] = [];
  let n = 1;

  if (tags.includes("lesson")) {
    const subcat = tags.find((t) => ALL_SUBCAT_IDS.includes(t)) ?? "";
    entries.push({ id: String(n++), type: "lesson", subcat, direction });
  }
  if (tags.includes("band")) {
    entries.push({ id: String(n++), type: "band", subcat: "", direction });
  }
  // instrument 태그가 있거나 레슨 없이 악기 서브카트가 있으면 거래
  const hasInstrument = tags.includes("instrument") ||
    (tags.some((t) => ALL_SUBCAT_IDS.includes(t)) && !tags.includes("lesson"));
  if (hasInstrument) {
    const subcat = tags.find((t) => ALL_SUBCAT_IDS.filter((s) => s !== "vocal").includes(t)) ?? "";
    entries.push({ id: String(n++), type: "trade", subcat, direction });
  }
  if (tags.includes("record") || tags.includes("book")) {
    const subcat = tags.includes("record") ? "record" : "book";
    entries.push({ id: String(n++), type: "etc", subcat, direction });
  }

  return entries.length > 0
    ? entries
    : [{ id: "1", type: "lesson", subcat: "", direction: "offer" }];
}

const DEFAULT_ENTRIES: CategoryEntry[] = [
  { id: "1", type: "lesson", subcat: "", direction: "offer" },
];

export default function WritePostModal({
  isOpen, onClose, onSubmit, editData, onEditComplete,
}: WritePostModalProps) {
  const isEdit = !!editData;

  const [entries, setEntries] = useState<CategoryEntry[]>(DEFAULT_ENTRIES);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [priceType, setPriceType] = useState<string>("monthly");
  const [priceAmount, setPriceAmount] = useState("");
  const [iconMode, setIconMode] = useState<"emoji" | "image">("emoji");
  const [emoji, setEmoji] = useState("🎵");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      setTitle(editData.title);
      setDescription(editData.description ?? "");
      setLocation(editData.location);
      setKeywords(editData.keywords ?? []);
      setEmoji(editData.imageEmoji ?? "🎵");
      setImageUrls(editData.imageUrls ?? []);
      setIconMode((editData.imageUrls?.length ?? 0) > 0 ? "image" : "emoji");
      setPriceType(editData.priceType ?? "monthly");
      setPriceAmount(editData.priceAmount != null ? String(editData.priceAmount) : "");
      setEntries(tagsToEntries(editData.tags ?? [], editData.direction));
    } else {
      setEntries([{ id: "1", type: "lesson" as EntryType, subcat: "", direction: "offer" }]);
      setTitle("");
      setLocation("");
      setPriceType("monthly");
      setPriceAmount("");
      setEmoji("🎵");
      setImageUrls([]);
      setIconMode("emoji");
      setDescription("");
      setKeywords([]);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const currentPriceType = PRICE_TYPES.find((t) => t.id === priceType)!;

  const buildDraft = (): PostDraft => {
    // 모든 엔트리에서 태그 수집 (중복 제거)
    const tags = [
      ...new Set(
        entries.flatMap((e) => {
          const base = e.type === "trade" ? "instrument" : e.type;
          return e.subcat ? [base, e.subcat] : [base];
        }),
      ),
    ];
    // 첫 번째 엔트리의 direction을 대표 direction으로 사용
    const direction: PostDirection = entries[0]?.direction ?? "offer";
    const locationTags = location.trim().split(/[\s,]+/).filter((p) => p.length >= 2);

    return {
      title: title.trim(),
      location: location.trim(),
      locationTags: [...new Set(locationTags)],
      priceType,
      priceAmount,
      priceDisplay: generatePriceDisplay(priceType, priceAmount),
      imageEmoji: emoji,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      tags,
      keywords,
      description: description.trim() || undefined,
      direction,
    };
  };

  const handleSubmit = async () => {
    if (!title.trim() || !location.trim()) return;
    if (currentPriceType.hasAmount && !priceAmount.trim()) return;
    if (submitting) return;

    if (isEdit && editData) {
      setSubmitting(true);
      try {
        const draft = buildDraft();
        const res = await fetch(`/api/posts/${editData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        if (res.ok) {
          const updated: SearchResultItem = await res.json();
          onEditComplete?.(updated);
          onClose();
        }
      } finally {
        setSubmitting(false);
      }
    } else {
      onSubmit(buildDraft());
      onClose();
    }
  };

  const isValid = title.trim() && location.trim() && (!currentPriceType.hasAmount || priceAmount.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full mx-0 sm:mx-4 sm:rounded-2xl flex flex-col rounded-t-2xl mt-auto sm:mt-0"
        style={{ maxWidth: "440px", maxHeight: "92vh", boxShadow: "0 24px 64px rgba(15,23,42,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-base shrink-0">
          <span className="text-md font-bold text-text-primary">
            {isEdit ? "글 수정" : "새 글 작성"}
          </span>
          <button onClick={onClose} className="text-text-muted hover:text-text-body text-lg border-none bg-transparent cursor-pointer leading-none">✕</button>
        </div>

        {/* 폼 */}
        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto flex-1">
          <Field label="카테고리" required>
            <CategorySelector entries={entries} onChange={setEntries} />
          </Field>

          <Field label="제목" required>
            <RpInput type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 기타 입문 레슨 모집합니다" maxLength={50} />
          </Field>

          <Field label="지역" required>
            <LocationSearch
              value={location}
              onChange={setLocation}
              onSelect={(place) => setLocation(place.roadAddress || place.address)}
              placeholder="예: 상암동 투썸 플레이스, 마포구"
            />
          </Field>

          <Field label="가격" required>
            <div className="flex flex-wrap gap-2">
              {PRICE_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPriceType(t.id)}
                  className={`px-3 py-1.5 rounded-full text-2xs font-semibold border cursor-pointer transition-colors ${
                    priceType === t.id ? "bg-brand text-white border-brand" : "bg-white text-text-muted border-border-base hover:border-brand hover:text-brand"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {currentPriceType.hasAmount && (
              <div className="flex items-center gap-2 mt-2">
                <RpInput
                  type="text"
                  value={priceAmount}
                  onChange={(e) => setPriceAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="금액을 입력하세요"
                  className="flex-1"
                />
                <span className="text-xs text-text-muted shrink-0">원</span>
              </div>
            )}
          </Field>

          <Field label="해시태그">
            <TagInput tags={keywords} onChange={setKeywords} suggestions={ALL_KEYWORDS} />
          </Field>

          <Field label="기타 사항">
            <RpTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상세 내용, 연락 방법, 기타 안내 사항을 자유롭게 작성해 주세요."
              maxLength={1000}
              rows={7}
            />
            <p className="text-right text-[10px] text-text-placeholder">{description.length}/1000</p>
          </Field>

          <Field label="이미지">
            <ImagePicker
              mode={iconMode}
              emoji={emoji}
              imageUrls={imageUrls}
              onModeChange={setIconMode}
              onEmojiChange={setEmoji}
              onImagesChange={setImageUrls}
            />
          </Field>
        </div>

        {/* 푸터 */}
        <div className="px-6 pb-5 pt-3 border-t border-border-base shrink-0">
          <button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className="w-full h-11 rounded-xl bg-brand text-white text-xs font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "저장중…" : isEdit ? "수정 완료" : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
