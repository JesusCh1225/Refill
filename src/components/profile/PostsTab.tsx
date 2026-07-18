"use client";

import { useState } from "react";
import Link from "next/link";

export type ProfilePost =
  | { type: "map"; id: number; title: string; imageEmoji: string; location: string; price: string; timeAgo: string; createdAt: string }
  | { type: "community"; id: number; title: string; category: string; timeAgo: string; createdAt: string };

type Filter = "all" | "map" | "community";

interface Props {
  posts: ProfilePost[];
  deletingPost: { id: number; type: "map" | "community" } | null;
  deleteLoading: boolean;
  onDeleteClick: (id: number, type: "map" | "community") => void;
  onDeleteConfirm: (id: number, type: "map" | "community") => void;
  onDeleteCancel: () => void;
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "map", label: "음악맵" },
  { id: "community", label: "커뮤니티" },
];

export default function PostsTab({
  posts,
  deletingPost,
  deleteLoading,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = filter === "all" ? posts : posts.filter((p) => p.type === filter);

  return (
    <div className="flex flex-col gap-4">
      {/* 필터 탭 */}
      <div className="flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-semibold border transition-colors cursor-pointer ${
              filter === f.id
                ? "bg-brand text-white border-brand"
                : "bg-white text-text-muted border-border-base hover:border-brand hover:text-brand"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border-card overflow-hidden">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <p className="text-[14px]">작성한 글이 없어요.</p>
            <Link href="/" className="mt-4 text-[12px] text-brand hover:underline">글 작성하러 가기 →</Link>
          </div>
        ) : (
          <ul className="divide-y divide-border-base">
            {visible.map((post) => {
              const isDeleting = deletingPost?.id === post.id && deletingPost?.type === post.type;
              return (
                <li key={`${post.type}-${post.id}`} className="flex items-center gap-2 px-4 sm:px-6 py-3 hover:bg-surface-card transition-colors">
                  {post.type === "map" ? (
                    <Link href={`/post/${post.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center text-xl shrink-0">
                        {post.imageEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-semibold text-brand bg-brand-bg px-1.5 py-0.5 rounded shrink-0">음악맵</span>
                          <p className="text-[14px] font-semibold text-text-heading truncate">{post.title}</p>
                        </div>
                        <p className="text-[12px] text-text-muted">{post.location} · {post.timeAgo}</p>
                      </div>
                      <span className="text-[13px] font-semibold text-brand shrink-0 mr-2">{post.price}</span>
                    </Link>
                  ) : (
                    <Link href={`/community/${post.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-semibold text-text-muted bg-surface-card px-1.5 py-0.5 rounded shrink-0">{post.category}</span>
                          <p className="text-[14px] font-semibold text-text-heading truncate">{post.title}</p>
                        </div>
                        <p className="text-[12px] text-text-muted">{post.timeAgo}</p>
                      </div>
                    </Link>
                  )}

                  {isDeleting ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onDeleteConfirm(post.id, post.type)}
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
                      onClick={() => onDeleteClick(post.id, post.type)}
                      className="shrink-0 px-2.5 h-7 rounded-lg border border-red-300 text-red-500 text-[11px] font-semibold bg-transparent cursor-pointer hover:bg-red-50 transition-colors"
                    >
                      삭제
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
