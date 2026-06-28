"use client";

import { useState } from "react";
import AuthorLink from "@/components/atom/AuthorLink";
import ConfirmDeleteButton from "@/components/atom/ConfirmDeleteButton";
import { type CommentData, displayAuthor, isEdited, formatDate } from "@/types/comment";

export function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block shrink-0">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

interface CommentItemProps {
  comment: CommentData;
  myUserId?: number;
  postAuthorId?: number;
  postId: string;
  isLoggedIn: boolean;
  replyingTo: number | null;
  replyText: string;
  replySecret: boolean;
  replySaving: boolean;
  onReplyToggle: (id: number) => void;
  onReplyTextChange: (text: string) => void;
  onReplySecretChange: (v: boolean) => void;
  onReplySubmit: (parentId: number) => void;
  onUpdate: (updated: Pick<CommentData, "id" | "content" | "updatedAt">) => void;
  onDelete: (commentId: number, parentId?: number | null) => void;
}

export default function CommentItem({
  comment: c,
  myUserId,
  postAuthorId,
  postId,
  isLoggedIn,
  replyingTo,
  replyText,
  replySecret,
  replySaving,
  onReplyToggle,
  onReplyTextChange,
  onReplySecretChange,
  onReplySubmit,
  onUpdate,
  onDelete,
}: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isMine = myUserId !== undefined && c.authorId === myUserId;
  const isHidden = c.isSecret && c.content === null;
  const isReplying = replyingTo === c.id;

  const startEdit = () => {
    setEditing(true);
    setEditText(c.content ?? "");
    setDeletingId(null);
  };

  const handleEditSave = async () => {
    if (!editText.trim() || editSaving) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText.trim() }),
      });
      if (res.ok) {
        onUpdate(await res.json());
        setEditing(false);
      }
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <li className="py-4 flex flex-col gap-2">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {isHidden ? (
            <span className="text-[13px] font-semibold text-text-muted">작성자</span>
          ) : (
            <AuthorLink authorId={c.authorId} name={displayAuthor(c)} className="text-[13px] font-semibold text-text-heading" />
          )}
          <span className="text-[11px] text-text-muted">{formatDate(c.createdAt)}</span>
          {isEdited(c) && !isHidden && <span className="text-[10px] text-text-placeholder">(수정됨)</span>}
          {c.isSecret && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-text-muted">
              <LockIcon /> 비밀
            </span>
          )}
        </div>
        {isMine && !editing && !isHidden && (
          <div className="flex gap-2 shrink-0">
            {deletingId !== c.id && (
              <button onClick={startEdit} className="text-[11px] text-text-muted hover:text-brand transition-colors border-none bg-transparent cursor-pointer p-0">수정</button>
            )}
            <ConfirmDeleteButton
              confirming={deletingId === c.id}
              onConfirmingChange={(v) => setDeletingId(v ? c.id : null)}
              onConfirm={() => onDelete(c.id)}
              textSize="11px"
            />
          </div>
        )}
      </div>

      {/* 본문 / 수정 폼 */}
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={500} rows={3} autoFocus className="w-full px-3 py-2 rounded-lg border border-brand text-[13px] text-text-body focus:outline-none resize-none" />
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-text-placeholder">{editText.length}/500</p>
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="px-3 h-8 rounded-lg border border-border-base text-[12px] text-text-muted bg-white cursor-pointer hover:bg-surface-card transition-colors">취소</button>
              <button onClick={handleEditSave} disabled={!editText.trim() || editSaving} className="px-3 h-8 rounded-lg bg-brand text-white text-[12px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                {editSaving ? "저장중…" : "저장"}
              </button>
            </div>
          </div>
        </div>
      ) : isHidden ? (
        <p className="text-[13px] text-text-muted italic flex items-center gap-1.5"><LockIcon /> 비밀 댓글입니다.</p>
      ) : (
        <p className="text-[13px] text-text-body leading-relaxed whitespace-pre-wrap">{c.content}</p>
      )}

      {/* 대댓글 목록 */}
      {(c.replies?.length ?? 0) > 0 && (
        <ul className="ml-3 sm:ml-6 flex flex-col gap-0 border-l-2 border-border-base pl-2 sm:pl-3 mt-1">
          {c.replies!.map((r) => {
            const rMine = myUserId !== undefined && r.authorId === myUserId;
            const rHidden = r.isSecret && r.content === null;
            return (
              <li key={r.id} className="py-2.5 flex flex-col gap-1.5 border-b border-border-base last:border-none">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {rHidden ? (
                      <span className="text-[12px] font-semibold text-text-muted">작성자</span>
                    ) : (
                      <AuthorLink authorId={r.authorId} name={displayAuthor(r)} className="text-[12px] font-semibold text-text-heading" />
                    )}
                    <span className="text-[10px] text-text-muted">{formatDate(r.createdAt)}</span>
                    {isEdited(r) && !rHidden && <span className="text-[10px] text-text-placeholder">(수정됨)</span>}
                    {r.isSecret && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-text-muted">
                        <LockIcon /> 비밀
                      </span>
                    )}
                  </div>
                  {rMine && !rHidden && (
                    <ConfirmDeleteButton
                      confirming={deletingId === r.id}
                      onConfirmingChange={(v) => setDeletingId(v ? r.id : null)}
                      onConfirm={() => onDelete(r.id, c.id)}
                      textSize="10px"
                      confirmLabel="삭제?"
                    />
                  )}
                </div>
                {rHidden ? (
                  <p className="text-[12px] text-text-muted italic flex items-center gap-1.5"><LockIcon /> 비밀 댓글입니다.</p>
                ) : (
                  <p className="text-[12px] text-text-body leading-relaxed whitespace-pre-wrap">{r.content}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* 답글 버튼 */}
      {!editing && isLoggedIn && !isHidden && (
        <button
          onClick={() => { onReplyToggle(c.id); onReplyTextChange(""); onReplySecretChange(false); }}
          className="self-start text-[11px] text-text-muted hover:text-brand transition-colors border-none bg-transparent cursor-pointer p-0"
        >
          {isReplying ? "↩ 취소" : "↩ 답글"}
        </button>
      )}

      {/* 답글 입력 폼 */}
      {isReplying && isLoggedIn && (
        <div className="ml-3 sm:ml-6 flex flex-col gap-2 border-l-2 border-brand-bg pl-2 sm:pl-3 mt-1">
          <div className="flex gap-2 items-end">
            <textarea autoFocus value={replyText} onChange={(e) => onReplyTextChange(e.target.value)} placeholder="답글을 입력하세요." maxLength={500} rows={2} className="flex-1 px-3 py-2 rounded-lg border border-border-base text-[12px] text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-brand transition-colors resize-none" />
            <button onClick={() => onReplySubmit(c.id)} disabled={!replyText.trim() || replySaving} className="h-9 px-4 rounded-xl bg-brand text-white text-[12px] font-semibold border-none cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
              {replySaving ? "…" : "등록"}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className={`flex items-center gap-1.5 cursor-pointer select-none px-2.5 py-1 rounded-full border transition-colors ${replySecret ? "border-brand bg-brand-bg text-brand" : "border-border-base text-text-muted hover:border-brand hover:text-brand"}`}>
              <input type="checkbox" checked={replySecret} onChange={(e) => onReplySecretChange(e.target.checked)} className="sr-only" />
              <LockIcon />
              <span className="text-[11px] font-medium">비밀 답글</span>
            </label>
            <p className="text-[10px] text-text-placeholder">{replyText.length}/500</p>
          </div>
        </div>
      )}
    </li>
  );
}
