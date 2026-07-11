"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Avatar from "@/components/atom/Avatar";

interface Author { id: number; nickname: string | null; name: string; avatarUrl: string | null; }
interface CommentData {
  id: number;
  content: string;
  createdAt: string;
  author: Author;
  replies: CommentData[];
}

interface Props {
  postId: number;
  initial: CommentData[];
}

export default function CommunityComments({ postId, initial }: Props) {
  const { data: session } = useSession();
  const myId = (session?.user as any)?.id as number | undefined;

  const [comments, setComments] = useState<CommentData[]>(initial);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySaving, setReplySaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting || !session) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/community/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        setComments((p) => [...p, created]);
        setText("");
      }
    } finally { setSubmitting(false); }
  };

  const submitReply = async (parentId: number) => {
    if (!replyText.trim() || replySaving || !session) return;
    setReplySaving(true);
    try {
      const res = await fetch(`/api/community/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim(), parentId }),
      });
      if (res.ok) {
        const reply = await res.json();
        setComments((prev) => prev.map((c) =>
          c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
        ));
        setReplyText("");
        setReplyingTo(null);
      }
    } finally { setReplySaving(false); }
  };

  const deleteComment = async (id: number, parentId?: number) => {
    if (!confirm("댓글을 삭제할까요?")) return;
    const res = await fetch(`/api/community/${postId}/comments/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    if (parentId) {
      setComments((prev) => prev.map((c) =>
        c.id === parentId ? { ...c, replies: c.replies.filter((r) => r.id !== id) } : c
      ));
    } else {
      setComments((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-[15px] font-bold text-text-heading mb-4">댓글 {comments.length}</h3>

      {/* 댓글 목록 */}
      <div className="flex flex-col gap-4 mb-6">
        {comments.map((c) => (
          <div key={c.id}>
            <CommentRow comment={c} myId={myId} onReply={() => setReplyingTo(replyingTo === c.id ? null : c.id)} onDelete={() => deleteComment(c.id)} />
            {/* 답글 */}
            {c.replies.map((r) => (
              <div key={r.id} className="ml-8 mt-2">
                <CommentRow comment={r} myId={myId} onDelete={() => deleteComment(r.id, c.id)} />
              </div>
            ))}
            {replyingTo === c.id && session && (
              <div className="ml-8 mt-2 flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="답글 입력"
                  className="flex-1 h-9 px-3 rounded-lg border border-border-base text-[13px] focus:outline-none focus:border-brand"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitReply(c.id); } }}
                />
                <button
                  onClick={() => submitReply(c.id)}
                  disabled={replySaving || !replyText.trim()}
                  className="px-3 h-9 rounded-lg bg-brand text-white text-[12px] font-semibold border-none cursor-pointer disabled:opacity-40"
                >
                  {replySaving ? "…" : "등록"}
                </button>
              </div>
            )}
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-[13px] text-text-muted text-center py-6">첫 댓글을 남겨보세요.</p>
        )}
      </div>

      {/* 댓글 입력 */}
      {session ? (
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="댓글을 입력하세요"
            className="flex-1 h-10 px-3 rounded-xl border border-border-base text-[13px] focus:outline-none focus:border-brand transition-colors"
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="px-4 h-10 rounded-xl bg-brand text-white text-[13px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-40"
          >
            {submitting ? "…" : "등록"}
          </button>
        </form>
      ) : (
        <p className="text-[13px] text-text-muted text-center py-3">댓글을 작성하려면 로그인이 필요해요.</p>
      )}
    </div>
  );
}

function CommentRow({ comment, myId, onReply, onDelete }: {
  comment: CommentData;
  myId?: number;
  onReply?: () => void;
  onDelete: () => void;
}) {
  const name = comment.author.nickname ?? comment.author.name;
  return (
    <div className="flex gap-3">
      <Link href={`/profile/${comment.author.id}`} className="shrink-0 mt-0.5 hover:opacity-75 transition-opacity">
        <Avatar src={comment.author.avatarUrl} name={name} className="w-7 h-7" textClassName="text-[10px]" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Link href={`/profile/${comment.author.id}`} className="text-[13px] font-semibold text-text-heading hover:text-brand transition-colors">{name}</Link>
          <span className="text-[11px] text-text-placeholder">{new Date(comment.createdAt).toLocaleDateString("ko-KR")}</span>
        </div>
        <p className="text-[13px] text-text-body leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        <div className="flex gap-3 mt-1">
          {onReply && <button onClick={onReply} className="text-[11px] text-text-muted hover:text-brand border-none bg-transparent cursor-pointer p-0">답글</button>}
          {myId === comment.author.id && <button onClick={onDelete} className="text-[11px] text-red-400 hover:text-red-600 border-none bg-transparent cursor-pointer p-0">삭제</button>}
        </div>
      </div>
    </div>
  );
}
