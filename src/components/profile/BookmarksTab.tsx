"use client";

import Link from "next/link";
import type { SearchResultItem } from "@/data/sampleMockResults";

interface Props {
  bookmarks: SearchResultItem[];
}

export default function BookmarksTab({ bookmarks }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-border-card overflow-hidden">
      {bookmarks.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-text-muted text-[14px]">
          북마크한 글이 없어요.
        </div>
      ) : (
        <ul className="divide-y divide-border-base">
          {bookmarks.map((post) => (
            <li key={post.id}>
              <Link href={`/post/${post.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-card transition-colors">
                <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center text-xl shrink-0">
                  {post.imageEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-text-heading truncate">{post.title}</p>
                  <p className="text-[12px] text-text-muted mt-0.5">{post.location} · {post.timeAgo}</p>
                </div>
                <span className="text-[13px] font-semibold text-brand shrink-0">{post.price}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
