"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/organisms/Header";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import PageNumbers from "@/components/atom/PageNumbers";
import Spinner from "@/components/atom/Spinner";

const CATEGORIES = ["전체", "자유", "문의"];

interface Post {
  id: number; title: string; category: string; content: string; createdAt: string;
  author: { id: number; nickname: string | null; name: string; avatarUrl: string | null };
  _count: { comments: number; likes: number };
}

function CommunityContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session } = useSession();

  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [searchInput, setSearchInput] = useState(params.get("q") ?? "");

  const category = params.get("category") ?? "전체";
  const page = Number(params.get("page") ?? "1");
  const PAGE_SIZE = 10;

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (category !== "전체") sp.set("category", category);
    if (search) sp.set("q", search);
    sp.set("page", String(page));

    fetch(`/api/community?${sp}`)
      .then((r) => r.json())
      .then(({ posts, total }) => { setPosts(posts ?? []); setTotal(total ?? 0); })
      .finally(() => setLoading(false));
  }, [category, search, page]);

  const navigate = (overrides: Record<string, string>) => {
    const sp = new URLSearchParams(params.toString());
    Object.entries(overrides).forEach(([k, v]) => v ? sp.set(k, v) : sp.delete(k));
    sp.delete("page");
    router.push(`/community?${sp}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    navigate({ q: searchInput });
  };

  const handleWrite = () => {
    if (!session) { alert("글을 작성하려면 로그인이 필요해요."); return; }
    router.push("/community/write");
  };

  return (
    <main className="mx-auto px-4 sm:px-6 pt-8 pb-20" style={{ maxWidth: "760px" }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-text-heading">커뮤니티</h1>
        <button
          onClick={handleWrite}
          className="px-4 h-9 rounded-xl bg-brand text-white text-[13px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity"
        >
          글쓰기
        </button>
      </div>

      {/* 검색 */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="제목 또는 내용으로 검색"
          className="flex-1 h-10 px-4 rounded-xl border border-border-base text-[13px] focus:outline-none focus:border-brand transition-colors bg-white"
        />
        <button type="submit" className="px-4 h-10 rounded-xl border border-border-base text-[13px] text-text-body bg-white cursor-pointer hover:border-brand transition-colors">
          검색
        </button>
      </form>

      {/* 카테고리 탭 */}
      <div className="flex gap-1 mb-5 bg-white rounded-2xl border border-border-card p-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => navigate({ category: c === "전체" ? "" : c })}
            className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-colors border-none cursor-pointer ${
              category === c || (c === "전체" && !params.get("category"))
                ? "bg-brand text-white"
                : "bg-transparent text-text-muted hover:text-text-body"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 글 목록 */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-text-muted text-[14px]">게시글이 없어요.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p) => <CommunityPostCard key={p.id} post={p} />)}
        </div>
      )}

      {/* 페이지네이션 */}
      {total > PAGE_SIZE && (
        <div className="mt-8">
          <PageNumbers
            current={page}
            total={Math.ceil(total / PAGE_SIZE)}
            onChange={(p: number) => {
              const sp = new URLSearchParams(params.toString());
              sp.set("page", String(p));
              router.push(`/community?${sp}`);
            }}
          />
        </div>
      )}
    </main>
  );
}

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-surface-page">
      <Header />
      <Suspense fallback={<div className="flex justify-center pt-40"><Spinner /></div>}>
        <CommunityContent />
      </Suspense>
    </div>
  );
}
