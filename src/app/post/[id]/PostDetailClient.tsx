"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCreatePost } from "@/hooks/useCreatePost";
import type { SearchResultItem } from "@/data/sampleMockResults";
import Header from "@/components/organisms/Header";
import Avatar from "@/components/atom/Avatar";
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
import { tagLinkCls, directionBadgeCls } from "@/lib/tagStyles";

export default function PostDetailClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const myUserId = (session?.user as any)?.id as number | undefined;
  const { createPost } = useCreatePost();

  const [item, setItem] = useState<SearchResultItem | null>(null);
  const [postLoading, setPostLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [writeNewOpen, setWriteNewOpen] = useState(false);
  const [postDeletePending, setPostDeletePending] = useState(false);
  const [postDeleting, setPostDeleting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [mobileReportOpen, setMobileReportOpen] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  const REPORT_REASONS = ["스팸/광고", "불법 정보", "욕설/혐오", "사기 의심", "기타"];

  const handleReport = async (reason: string) => {
    const res = await fetch(`/api/posts/${id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setReportOpen(false);
    setMobileReportOpen(false);
    if (res.ok) setReportDone(true);
  };

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
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => window.history.length > 1 ? router.back() : router.push("/")}
              className="px-5 py-2 rounded-full border border-border-base text-xs text-text-body hover:bg-surface-card transition-colors cursor-pointer bg-transparent"
            >
              돌아가기
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-5 py-2 rounded-full bg-brand text-white text-xs font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity"
            >
              홈으로
            </button>
          </div>
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
      <WritePostModal
        isOpen={writeNewOpen}
        onClose={() => setWriteNewOpen(false)}
        onSubmit={async (draft) => { await createPost(draft); setWriteNewOpen(false); }}
      />

      <div className="mx-auto px-3 sm:px-6 pt-5 sm:pt-8 pb-20" style={{ maxWidth: "var(--max-w-hero)" }}>
        {/* 뒤로가기 + 수정/삭제 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => window.history.length > 1 ? router.back() : router.push("/")}
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
                  <span className="inline-block text-[13px] font-semibold text-brand bg-brand-bg px-2.5 py-0.5 rounded-full">
                    {item.category}
                  </span>
                  {item.direction && (
                    <span className={`inline-block text-[12px] font-semibold px-2 py-0.5 rounded-full ${directionBadgeCls(item.direction)}`}>
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
              <h1 className="mt-2 text-[24px] font-bold text-text-heading leading-snug">{item.title}</h1>
            </div>

            <hr className="border-border-base" />

            <div className="flex flex-col gap-3">
              <InfoRow label="가격" value={item.price} highlight />
              <InfoRow label="지역" value={item.location} />
              <InfoRow
                label="등록일"
                value={item.createdAt
                  ? new Date(item.createdAt).toLocaleString("ko-KR", {
                      year: "numeric", month: "long", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })
                  : item.timeAgo}
              />
              {item.author && item.authorId && (
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-semibold text-text-muted w-14 shrink-0">작성자</span>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Link href={`/profile/${item.authorId}`} className="shrink-0 hover:opacity-75 transition-opacity">
                      <Avatar
                        src={item.authorAvatarUrl}
                        name={item.author}
                        className="w-7 h-7"
                        textClassName="text-[11px]"
                      />
                    </Link>
                    <AuthorLink authorId={item.authorId} name={item.author} className="text-[15px] text-text-body font-medium" />
                  </div>
                  {/* 오른쪽: 채팅 + 신고 (데스크톱만) */}
                  {!isAuthor && myUserId && (
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      {reportDone ? (
                        <span className="text-[13px] text-text-muted">신고 접수됨</span>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={() => setReportOpen((v) => !v)}
                            className="px-3 h-7 rounded-lg border border-border-base text-[13px] text-text-muted bg-transparent cursor-pointer hover:border-red-300 hover:text-red-400 transition-colors"
                          >
                            신고
                          </button>
                          {reportOpen && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setReportOpen(false)} />
                              <div className="absolute right-0 top-full mt-1 z-40 bg-white rounded-xl border border-border-base shadow-lg py-1 min-w-35">
                                {REPORT_REASONS.map((r) => (
                                  <button
                                    key={r}
                                    onClick={() => handleReport(r)}
                                    className="w-full text-left px-4 py-2.5 text-[13px] text-text-body hover:bg-surface-card border-none bg-transparent cursor-pointer"
                                  >
                                    {r}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => router.push(`/messages/${item.authorId}`)}
                        className="px-3 h-7 rounded-lg border border-brand text-brand text-[13px] font-semibold bg-transparent cursor-pointer hover:bg-brand-bg transition-colors shrink-0"
                      >
                        채팅
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {item.description && (
              <>
                <hr className="border-border-base" />
                <div className="flex flex-col gap-2">
                  <p className="text-[13px] font-semibold text-text-muted">기타 사항</p>
                  <p className="text-[15px] text-text-body leading-relaxed whitespace-pre-wrap">{item.description}</p>
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
                      className={`px-3 py-1 rounded-full text-[13px] border transition-colors ${tagLinkCls(item.tags)}`}
                    >
                      #{kw}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <CommentSection postId={id} postAuthorId={item.authorId} />
      </div>

      {/* 모바일 하단 액션 버튼 */}
      <div className="fab-above-nav sm:hidden fixed right-4 z-50 flex flex-col items-end gap-2">
        {!isAuthor && myUserId && !reportDone && (
          <button
            onClick={() => setMobileReportOpen(true)}
            className="flex items-center px-4 rounded-full bg-white shadow-md border border-border-base text-[13px] font-medium text-text-muted cursor-pointer hover:bg-surface-card transition-colors"
            style={{ height: "36px" }}
          >
            신고
          </button>
        )}
        {!isAuthor && item.authorId && myUserId && (
          <button
            onClick={() => router.push(`/messages/${item.authorId}`)}
            className="flex items-center px-4 rounded-full bg-white shadow-md border border-border-base text-[13px] font-semibold text-text-body cursor-pointer hover:bg-surface-card transition-colors"
            style={{ height: "36px" }}
          >
            채팅하기
          </button>
        )}
        {session && (
          <button
            onClick={() => setWriteNewOpen(true)}
            className="flex items-center gap-1.5 bg-brand text-white text-[13px] font-semibold px-5 rounded-full border-none cursor-pointer hover:opacity-85 transition-opacity shadow-lg"
            style={{ height: "44px" }}
          >
            ✦ 글쓰기
          </button>
        )}
      </div>

      {/* 모바일 신고 바텀시트 */}
      <div className="sm:hidden">
        {mobileReportOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setMobileReportOpen(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl overflow-hidden">
              <div className="px-4 py-4 border-b border-border-base">
                <p className="text-[15px] font-semibold text-center text-text-heading">신고 사유 선택</p>
              </div>
              <div className="flex flex-col">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => { handleReport(r); setMobileReportOpen(false); }}
                    className="w-full text-left px-6 py-4 text-[15px] text-text-body hover:bg-surface-card border-none bg-transparent cursor-pointer border-t border-border-base first:border-t-0"
                  >
                    {r}
                  </button>
                ))}
                <button
                  onClick={() => setMobileReportOpen(false)}
                  className="w-full px-6 py-4 text-[15px] text-text-muted font-semibold border-none bg-transparent cursor-pointer border-t border-border-base"
                >
                  취소
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
