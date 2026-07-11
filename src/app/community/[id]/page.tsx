"use client";

import "@/styles/community.css";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/organisms/Header";
import Avatar from "@/components/atom/Avatar";
import Spinner from "@/components/atom/Spinner";
import CommunityComments from "@/components/community/CommunityComments";

interface Post {
  id: number;
  title: string;
  category: string;
  content: string;
  createdAt: string;
  liked: boolean;
  author: { id: number; nickname: string | null; name: string; avatarUrl: string | null };
  _count: { comments: number; likes: number };
}

const CATEGORY_COLOR: Record<string, string> = {
  "자유": "bg-brand-bg text-brand",
  "문의": "bg-amber-50 text-amber-600",
};

export default function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const myId = (session?.user as any)?.id as number | undefined;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/community/${id}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/community/${id}/comments`).then((r) => r.json()),
    ]).then(([p, c]) => {
      if (!p) { router.replace("/community"); return; }
      setPost(p);
      setLiked(p.liked);
      setLikeCount(p._count.likes);
      setComments(Array.isArray(c) ? c : []);
    }).finally(() => setLoading(false));
  }, [id, router]);

  const handleLike = async () => {
    if (!session) { alert("로그인이 필요해요."); return; }
    const res = await fetch(`/api/community/${id}/like`, { method: "POST" });
    if (res.ok) {
      const { liked: l, count } = await res.json();
      setLiked(l);
      setLikeCount(count);
    }
  };

  const handleDelete = async () => {
    if (!confirm("게시글을 삭제할까요?")) return;
    setDeleting(true);
    const res = await fetch(`/api/community/${id}`, { method: "DELETE" });
    if (res.ok) router.replace("/community");
    else setDeleting(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-surface-page">
      <Header />
      <div className="flex justify-center pt-40"><Spinner /></div>
    </div>
  );

  if (!post) return null;

  const displayName = post.author.nickname ?? post.author.name;

  return (
    <div className="min-h-screen bg-surface-page">
      <Header />
      <main className="mx-auto px-4 sm:px-6 pt-8 pb-20" style={{ maxWidth: "760px" }}>
        {/* 뒤로 가기 */}
        <Link href="/community" className="inline-flex items-center gap-1 text-[13px] text-text-muted hover:text-brand transition-colors mb-5">
          ← 커뮤니티
        </Link>

        <div className="bg-white rounded-2xl border border-border-card px-5 sm:px-8 py-6">
          {/* 카테고리 + 제목 */}
          <div className="flex items-start gap-2 mb-4">
            <span className={`mt-0.5 shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[post.category] ?? ""}`}>
              {post.category}
            </span>
            <h1 className="text-[20px] font-bold text-text-heading leading-snug">{post.title}</h1>
          </div>

          {/* 작성자 정보 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Avatar src={post.author.avatarUrl} name={displayName} className="w-7 h-7" textClassName="text-[10px]" />
              <span className="text-[13px] font-semibold text-text-body">{displayName}</span>
              <span className="text-[12px] text-text-muted">
                {new Date(post.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
            {myId === post.author.id && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-[12px] text-red-400 hover:text-red-600 border-none bg-transparent cursor-pointer disabled:opacity-50"
              >
                {deleting ? "삭제 중…" : "삭제"}
              </button>
            )}
          </div>

          <hr className="border-border-base mb-6" />

          {/* 본문 (Tiptap HTML 렌더링) */}
          <div
            className="prose prose-sm max-w-none text-[14px] text-text-body leading-relaxed community-content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <hr className="border-border-base mt-6 mb-4" />

          {/* 좋아요 */}
          <div className="flex justify-center">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-6 py-2 rounded-full border transition-colors cursor-pointer text-[14px] font-semibold ${
                liked
                  ? "bg-red-50 border-red-300 text-red-500"
                  : "bg-white border-border-base text-text-muted hover:border-red-300 hover:text-red-400"
              }`}
            >
              ♥ <span>{likeCount}</span>
            </button>
          </div>
        </div>

        {/* 댓글 */}
        <CommunityComments postId={post.id} initial={comments} />
      </main>
    </div>
  );
}
