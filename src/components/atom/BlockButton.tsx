"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Props {
  userId: number;
  myUserId?: number;
  /** 버튼 외형 변형 — "default": 일반 버튼, "menu": 메뉴 아이템 스타일 */
  variant?: "default" | "menu";
  onBlockChange?: (blocked: boolean) => void;
}

interface ConfirmModal {
  message: string;
  onConfirm: () => void;
}

export default function BlockButton({ userId, myUserId, variant = "default", onBlockChange }: Props) {
  const { data: session } = useSession();
  const myId = myUserId ?? (session?.user as any)?.id as number | undefined;

  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<ConfirmModal | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!myId || myId === userId) { setLoading(false); return; }
    fetch(`/api/users/${userId}/block`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setBlocked(data.blocked); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, myId]);

  if (!myId || myId === userId || loading) return null;

  const handleClick = () => {
    if (blocked) {
      setConfirm({
        message: "이 사용자의 차단을 푸시겠습니까?",
        onConfirm: doUnblock,
      });
    } else {
      setConfirm({
        message: "이 사용자를 차단하시겠습니까?\n차단하면 서로 메시지를 주고받을 수 없어요.",
        onConfirm: doBlock,
      });
    }
  };

  const doBlock = async () => {
    setActing(true);
    try {
      const res = await fetch(`/api/users/${userId}/block`, { method: "POST" });
      if (res.ok) { setBlocked(true); onBlockChange?.(true); }
    } finally {
      setActing(false);
      setConfirm(null);
    }
  };

  const doUnblock = async () => {
    setActing(true);
    try {
      const res = await fetch(`/api/users/${userId}/block`, { method: "DELETE" });
      if (res.ok) { setBlocked(false); onBlockChange?.(false); }
    } finally {
      setActing(false);
      setConfirm(null);
    }
  };

  return (
    <>
      {variant === "menu" ? (
        <button
          onClick={handleClick}
          className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${
            blocked
              ? "text-text-muted hover:bg-surface-card"
              : "text-red-500 hover:bg-red-50"
          }`}
        >
          {blocked ? "차단 해제" : "차단하기"}
        </button>
      ) : (
        <button
          onClick={handleClick}
          className={`px-3 py-1 rounded-full text-[12px] font-semibold border transition-colors cursor-pointer ${
            blocked
              ? "border-border-base text-text-muted bg-white hover:bg-surface-card"
              : "border-red-300 text-red-500 bg-white hover:bg-red-50"
          }`}
        >
          {blocked ? "차단 해제" : "차단하기"}
        </button>
      )}

      {/* 확인 모달 */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !acting && setConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl px-6 py-5 max-w-sm w-full flex flex-col gap-4">
            <p className="text-[14px] text-text-body whitespace-pre-line leading-relaxed">{confirm.message}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirm(null)}
                disabled={acting}
                className="px-4 h-9 rounded-xl border border-border-base text-[13px] text-text-muted bg-transparent cursor-pointer hover:bg-surface-card disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={confirm.onConfirm}
                disabled={acting}
                className={`px-4 h-9 rounded-xl text-[13px] font-semibold text-white border-none cursor-pointer disabled:opacity-50 ${
                  blocked ? "bg-brand hover:opacity-85" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {acting ? "처리 중…" : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
