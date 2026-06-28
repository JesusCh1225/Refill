"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Avatar from "@/components/atom/Avatar";
import CommentItem, { LockIcon } from "@/components/post/CommentItem";
import { type CommentData } from "@/types/comment";

interface Props {
  postId: string;
  postAuthorId?: number;
}

export default function CommentSection({ postId, postAuthorId }: Props) {
  const { data: session } = useSession();
  const myUserId = (session?.user as any)?.id as number | undefined;

  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentSecret, setCommentSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySecret, setReplySecret] = useState(false);
  const [replySaving, setReplySaving] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setComments(data))
      .catch(() => {});
  }, [postId]);

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
          prev.map((c) => c.id === parentId ? { ...c, replies: [...(c.replies ?? []), created] } : c),
        );
        setReplyText("");
        setReplySecret(false);
        setReplyingTo(null);
      }
    } finally {
      setReplySaving(false);
    }
  };

  const handleUpdate = (updated: Pick<CommentData, "id" | "content" | "updatedAt">) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === updated.id
          ? { ...c, content: updated.content, updatedAt: updated.updatedAt }
          : c,
      ),
    );
  };

  const handleDelete = async (commentId: number, parentId?: number | null) => {
    const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, { method: "DELETE" });
    if (!res.ok) return;
    if (parentId) {
      setComments((prev) =>
        prev.map((c) => c.id === parentId ? { ...c, replies: (c.replies ?? []).filter((r) => r.id !== commentId) } : c),
      );
    } else {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  return (
    <div className="mt-6 bg-white rounded-2xl border border-border-card px-4 py-5 sm:px-8 sm:py-7 flex flex-col gap-6">
      <h2 className="text-[15px] font-bold text-text-heading">
        댓글{comments.length > 0 && <span className="text-brand"> {comments.length}</span>}
      </h2>

      {comments.length === 0 ? (
        <p className="text-[13px] text-text-muted py-4 text-center">첫 번째 댓글을 남겨보세요.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border-base">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              myUserId={myUserId}
              postAuthorId={postAuthorId}
              postId={postId}
              isLoggedIn={!!session}
              replyingTo={replyingTo}
              replyText={replyText}
              replySecret={replySecret}
              replySaving={replySaving}
              onReplyToggle={(id) => setReplyingTo(replyingTo === id ? null : id)}
              onReplyTextChange={setReplyText}
              onReplySecretChange={setReplySecret}
              onReplySubmit={handleReplySubmit}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
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
              <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="댓글을 입력하세요." maxLength={500} rows={3} className="flex-1 px-3 py-2 rounded-lg border border-border-base text-[13px] text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-brand transition-colors resize-none" />
              <button type="submit" disabled={!commentText.trim() || submitting} className="h-10 px-5 rounded-xl bg-brand text-white text-[13px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed sm:shrink-0">
                {submitting ? "등록중…" : "등록"}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className={`flex items-center gap-1.5 cursor-pointer select-none px-2.5 py-1 rounded-full border transition-colors ${commentSecret ? "border-brand bg-brand-bg text-brand" : "border-border-base text-text-muted hover:border-brand hover:text-brand"}`}>
                <input type="checkbox" checked={commentSecret} onChange={(e) => setCommentSecret(e.target.checked)} className="sr-only" />
                <LockIcon />
                <span className="text-[11px] font-medium">비밀 댓글</span>
              </label>
              <p className="text-[11px] text-text-placeholder">{commentText.length}/500</p>
            </div>
          </form>
        ) : (
          <div className="py-4 text-center rounded-xl bg-surface-card border border-border-base">
            <p className="text-[13px] text-text-muted mb-3">댓글을 작성하려면 로그인이 필요해요.</p>
            <a href="/login" className="inline-block px-5 py-2 rounded-full bg-brand text-white text-[13px] font-semibold hover:opacity-85 transition-opacity">로그인하기</a>
          </div>
        )}
      </div>
    </div>
  );
}
