"use client";

import { useRef, useState } from "react";
import { EMOJIS } from "@/data/postOptions";
import Spinner from "@/components/atom/Spinner";
import { ACCEPT_IMAGE, ALLOWED_IMAGE_TYPES } from "@/lib/uploadValidator";

interface ImagePickerProps {
  mode: "emoji" | "image";
  emoji: string;
  imageUrls: string[];
  onModeChange: (mode: "emoji" | "image") => void;
  onEmojiChange: (emoji: string) => void;
  onImagesChange: (urls: string[]) => void;
}

const MAX_IMAGES = 5;

export default function ImagePicker({
  mode, emoji, imageUrls,
  onModeChange, onEmojiChange, onImagesChange,
}: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    const remaining = MAX_IMAGES - imageUrls.length;
    const toUpload = files.slice(0, remaining);
    if (!toUpload.length) return;

    setUploading(true);
    setError(null);

    const newUrls: string[] = [];
    for (const file of toUpload) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) { setError("JPG, PNG, WEBP 파일만 선택할 수 있어요."); continue; }
      if (file.size > 10 * 1024 * 1024) { setError("파일 크기는 10MB 이하여야 해요."); continue; }

      const fd = new FormData();
      fd.append("image", file);
      try {
        const res = await fetch("/api/upload/post-image", { method: "POST", body: fd });
        if (!res.ok) { setError("업로드에 실패했어요."); continue; }
        const { url } = await res.json();
        newUrls.push(url);
      } catch {
        setError("업로드에 실패했어요.");
      }
    }

    if (newUrls.length) onImagesChange([...imageUrls, ...newUrls]);
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    onImagesChange(imageUrls.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-2">
      {/* 탭 */}
      <div className="flex gap-1 p-1 bg-surface-card rounded-lg w-fit">
        {(["emoji", "image"] as const).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`px-3 py-1 rounded-md text-2xs font-semibold border-none cursor-pointer transition-colors ${
              mode === m ? "bg-white text-text-primary shadow-sm" : "bg-transparent text-text-muted hover:text-text-body"
            }`}
          >
            {m === "emoji" ? "이모지" : "이미지 업로드"}
          </button>
        ))}
      </div>

      {/* 이모지 선택 */}
      {mode === "emoji" && (
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => onEmojiChange(e)}
              className={`w-9 h-9 rounded-lg text-base border cursor-pointer transition-colors ${
                emoji === e ? "border-brand bg-brand-bg" : "border-border-base bg-white hover:bg-surface-card"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* 이미지 업로드 */}
      {mode === "image" && (
        <div className="flex flex-col gap-2">
          <input ref={fileInputRef} type="file" accept={ACCEPT_IMAGE} multiple onChange={handleFileChange} className="hidden" />

          {/* 이미지 그리드 */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {imageUrls.map((url, idx) => (
                <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-border-base">
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 z-10 text-[10px] font-bold bg-brand text-white px-1.5 py-0.5 rounded-full">
                      대표
                    </span>
                  )}
                  <img src={url} alt={`이미지 ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] border-none cursor-pointer flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {imageUrls.length < MAX_IMAGES && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="aspect-square rounded-xl border-2 border-dashed border-border-base bg-surface-card text-text-muted cursor-pointer hover:border-brand hover:text-brand transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                >
                  {uploading ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <span className="text-lg">+</span>
                      <span className="text-[10px]">{imageUrls.length}/{MAX_IMAGES}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* 첫 업로드 버튼 */}
          {imageUrls.length === 0 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-24 rounded-xl border-2 border-dashed border-border-base bg-surface-card text-text-muted text-xs cursor-pointer hover:border-brand hover:text-brand transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50"
            >
              {uploading ? (
                <Spinner size="md" />
              ) : (
                <>
                  <span className="text-xl">+</span>
                  <span>클릭하여 이미지 선택 (최대 {MAX_IMAGES}장)</span>
                </>
              )}
            </button>
          )}

          {error && <p className="text-[11px] text-red-500">{error}</p>}
          {imageUrls.length > 0 && (
            <p className="text-[11px] text-text-muted">첫 번째 이미지가 대표 이미지로 표시됩니다.</p>
          )}
        </div>
      )}
    </div>
  );
}
