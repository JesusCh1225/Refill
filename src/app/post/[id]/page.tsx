"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { SearchResultItem } from "@/data/sampleMockResults";
import Header from "@/components/organisms/Header";
import InfoRow from "@/components/atom/InfoRow";
import BookmarkButton from "@/components/atom/BookmarkButton";
import { useBookmarks } from "@/lib/useBookmarks";

interface CommentData {
  id: number;
  content: string;
  guestName: string | null;
  authorId: number | null;
  createdAt: string;
  updatedAt: string;
  author: { name: string; nickname: string | null } | null;
}

function displayAuthor(c: CommentData) {
  if (c.author) return c.author.nickname || c.author.name;
  return c.guestName || "익명";
}

function isEdited(c: CommentData) {
  return Math.abs(new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()) > 1000;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const myUserId = (session?.user as any)?.id as number | undefined;

  // ── 게시글 데이터 ──────────────────────────────────────────────────────────
  const [item, setItem] = useState<SearchResultItem | null>(null);
  const [postLoading, setPostLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data: SearchResultItem) => setItem(data))
      .catch(() => setItem(null))
      .finally(() => setPostLoading(false));
  }, [id]);

  // ── 댓글 목록 ────────────────────────────────────────────────────────────
  const [comments, setComments] = useState<CommentData[]>([]);
  useEffect(() => {
    fetch(`/api/posts/${id}/comments`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setComments(data))
      .catch(() => {});
  }, [id]);

  // ── 댓글 작성 ────────────────────────────────────────────────────────────
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const body: Record<string, string> = { content: commentText.trim() };
      if (!session) body.guestName = commentName.trim() || "익명";

      const res = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const created: CommentData = await res.json();
        setComments((prev) => [...prev, created]);
        setCommentText("");
        if (!session) setCommentName("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── 댓글 수정 ────────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const startEdit = (c: CommentData) => {
    setEditingId(c.id);
    setEditText(c.content);
    setDeletingId(null);
  };

  const handleEditSave = async (commentId: number) => {
    if (!editText.trim() || editSaving) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/posts/${id}/comments/${commentId}`, {
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

  // ── 글 삭제 ──────────────────────────────────────────────────────────────
  const [postDeletePending, setPostDeletePending] = useState(false);
  const [postDeleting, setPostDeleting] = useState(false);

  const handlePostDelete = async () => {
    if (postDeleting) return;
    setPostDeleting(true);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (res.ok) router.replace("/");
    } finally {
      setPostDeleting(false);
    }
  };

  // ── 댓글 삭제 ────────────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (commentId: number) => {
    const res = await fetch(`/api/posts/${id}/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setDeletingId(null);
    }
  };

  // ── 로딩 / 없는 게시글 ────────────────────────────────────────────────────
  if (postLoading) {
    return (
      <div className="min-h-screen bg-surface-page">
        <Header />
        <div className="flex items-center justify-center py-40">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-surface-page text-text-body">
        <Header />
        <div className="flex flex-col items-center justify-center py-40 text-text-muted text-[15px]">
          <p>게시글을 찾을 수 없어요.</p>
          <button
            onClick={() => router.back()}
            className="mt-6 px-5 py-2 rounded-full border border-border-base text-xs text-text-body hover:bg-surface-card transition-colors cursor-pointer bg-transparent"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-page text-text-body">
      <Header />

      <div className="mx-auto px-3 sm:px-6 pt-5 sm:pt-8 pb-20" style={{ maxWidth: "var(--max-w-hero)" }}>
        {/* 뒤로가기 + 글 삭제 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-body transition-colors cursor-pointer bg-transparent border-none"
          >
            ← 목록으로
          </button>

          {myUserId !== undefined && item.authorId === myUserId && (
            postDeletePending ? (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-red-500 font-medium">정말 삭제할까요?</span>
                <button
                  onClick={handlePostDelete}
                  disabled={postDeleting}
                  className="px-3 h-7 rounded-lg bg-red-500 text-white text-[12px] font-semibold border-none cursor-pointer hover:bg-red-600 disabled:opacity-50"
                >
                  {postDeleting ? "삭제중…" : "삭제"}
                </button>
                <button
                  onClick={() => setPostDeletePending(false)}
                  className="px-3 h-7 rounded-lg border border-border-base text-[12px] text-text-muted bg-white cursor-pointer hover:bg-surface-card"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => setPostDeletePending(true)}
                className="text-[12px] text-text-muted hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none"
              >
                글 삭제
              </button>
            )
          )}
        </div>

        {/* 게시글 카드 */}
        <div className="bg-white rounded-2xl border border-border-card overflow-hidden">
          {/* 대표 이미지 */}
          <div className="w-full h-44 sm:h-56 bg-[#f1f5f9] flex items-center justify-center text-7xl sm:text-8xl overflow-hidden">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              item.imageEmoji
            )}
          </div>

          {/* 본문 */}
          <div className="px-4 py-5 sm:px-8 sm:py-7 flex flex-col gap-6">
            {/* 카테고리 + 제목 */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-block text-[11px] font-semibold text-brand bg-brand-bg px-2.5 py-0.5 rounded-full">
                    {item.category}
                  </span>
                  {item.direction && (
                    <span
                      className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        color: item.direction === "offer" ? "#8F4BC6" : "#0ea5e9",
                        background: item.direction === "offer" ? "#f3e8ff" : "#e0f2fe",
                      }}
                    >
                      {item.direction === "offer" ? "합니다·팝니다" : "구합니다·삽니다"}
                    </span>
                  )}
                </div>
                <BookmarkButton
                  bookmarked={isBookmarked(item.id)}
                  onToggle={() => toggleBookmark(item.id)}
                  size={22}
                />
              </div>
              <h1 className="mt-2 text-[22px] font-bold text-text-heading leading-snug">
                {item.title}
              </h1>
            </div>

            <hr className="border-border-base" />

            {/* 기본 정보 */}
            <div className="flex flex-col gap-3">
              <InfoRow label="가격" value={item.price} highlight />
              <InfoRow label="지역" value={item.location} />
              <InfoRow label="등록일" value={item.timeAgo} />
              {item.author && <InfoRow label="작성자" value={item.author} />}
            </div>

            {/* 기타 사항 */}
            {item.description && (
              <>
                <hr className="border-border-base" />
                <div className="flex flex-col gap-2">
                  <p className="text-[12px] font-semibold text-text-muted">기타 사항</p>
                  <p className="text-[14px] text-text-body leading-relaxed whitespace-pre-wrap">
                    {item.description}
                  </p>
                </div>
              </>
            )}

            {/* 해시태그 */}
            {item.keywords.length > 0 && (
              <>
                <hr className="border-border-base" />
                <div className="flex flex-wrap gap-2">
                  {item.keywords.map((kw) => (
                    <Link
                      key={kw}
                      href={`/?q=${encodeURIComponent(kw)}`}
                      className="px-3 py-1 rounded-full bg-surface-card text-[11px] text-text-muted border border-border-base hover:border-brand hover:text-brand transition-colors"
                    >
                      #{kw}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── 댓글 섹션 ──────────────────────────────────────────────────── */}
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

                return (
                  <li key={c.id} className="py-4 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-text-heading">{displayAuthor(c)}</span>
                        <span className="text-[11px] text-text-muted">{formatDate(c.createdAt)}</span>
                        {isEdited(c) && <span className="text-[10px] text-text-placeholder">(수정됨)</span>}
                      </div>

                      {isMine && !editing && (
                        pendingDelete ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-red-500 font-medium">삭제할까요?</span>
                            <button onClick={() => handleDelete(c.id)} className="text-[11px] font-semibold text-red-500 hover:text-red-600 border-none bg-transparent cursor-pointer p-0">확인</button>
                            <button onClick={() => setDeletingId(null)} className="text-[11px] text-text-muted hover:text-text-body border-none bg-transparent cursor-pointer p-0">취소</button>
                          </div>
                        ) : (
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => startEdit(c)} className="text-[11px] text-text-muted hover:text-brand transition-colors border-none bg-transparent cursor-pointer p-0">수정</button>
                            <button onClick={() => setDeletingId(c.id)} className="text-[11px] text-text-muted hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer p-0">삭제</button>
                          </div>
                        )
                      )}
                    </div>

                    {editing ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          maxLength={500}
                          rows={3}
                          autoFocus
                          className="w-full px-3 py-2 rounded-lg border border-brand text-[13px] text-text-body focus:outline-none resize-none"
                        />
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
                    ) : (
                      <p className="text-[13px] text-text-body leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* 댓글 작성 폼 */}
          <form onSubmit={handleCommentSubmit} className="flex flex-col gap-3 border-t border-border-base pt-5">
            {session ? (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-bg flex items-center justify-center text-brand text-xs font-bold">
                  {(session.user.name ?? "?")[0]}
                </div>
                <span className="text-[13px] font-semibold text-text-heading">{session.user.name}</span>
              </div>
            ) : (
              <input
                type="text"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                placeholder="닉네임 (선택, 기본: 익명)"
                maxLength={20}
                className="w-full sm:w-44 h-9 px-3 rounded-lg border border-border-base text-[13px] text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-brand transition-colors"
              />
            )}

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
            <p className="text-right text-[11px] text-text-placeholder">{commentText.length}/500</p>
          </form>
        </div>
      </div>
    </div>
  );
}
