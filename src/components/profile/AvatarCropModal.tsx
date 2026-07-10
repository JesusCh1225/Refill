"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { getCroppedImg } from "@/lib/cropImage";

interface Props {
  imageSrc: string;
  uploading: boolean;
  error: string | null;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

export default function AvatarCropModal({ imageSrc, uploading, error, onSave, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels || uploading) return;
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
    onSave(blob);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl flex flex-col mx-4 overflow-hidden"
        style={{ maxWidth: 400, width: "100%", boxShadow: "0 24px 64px rgba(15,23,42,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-5 pt-5 pb-3">
          <p className="text-[15px] font-bold text-text-heading">프로필 사진 편집</p>
          <p className="text-[12px] text-text-muted mt-0.5">드래그로 위치, 슬라이더로 크기를 조절하세요.</p>
        </div>

        {/* 크로퍼 */}
        <div className="relative w-full" style={{ height: 320, background: "#111" }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* 줌 슬라이더 */}
        <div className="px-5 py-4 flex items-center gap-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-text-muted">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6"/>
          </svg>
          <input
            type="range"
            min={1} max={3} step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 cursor-pointer accent-[var(--color-brand)]"
          />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-text-muted">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/>
          </svg>
        </div>

        {error && <p className="text-[12px] text-red-500 text-center px-5 pb-2">{error}</p>}

        {/* 버튼 */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onCancel}
            disabled={uploading}
            className="flex-1 h-10 rounded-xl border border-border-base text-text-body text-[13px] font-semibold bg-white cursor-pointer hover:bg-surface-card transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={uploading || !croppedAreaPixels}
            className="flex-1 h-10 rounded-xl bg-brand text-white text-[13px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            {uploading ? "업로드 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
