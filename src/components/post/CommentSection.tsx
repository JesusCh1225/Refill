"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Avatar from "@/components/atom/Avatar";
import AuthorLink from "@/components/atom/AuthorLink";
import ConfirmDeleteButton from "@/components/atom/ConfirmDeleteButton";
import { type CommentData, displayAuthor, isEdited, formatDate } from "@/types/comment";

interface Props {
  postId: string;
  postAuthorId?: number;
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block shrink-0">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function CommentSection({ postId, postAuthorId }: Props) {
  const { data: session } = useSession();
  const myUserId = (session?.user as any)?.id as number | undefined;

  const [comments, setComments] = useState<CommentData[]>([]);

  // ── 댓글 목록 로드 ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setComments(data))
      .catch(() => {});
  }, [postId]);

  // ── 댓글 작성 ──────────────────────────────────────────────────────────
  const [commentText, setCommentText] = useState("");
  const [commentSecret, setCommentSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting || !session) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim(), isSecret: commentSecret }),
      });
      if (res.ok) {
        const created: CommentData = await res.json();
        setComments((prev) => [...prev, created]);
        setCommentText("");
        setCommentSecret(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── 댓글 수정 ──────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const startEdit = (c: CommentData) => {
    setEditingId(c.id);
    setEditText(c.content ?? "");
    setDeletingId(null);
  };

  const handleEditSave = async (commentId: number) => {
    if (!editText.trim() || editSaving) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText.trim() }),
      });
      if (res.ok) {
        const updated: Pick<CommentData, "id" | "content" | "updatedAt"> = await res.json();
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, content: updated.content, updatedAt: updated.updatedAt } : c,
          ),
        );
        setEditingId(null);
      }
    } finally {
      setEditSaving(false);
    }
  };

  // ── 댓글 삭제 ──────────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (commentId: number, parentId?: number | null) => {
    const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
    if (!res.ok) return;
    if (parentId) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: (c.replies ?? []).filter((r) => r.id !== commentId) }
            : c,
        ),
      );
    } else {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
    setDeletingId(null);
  };

  // ── 대댓글 ─────────────────────────────────────────────────────────────
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySecret, setReplySecret] = useState(false);
  const [replySaving, setReplySaving] = useState(false);

  const handleReplySubmit = async (parentId: number) => {
    if (!replyText.trim() || replySaving || !session) return;
    setReplySaving(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim(), parentId, isSecret: replySecret }),
      });
      if (res.ok) {
        const created: CommentData = await res.json();
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId ? { ...c, replies: [...(c.replies ?? []), created] } : c,
          ),
        );
        setReplyText("");
        setReplySecret(false);
      }
    } finally {
      setReplySaving(false);
    }
  };

  // ── 비밀 댓글 열람 가능 여부 ──────────────────────────────────────────
  const canSeeSecret = (authorId: number | null) =>
    myUserId !== undefined &&
    (myUserId === authorId || myUserId === postAuthorId);

  return (
    <div className="mt-6 bg-white rounded-2xl border border-border-card px-4 py-5 sm:px-8 sm:py-7 flex flex-col gap-6">
      <h2 className="text-[15px] font-bold text-text-heading">
        댓글{" "}
        {comments.length > 0 && <span className="text-brand">{comments.length}</span>}
      </h2>

      {/* 댓글 목록 */}
      {comments.length === 0 ? (
        <p className="text-[13px] text-text-muted py-4 text-center">첫 번째 댓글을 남겨보세요.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border-base">
          {comments.map((c) => {
            const isMine = myUserId !== undefined && c.authorId === myUserId;
            const editing = editingId === c.id;
            const pendingDelete = deletingId === c.id;
            const isReplying = replyingTo === c.id;
            const isHidden = c.isSecret && c.content === null;

            return (
              <li key={c.id} className="py-4 flex flex-col gap-2">
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
                      {!pendingDelete && (
                        <button onClick={() => startEdit(c)} className="text-[11px] text-text-muted hover:text-brand transition-colors border-none bg-transparent cursor-pointer p-0">수정</button>
                      )}
                      <ConfirmDeleteButton
                        confirming={pendingDelete}
                        onConfirmingChange={(v) => setDeletingId(v ? c.id : null)}
                        onConfirm={() => handleDelete(c.id)}
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
                        <button onClick={() => setEditingId(null)} className="px-3 h-8 rounded-lg border border-border-base text-[12px] text-text-muted bg-white cursor-pointer hover:bg-surface-card transition-colors">취소</button>
                        <button onClick={() => handleEditSave(c.id)} disabled={!editText.trim() || editSaving} className="px-3 h-8 rounded-lg bg-brand text-white text-[12px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                          {editSaving ? "저장중…" : "저장"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : isHidden ? (
                  <p className="text-[13px] text-text-muted italic flex items-center gap-1.5">
                    <LockIcon /> 비밀 댓글입니다.
                  </p>
                ) : (
                  <p className="text-[13px] text-text-body leading-relaxed whitespace-pre-wrap">{c.content}</p>
                )}

                {/* 대댓글 목록 */}
                {(c.replies?.length ?? 0) > 0 && (
                  <ul className="ml-6 flex flex-col gap-0 border-l-2 border-border-base pl-3 mt-1">
                    {c.replies!.map((r) => {
                      const rMine = myUserId !== undefined && r.authorId === myUserId;
                      const rPendingDelete = deletingId === r.id;
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
                                confirming={rPendingDelete}
                                onConfirmingChange={(v) => setDeletingId(v ? r.id : null)}
                                onConfirm={() => handleDelete(r.id, c.id)}
                                textSize="10px"
                                confirmLabel="삭제?"
                              />
                            )}
                          </div>
                          {rHidden ? (
                            <p className="text-[12px] text-text-muted italic flex items-center gap-1.5">
                              <LockIcon /> 비밀 댓글입니다.
                            </p>
                          ) : (
                            <p className="text-[12px] text-text-body leading-relaxed whitespace-pre-wrap">{r.content}</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* 답글 버튼 — 로그인 시에만 */}
                {!editing && session && !isHidden && (
                  <button
                    onClick={() => { setReplyingTo(isReplying ? null : c.id); setReplyText(""); setReplySecret(false); }}
                    className="self-start text-[11px] text-text-muted hover:text-brand transition-colors border-none bg-transparent cursor-pointer p-0"
                  >
                    {isReplying ? "↩ 취소" : "↩ 답글"}
                  </button>
                )}

                {/* 답글 입력 폼 */}
                {isReplying && session && (
                  <div className="ml-6 flex flex-col gap-2 border-l-2 border-brand-bg pl-3 mt-1">
                    <div className="flex gap-2 items-end">
                      <textarea
                        autoFocus
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="답글을 입력하세요."
                        maxLength={500}
                        rows={2}
                        className="flex-1 px-3 py-2 rounded-lg border border-border-base text-[12px] text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-brand transition-colors resize-none"
                      />
                      <button
                        onClick={() => handleReplySubmit(c.id)}
                        disabled={!replyText.trim() || replySaving}
                        className="h-9 px-4 rounded-xl bg-brand text-white text-[12px] font-semibold border-none cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                      >
                        {replySaving ? "…" : "등록"}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={replySecret}
                          onChange={(e) => setReplySecret(e.target.checked)}
                          className="w-3.5 h-3.5 accent-brand cursor-pointer"
                        />
                        <span className="text-[11px] text-text-muted flex items-center gap-0.5">
                          <LockIcon /> 비밀 답글
                        </span>
                      </label>
                      <p className="text-[10px] text-text-placeholder">{replyText.length}/500</p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* 댓글 작성 폼 */}
      <div className="border-t border-border-base pt-5">
        {session ? (
          <form onSubmit={handleCommentSubmit} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Avatar src={session.user.image} name={session.user.name ?? "?"} className="w-7 h-7" textClassName="text-xs" />
              <span className="text-[13px] font-semibold text-text-heading">{session.user.name}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="댓글을 입력하세요."
                maxLength={500}
                rows={3}
                className="flex-1 px-3 py-2 rounded-lg border border-border-base text-[13px] text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-brand transition-colors resize-none"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="h-10 px-5 rounded-xl bg-brand text-white text-[13px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed sm:shrink-0"
              >
                {submitting ? "등록중…" : "등록"}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={commentSecret}
                  onChange={(e) => setCommentSecret(e.target.checked)}
                  className="w-3.5 h-3.5 accent-brand cursor-pointer"
                />
                <span className="text-[11px] text-text-muted flex items-center gap-0.5">
                  <LockIcon /> 비밀 댓글
                </span>
              </label>
              <p className="text-[11px] text-text-placeholder">{commentText.length}/500</p>
            </div>
          </form>
        ) : (
          <div className="py-4 text-center rounded-xl bg-surface-card border border-border-base">
            <p className="text-[13px] text-text-muted mb-3">댓글을 작성하려면 로그인이 필요해요.</p>
            <a
              href="/login"
              className="inline-block px-5 py-2 rounded-full bg-brand text-white text-[13px] font-semibold hover:opacity-85 transition-opacity"
            >
              로그인하기
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
