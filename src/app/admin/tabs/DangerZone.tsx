"use client";

import { useState } from "react";
import { useToast } from "@/context/toast";

type ClearTarget = "posts" | "community" | "messages" | "reviews" | "reports" | "notifications" | "users";

const CLEAR_OPTIONS: { value: ClearTarget; label: string; desc: string; danger?: boolean }[] = [
  { value: "posts",         label: "지도글",       desc: "게시글·댓글·좋아요·북마크·이미지·해시태그" },
  { value: "community",     label: "커뮤니티 글",  desc: "커뮤니티 게시글·댓글·좋아요" },
  { value: "messages",      label: "채팅·메시지",  desc: "1:1 채팅 메시지·대화 기록" },
  { value: "reviews",       label: "리뷰",         desc: "사용자 간 거래 후기" },
  { value: "reports",       label: "신고 내역",    desc: "게시글·커뮤니티 신고 기록" },
  { value: "notifications", label: "알림",         desc: "모든 알림 기록" },
  { value: "users",         label: "회원 계정",    desc: "전체 회원 + 위 항목 전부 포함", danger: true },
];

export default function DangerZone() {
  const { showToast } = useToast();
  const [seqLoading, setSeqLoading] = useState(false);
  const [selected, setSelected] = useState<Set<ClearTarget>>(new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetSequences = async () => {
    if (!confirm("게시글·댓글·메시지 등의 ID 시퀀스를 초기화할까요?\n빈 테이블은 다음 등록 시 ID 1부터 시작합니다.")) return;
    setSeqLoading(true);
    try {
      const res = await fetch("/api/admin/reset-sequences", { method: "POST" });
      if (res.ok) showToast("시퀀스가 초기화되었습니다.", "info");
      else showToast("초기화에 실패했어요.", "error");
    } catch {
      showToast("네트워크 오류가 발생했어요.", "error");
    } finally {
      setSeqLoading(false);
    }
  };

  const toggle = (v: ClearTarget) => {
    setConfirmed(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v); else next.add(v);
      return next;
    });
  };

  const handleDelete = async () => {
    if (selected.size === 0) return;
    if (!confirmed) { setConfirmed(true); return; }
    const labels = CLEAR_OPTIONS.filter((o) => selected.has(o.value)).map((o) => o.label).join(", ");
    if (!confirm(`선택한 항목을 삭제할까요?\n\n[ ${labels} ]\n\n이 작업은 되돌릴 수 없습니다.`)) {
      setConfirmed(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clear-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targets: Array.from(selected) }),
      });
      if (res.ok) {
        const { deleted } = await res.json();
        const summary = Object.entries(deleted as Record<string, number>)
          .filter(([, n]) => n > 0)
          .map(([k, n]) => `${k}: ${n}`)
          .join(", ");
        showToast(`삭제 완료${summary ? ` (${summary})` : ""}`, "info");
        setSelected(new Set());
        setConfirmed(false);
      } else {
        showToast("삭제에 실패했어요.", "error");
        setConfirmed(false);
      }
    } catch {
      showToast("네트워크 오류가 발생했어요.", "error");
      setConfirmed(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 시퀀스 초기화 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h2 className="text-[16px] font-bold text-amber-700 mb-1">ID 시퀀스 초기화</h2>
        <p className="text-[13px] text-amber-600 mb-4 leading-relaxed">
          게시글·댓글·메시지 등 콘텐츠 테이블의 자동증가 ID를 리셋합니다.
          <br />
          데이터를 모두 지운 뒤 실행하면 다음 등록 시 ID가 1부터 시작됩니다.
        </p>
        <button
          onClick={handleResetSequences}
          disabled={seqLoading}
          className="px-5 h-10 rounded-lg text-[13px] font-semibold border-none cursor-pointer transition-colors bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50"
        >
          {seqLoading ? "초기화 중…" : "시퀀스 초기화"}
        </button>
      </div>

      {/* 선택적 데이터 삭제 */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <h2 className="text-[16px] font-bold text-red-600 mb-1">데이터 선택 삭제</h2>
        <p className="text-[13px] text-red-500 mb-4">
          삭제할 항목을 선택하세요. 이 작업은 <strong>되돌릴 수 없습니다.</strong>
        </p>

        <div className="flex flex-col gap-2 mb-5">
          {CLEAR_OPTIONS.map((opt) => {
            const checked = selected.has(opt.value);
            return (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors select-none ${
                  checked
                    ? opt.danger ? "border-red-400 bg-red-100" : "border-red-300 bg-red-100/60"
                    : "border-border-base bg-white hover:border-red-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.value)}
                  className="mt-0.5 accent-red-500 w-4 h-4 shrink-0"
                />
                <div>
                  <p className={`text-[14px] font-semibold ${opt.danger ? "text-red-600" : "text-text-heading"}`}>
                    {opt.label}
                    {opt.danger && <span className="ml-1.5 text-[11px] font-normal bg-red-200 text-red-700 px-1.5 py-0.5 rounded-full">위험</span>}
                  </p>
                  <p className="text-[12px] text-text-muted mt-0.5">{opt.desc}</p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={selected.size === 0 || loading}
            className={`px-5 h-10 rounded-lg text-[13px] font-semibold border-none cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              confirmed ? "bg-red-600 text-white hover:bg-red-700" : "bg-red-100 text-red-600 hover:bg-red-200"
            }`}
          >
            {loading ? "삭제 중…" : confirmed ? "한 번 더 클릭하면 삭제됩니다" : `선택 항목 삭제 (${selected.size}개)`}
          </button>
          {confirmed && !loading && (
            <button
              onClick={() => setConfirmed(false)}
              className="px-4 h-10 rounded-lg text-[13px] font-semibold bg-white text-text-muted border border-border-base cursor-pointer hover:bg-surface-card transition-colors"
            >
              취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
