"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Header from "@/components/organisms/Header";
import Avatar from "@/components/atom/Avatar";
import AuthorLink from "@/components/atom/AuthorLink";
import Spinner from "@/components/atom/Spinner";
import { StarRating, InteractiveStars } from "@/components/atom/StarRating";

interface PublicPost {
  id: number;
  title: string;
  priceDisplay: string;
  imageEmoji: string;
  location: string;
  createdAt: string;
  direction: string;
  categories: { category: { name: string } }[];
}

interface ReviewItem {
  id: number;
  rating: number;
  content: string | null;
  createdAt: string;
  postId: number | null;
  reviewer: { id: number; name: string; nickname: string | null; avatarUrl: string | null };
}

interface PublicProfile {
  id: number;
  name: string;
  nickname: string | null;
  avatarUrl: string | null;
  bio: string | null;
  contact: string | null;
  representativeSong: string | null;
  createdAt: string;
  posts: PublicPost[];
  reviewsReceived: ReviewItem[];
  avgRating: number | null;
  reviewCount: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const myUserId = (session?.user as any)?.id as number | undefined;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 리뷰 작성 폼
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRating || reviewSubmitting) return;
    setReviewSubmitting(true);
    setReviewError("");
    try {
      const res = await fetch(`/api/users/${userId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, content: reviewContent }),
      });
      const data = await res.json();
      if (!res.ok) { setReviewError(data.error ?? "오류가 발생했어요."); return; }
      setProfile((p) =>
        p
          ? {
              ...p,
              reviewsReceived: [data, ...p.reviewsReceived],
              reviewCount: p.reviewCount + 1,
              avgRating:
                p.reviewCount === 0
                  ? reviewRating
                  : Math.round(((p.avgRating ?? 0) * p.reviewCount + reviewRating) / (p.reviewCount + 1) * 10) / 10,
            }
          : p,
      );
      setReviewRating(0);
      setReviewContent("");
      setReviewSuccess(true);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-page">
        <Header />
        <div className="flex items-center justify-center py-40">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface-page">
        <Header />
        <div className="flex flex-col items-center justify-center py-40 text-text-muted text-[15px] gap-4">
          <p>사용자를 찾을 수 없어요.</p>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-full border border-border-base text-[13px] bg-transparent cursor-pointer hover:bg-surface-card">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile.nickname ?? profile.name;
  const isMyProfile = myUserId === profile.id;

  return (
    <div className="min-h-screen bg-surface-page text-text-body">
      <Header />

      <div className="mx-auto px-3 sm:px-6 pt-5 sm:pt-8 pb-20 flex flex-col gap-5" style={{ maxWidth: "720px" }}>
        {/* 뒤로가기 */}
        <button
          onClick={() => router.back()}
          className="self-start text-[13px] text-text-muted hover:text-text-body border-none bg-transparent cursor-pointer"
        >
          ← 돌아가기
        </button>

        {/* 프로필 헤더 */}
        <div className="bg-white rounded-2xl border border-border-card px-5 py-6 sm:px-8 sm:py-7 flex flex-col gap-5">
          <div className="flex items-start gap-4">
            {/* 아바타 */}
            <div className="shrink-0">
              <Avatar src={profile.avatarUrl} name={displayName} className="w-20 h-20" textClassName="text-3xl" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[20px] font-bold text-text-heading">{displayName}</p>
              <p className="text-[12px] text-text-muted mt-0.5">
                가입일 {formatDate(profile.createdAt)}
              </p>
              {/* 평점 요약 */}
              {profile.reviewCount > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <StarRating rating={Math.round(profile.avgRating ?? 0)} />
                  <span className="text-[14px] font-bold text-text-heading">{profile.avgRating}</span>
                  <span className="text-[12px] text-text-muted">({profile.reviewCount}개 리뷰)</span>
                </div>
              )}
              {isMyProfile && (
                <Link
                  href="/profile"
                  className="inline-block mt-2 text-[12px] text-brand border border-brand rounded-full px-3 py-1 hover:bg-brand-bg transition-colors"
                >
                  내 정보 수정
                </Link>
              )}
            </div>
          </div>

          {/* 소개글 */}
          {profile.bio && (
            <div className="border-t border-border-base pt-4">
              <p className="text-[13px] font-semibold text-text-muted mb-1.5">소개</p>
              <p className="text-[14px] text-text-body leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {/* 연락처 */}
          {profile.contact && (
            <div className="flex items-start gap-2 border-t border-border-base pt-4">
              <span className="text-[13px] font-semibold text-text-muted w-14 shrink-0">연락처</span>
              <p className="text-[14px] text-text-body leading-relaxed whitespace-pre-wrap break-all">{profile.contact}</p>
            </div>
          )}

          {/* 대표 음원 */}
          {profile.representativeSong && (
            <div className="flex items-center gap-2 border-t border-border-base pt-4">
              <span className="text-[13px] font-semibold text-text-muted w-14 shrink-0">대표 음원</span>
              <a
                href={profile.representativeSong}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] text-brand hover:underline truncate"
              >
                🎵 {profile.representativeSong}
              </a>
            </div>
          )}
        </div>

        {/* 게시글 목록 */}
        {profile.posts.length > 0 && (
          <div className="bg-white rounded-2xl border border-border-card px-5 py-5 sm:px-8 sm:py-6">
            <h2 className="text-[15px] font-bold text-text-heading mb-4">
              {displayName}님의 게시글
              <span className="text-brand ml-1.5">{profile.posts.length}</span>
            </h2>
            <div className="flex flex-col divide-y divide-border-base">
              {profile.posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="flex items-center gap-3 py-3 hover:text-brand transition-colors group"
                >
                  <span className="text-2xl shrink-0">{post.imageEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-text-heading group-hover:text-brand truncate">{post.title}</p>
                    <p className="text-[12px] text-text-muted">
                      {post.categories[0]?.category.name ?? ""} · {post.location} · {formatDate(post.createdAt)}
                    </p>
                  </div>
                  <span className="text-[14px] font-bold text-text-heading shrink-0">{post.priceDisplay}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 리뷰 섹션 */}
        <div className="bg-white rounded-2xl border border-border-card px-5 py-5 sm:px-8 sm:py-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-bold text-text-heading">리뷰</h2>
            {profile.reviewCount > 0 && (
              <div className="flex items-center gap-1.5">
                <StarRating rating={Math.round(profile.avgRating ?? 0)} size={14} />
                <span className="text-[13px] font-bold">{profile.avgRating}</span>
                <span className="text-[12px] text-text-muted">({profile.reviewCount})</span>
              </div>
            )}
          </div>

          {/* 리뷰 목록 */}
          {profile.reviewsReceived.length === 0 ? (
            <p className="text-[13px] text-text-muted py-2">아직 리뷰가 없어요.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-base">
              {profile.reviewsReceived.map((rv) => (
                <li key={rv.id} className="py-4 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Avatar src={rv.reviewer.avatarUrl} name={rv.reviewer.nickname ?? rv.reviewer.name} className="w-7 h-7 shrink-0" textClassName="text-[11px]" />
                    <AuthorLink authorId={rv.reviewer.id} name={rv.reviewer.nickname ?? rv.reviewer.name} className="text-[13px] font-semibold text-text-heading" />
                    <StarRating rating={rv.rating} size={13} />
                    <span className="text-[11px] text-text-muted ml-auto">{formatDate(rv.createdAt)}</span>
                  </div>
                  {rv.content && <p className="text-[13px] text-text-body leading-relaxed pl-9">{rv.content}</p>}
                </li>
              ))}
            </ul>
          )}

          {/* 리뷰 작성 폼 (본인 제외, 로그인 필요) */}
          {!isMyProfile && (
            <div className="border-t border-border-base pt-5">
              {!session ? (
                <p className="text-[13px] text-text-muted">
                  리뷰를 남기려면{" "}
                  <Link href="/login" className="text-brand hover:underline font-semibold">로그인</Link>
                  이 필요해요.
                </p>
              ) : reviewSuccess ? (
                <p className="text-[13px] text-brand font-semibold">✓ 리뷰가 등록됐어요. 감사합니다!</p>
              ) : (
                <form onSubmit={handleReviewSubmit} className="flex flex-col gap-3">
                  <p className="text-[13px] font-semibold text-text-heading">리뷰 작성</p>
                  <p className="text-[12px] text-text-muted -mt-2">
                    이 사용자의 게시글에 댓글을 남긴 이력이 있어야 리뷰를 작성할 수 있어요.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-text-muted">별점</span>
                    <InteractiveStars value={reviewRating} onChange={setReviewRating} />
                    {reviewRating > 0 && <span className="text-[13px] font-bold text-amber-500">{reviewRating}점</span>}
                  </div>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="이 사용자와 거래하거나 소통한 경험을 공유해 주세요."
                    className="w-full px-3 py-2 rounded-lg border border-border-base text-[13px] text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-brand transition-colors resize-none"
                  />
                  {reviewError && <p className="text-[12px] text-red-500">{reviewError}</p>}
                  <button
                    type="submit"
                    disabled={!reviewRating || reviewSubmitting}
                    className="self-start px-5 h-9 rounded-xl bg-brand text-white text-[13px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {reviewSubmitting ? "등록중…" : "리뷰 등록"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
