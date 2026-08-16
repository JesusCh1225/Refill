"use client";

import Link from "next/link";

export interface LikedPost {
  id: number;
  title: string;
  category: string;
  createdAt: string;
  _count: { comments: number; likes: number };
}

interface Props {
  likes: LikedPost[];
}

export default function LikesTab({ likes }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-border-card overflow-hidden">
      {likes.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-[14px]">
          좋아요한 글이 없어요.
        </div>
      ) : (
        <ul className="divide-y divide-border-base">
          {likes.map((post) => (
            <li key={post.id}>
              <Link
                href={`/community/${post.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-surface-card transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-brand">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-semibold text-text-muted bg-surface-card px-1.5 py-0.5 rounded shrink-0">
                      {post.category}
                    </span>
                    <p className="text-[14px] font-semibold text-text-heading truncate">{post.title}</p>
                  </div>
                  <p className="text-[12px] text-text-muted">
                    댓글 {post._count.comments} · 좋아요 {post._count.likes}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
