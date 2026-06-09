"use client";

interface Props {
  preview: string;
  uploading: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AvatarUploadModal({ preview, uploading, error, onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 mx-4"
        style={{ maxWidth: 320, width: "100%", boxShadow: "0 24px 64px rgba(15,23,42,0.22)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[15px] font-bold text-text-heading">프로필 사진 변경</p>
        <img src={preview} alt="미리보기" className="w-28 h-28 rounded-full object-cover border-2 border-brand" />
        {error && <p className="text-[12px] text-red-500 text-center">{error}</p>}
        <p className="text-[12px] text-text-muted text-center">이 사진을 프로필 사진으로 사용하시겠어요?</p>
        <div className="flex gap-2 w-full">
          <button
            onClick={onCancel}
            disabled={uploading}
            className="flex-1 h-10 rounded-xl border border-border-base text-text-body text-[13px] font-semibold bg-white cursor-pointer hover:bg-surface-card transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={uploading}
            className="flex-1 h-10 rounded-xl bg-brand text-white text-[13px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            {uploading ? "업로드 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
