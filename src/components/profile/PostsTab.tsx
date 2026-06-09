"use client";

import Link from "next/link";
import type { SearchResultItem } from "@/data/sampleMockResults";

interface Props {
  posts: SearchResultItem[];
  deletingPostId: number | null;
  deleteLoading: boolean;
  onDeleteClick: (postId: number) => void;
  onDeleteConfirm: (postId: number) => void;
  onDeleteCancel: () => void;
}

export default function PostsTab({
  posts,
  deletingPostId,
  deleteLoading,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-border-card overflow-hidden">
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <p className="text-[14px]">작성한 글이 없어요.</p>
          <Link href="/" className="mt-4 text-[12px] text-brand hover:underline">글 작성하러 가기 →</Link>
        </div>
      ) : (
        <ul className="divide-y divide-border-base">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center gap-2 px-4 sm:px-6 py-3 hover:bg-surface-card transition-colors">
              <Link href={`/post/${post.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center text-xl shrink-0">
                  {post.imageEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-text-heading truncate">{post.title}</p>
                  <p className="text-[12px] text-text-muted mt-0.5">{post.location} · {post.timeAgo}</p>
                </div>
                <span className="text-[13px] font-semibold text-brand shrink-0 mr-2">{post.price}</span>
              </Link>

              {deletingPostId === post.id ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onDeleteConfirm(post.id)}
                    disabled={deleteLoading}
                    className="px-2.5 h-7 rounded-lg bg-red-500 text-white text-[11px] font-semibold border-none cursor-pointer hover:bg-red-600 disabled:opacity-50"
                  >
                    {deleteLoading ? "…" : "삭제"}
                  </button>
                  <button
                    onClick={onDeleteCancel}
                    className="px-2.5 h-7 rounded-lg border border-border-base text-[11px] text-text-muted bg-white cursor-pointer hover:bg-surface-card"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onDeleteClick(post.id)}
                  className="shrink-0 px-2.5 h-7 rounded-lg border border-red-300 text-red-500 text-[11px] font-semibold bg-transparent cursor-pointer hover:bg-red-50 transition-colors"
                >
                  삭제
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
