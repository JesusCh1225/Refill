"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { SearchResultItem } from "@/data/sampleMockResults";
import Header from "@/components/organisms/Header";
import AuthorLink from "@/components/atom/AuthorLink";
import Spinner from "@/components/atom/Spinner";
import InfoRow from "@/components/atom/InfoRow";
import BookmarkButton from "@/components/atom/BookmarkButton";
import ConfirmDeleteButton from "@/components/atom/ConfirmDeleteButton";
import WritePostModal from "@/components/organisms/WritePostModal";
import PostImageCarousel from "@/components/post/PostImageCarousel";
import CommentSection from "@/components/post/CommentSection";
import { useBookmarks } from "@/lib/useBookmarks";
import { dirLabel } from "@/lib/dirLabel";

function tagChipClass(tags: string[]) {
  if (tags.includes("lesson"))
    return "bg-violet-50 text-violet-600 border-violet-200 hover:border-violet-400 hover:text-violet-700";
  if (tags.includes("band"))
    return "bg-teal-50 text-teal-600 border-teal-200 hover:border-teal-400 hover:text-teal-700";
  if (tags.includes("instrument") || tags.includes("equipment"))
    return "bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400 hover:text-amber-700";
  return "bg-surface-card text-text-muted border-border-base hover:border-brand hover:text-brand";
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

  const [item, setItem] = useState<SearchResultItem | null>(null);
  const [postLoading, setPostLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [postDeletePending, setPostDeletePending] = useState(false);
  const [postDeleting, setPostDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then((data: SearchResultItem) => setItem(data))
      .catch(() => setItem(null))
      .finally(() => setPostLoading(false));
  }, [id]);

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

  if (postLoading) {
    return (
      <div className="min-h-screen bg-surface-page">
        <Header />
        <div className="flex items-center justify-center py-40">
          <Spinner />
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

  const isAuthor = myUserId !== undefined && item.authorId === myUserId;

  return (
    <div className="min-h-screen bg-surface-page text-text-body">
      <Header />
      <WritePostModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSubmit={() => {}}
        editData={item}
        onEditComplete={(updated) => setItem(updated)}
      />

      <div className="mx-auto px-3 sm:px-6 pt-5 sm:pt-8 pb-20" style={{ maxWidth: "var(--max-w-hero)" }}>
        {/* 뒤로가기 + 수정/삭제 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-body transition-colors cursor-pointer bg-transparent border-none"
          >
            ← 목록으로
          </button>
          {isAuthor && (
            <div className="flex items-center gap-2">
              {!postDeletePending && (
                <button onClick={() => setEditModalOpen(true)} className="px-3 h-7 rounded-lg border border-brand text-brand text-[12px] font-semibold bg-transparent cursor-pointer hover:bg-brand-bg transition-colors">
                  수정
                </button>
              )}
              <ConfirmDeleteButton
                confirming={postDeletePending}
                onConfirmingChange={setPostDeletePending}
                onConfirm={handlePostDelete}
                pending={postDeleting}
                textSize="12px"
                confirmLabel="정말 삭제할까요?"
                triggerClassName="px-3 h-7 rounded-lg border border-red-300 text-red-500 text-[12px] font-semibold bg-transparent cursor-pointer hover:bg-red-50 transition-colors"
                confirmButtonClassName="px-3 h-7 rounded-lg bg-red-500 text-white text-[12px] font-semibold border-none cursor-pointer hover:bg-red-600 disabled:opacity-50"
                cancelButtonClassName="px-3 h-7 rounded-lg border border-border-base text-[12px] text-text-muted bg-white cursor-pointer hover:bg-surface-card"
              />
            </div>
          )}
        </div>

        {/* 게시글 카드 */}
        <div className="bg-white rounded-2xl border border-border-card overflow-hidden">
          <PostImageCarousel imageUrls={item.imageUrls} imageEmoji={item.imageEmoji} />

          <div className="px-4 py-5 sm:px-8 sm:py-7 flex flex-col gap-6">
            {/* 카테고리 + 제목 + 북마크 */}
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
                      {dirLabel(item.tags, item.direction)}
                    </span>
                  )}
                </div>
                <BookmarkButton
                  bookmarked={isBookmarked(item.id)}
                  onToggle={() => toggleBookmark(item.id)}
                  size={22}
                />
              </div>
              <h1 className="mt-2 text-[22px] font-bold text-text-heading leading-snug">{item.title}</h1>
            </div>

            <hr className="border-border-base" />

            <div className="flex flex-col gap-3">
              <InfoRow label="가격" value={item.price} highlight />
              <InfoRow label="지역" value={item.location} />
              <InfoRow label="등록일" value={item.timeAgo} />
              {item.author && item.authorId && (
                <div className="flex items-center gap-4">
                  <span className="text-[12px] font-semibold text-text-muted w-14 shrink-0">작성자</span>
                  <AuthorLink authorId={item.authorId} name={item.author} className="text-[14px] text-text-body font-medium" />
                </div>
              )}
            </div>

            {item.description && (
              <>
                <hr className="border-border-base" />
                <div className="flex flex-col gap-2">
                  <p className="text-[12px] font-semibold text-text-muted">기타 사항</p>
                  <p className="text-[14px] text-text-body leading-relaxed whitespace-pre-wrap">{item.description}</p>
                </div>
              </>
            )}

            {item.keywords.length > 0 && (
              <>
                <hr className="border-border-base" />
                <div className="flex flex-wrap gap-2">
                  {item.keywords.map((kw) => (
                    <Link
                      key={kw}
                      href={`/musicmap?q=${encodeURIComponent(kw)}`}
                      className={`px-3 py-1 rounded-full text-[11px] border transition-colors ${tagChipClass(item.tags)}`}
                    >
                      #{kw}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <CommentSection postId={id} />
      </div>
    </div>
  );
}
