"use client";

import { useState } from "react";

type TextSize = "10px" | "11px" | "12px";

const LABEL_SIZE: Record<TextSize, string> = {
  "10px": "text-[10px]",
  "11px": "text-[11px]",
  "12px": "text-[12px]",
};

interface ConfirmDeleteButtonProps {
  onConfirm: () => void;
  pending?: boolean;
  triggerLabel?: string;
  confirmLabel?: string;     // "정말 삭제할까요?" 등 확인 단계 안내 문구
  pendingLabel?: string;     // 진행중 표시, 기본 "삭제중…"
  textSize?: TextSize;
  triggerClassName?: string;
  // 게시글 상세처럼 확인 버튼이 색이 있는 박스 버튼이어야 할 때 사용
  confirmButtonClassName?: string;
  cancelButtonClassName?: string;
  // controlled 모드(선택) — 부모가 확인 단계 여부를 알아야 할 때(예: 옆의 다른 버튼 숨김)
  confirming?: boolean;
  onConfirmingChange?: (v: boolean) => void;
}

// "삭제" 클릭 → "정말 삭제할까요? [확인][취소]"로 인라인 전환되는 공용 버튼.
// 댓글(본글/대댓글)과 게시글 상세에서 동일한 토글 동작을 공유한다.
export default function ConfirmDeleteButton({
  onConfirm,
  pending = false,
  triggerLabel = "삭제",
  confirmLabel = "삭제할까요?",
  pendingLabel = "삭제중…",
  textSize = "11px",
  triggerClassName,
  confirmButtonClassName,
  cancelButtonClassName,
  confirming: confirmingProp,
  onConfirmingChange,
}: ConfirmDeleteButtonProps) {
  const [internalConfirming, setInternalConfirming] = useState(false);
  const confirming = confirmingProp ?? internalConfirming;
  const setConfirming = onConfirmingChange ?? setInternalConfirming;
  const sizeClass = LABEL_SIZE[textSize];

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`${sizeClass} text-red-500 font-medium`}>{confirmLabel}</span>
        <button
          onClick={onConfirm}
          disabled={pending}
          className={confirmButtonClassName ?? `${sizeClass} font-semibold text-red-500 hover:text-red-600 border-none bg-transparent cursor-pointer p-0 disabled:opacity-50`}
        >
          {pending ? pendingLabel : "확인"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={pending}
          className={cancelButtonClassName ?? `${sizeClass} text-text-muted hover:text-text-body border-none bg-transparent cursor-pointer p-0`}
        >
          취소
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={triggerClassName ?? `${sizeClass} text-text-muted hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer p-0 shrink-0`}
    >
      {triggerLabel}
    </button>
  );
}
