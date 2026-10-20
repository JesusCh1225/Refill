"use client";

import { useEffect, useState, useCallback } from "react";
import Spinner from "@/components/atom/Spinner";
import { useToast } from "@/context/toast";
import Pagination from "@/app/admin/Pagination";

interface CommunityPostItem {
  id: number;
  title: string;
  category: string;
  createdAt: string;
  author: { id: number; name: string; nickname: string | null; email: string | null };
  _count: { comments: number };
}

interface MapPostItem {
  id: number;
  title: string;
  location: string;
  status: string;
  createdAt: string;
  author: { id: number; name: string; nickname: string | null; email: string | null };
  categories: { category: { name: string } }[];
  _count: { comments: number };
}

type PostType = "community" | "map";
type CategoryFilter = "" | "자유" | "문의";

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "", label: "전체" },
  { value: "자유", label: "자유" },
  { value: "문의", label: "문의" },
];

export default function PostsTab() {
  const [postType, setPostType] = useState<PostType>("community");

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {(["community", "map"] as PostType[]).map((t) => (
          <button
            key={t}
            onClick={() => setPostType(t)}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold border cursor-pointer transition-colors ${
              postType === t ? "bg-brand text-white border-brand" : "bg-white text-text-muted border-border-base hover:border-brand/50"
            }`}
          >
            {t === "community" ? "커뮤니티 글" : "지도글"}
          </button>
        ))}
      </div>
      {postType === "community" ? <CommunityPostsList /> : <MapPostsList />}
    </div>
  );
}

function CommunityPostsList() {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<CategoryFilter>("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async (p: number, cat: CategoryFilter) => {
    setLoading(true);
    try {
      const q = cat ? `&category=${encodeURIComponent(cat)}` : "";
      const res = await fetch(`/api/admin/posts?type=community&page=${p}${q}`);
      if (res.ok) { const d = await res.json(); setPosts(d.posts); setTotal(d.total); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page, category); }, [page, category, load]);

  const handleCategory = (cat: CategoryFilter) => { setCategory(cat); setPage(1); };

  const del = async (id: number, title: string) => {
    if (!confirm(`"${title}" 게시글을 삭제할까요?`)) return;
    setDeleting(id);
    const res = await fetch(`/api/community/${id}`, { method: "DELETE" });
    if (res.ok) { setPosts((p) => p.filter((x) => x.id !== id)); setTotal((t) => t - 1); }
    else showToast("삭제에 실패했어요.", "error");
    setDeleting(null);
  };

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-surface-card rounded-xl p-1 w-fit">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleCategory(f.value)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold border-none cursor-pointer transition-colors ${
              category === f.value ? "bg-white text-text-heading shadow-sm" : "bg-transparent text-text-muted hover:text-text-body"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          <p className="text-[13px] text-text-muted mb-3">전체 {total}개</p>
          {posts.length === 0 ? (
            <p className="text-center text-text-muted py-16 text-[14px]">게시글이 없어요.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl border border-border-card px-4 py-3 flex items-center gap-3">
                  <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    post.category === "자유" ? "bg-brand-bg text-brand" : "bg-amber-50 text-amber-600"
                  }`}>{post.category}</span>
                  <div className="flex-1 min-w-0">
                    <a href={`/community/${post.id}`} target="_blank" rel="noopener noreferrer"
                      className="text-[14px] font-semibold text-text-heading hover:text-brand truncate block">
                      {post.title}
                    </a>
                    <p className="text-[12px] text-text-muted mt-0.5">
                      {post.author.nickname ?? post.author.name}
                      {post.author.email && <span className="ml-1 text-text-placeholder">({post.author.email})</span>}
                      <span className="mx-1">·</span>
                      {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                      <span className="mx-1">·</span>
                      댓글 {post._count.comments}
                    </p>
                  </div>
                  <button onClick={() => del(post.id, post.title)} disabled={deleting === post.id}
                    className="shrink-0 px-3 h-8 rounded-lg bg-red-50 text-red-500 text-[12px] font-semibold border border-red-200 cursor-pointer hover:bg-red-100 disabled:opacity-40">
                    {deleting === post.id ? "…" : "삭제"}
                  </button>
                </div>
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={Math.ceil(total / 20)} onChange={(p) => { setPage(p); load(p, category); }} />
        </>
      )}
    </div>
  );
}

function MapPostsList() {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<MapPostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts?type=map&page=${p}`);
      if (res.ok) { const d = await res.json(); setPosts(d.posts); setTotal(d.total); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const del = async (id: number, title: string) => {
    if (!confirm(`"${title}" 지도글을 삭제할까요?`)) return;
    setDeleting(id);
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) { setPosts((p) => p.filter((x) => x.id !== id)); setTotal((t) => t - 1); }
    else showToast("삭제에 실패했어요.", "error");
    setDeleting(null);
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <p className="text-[13px] text-text-muted mb-3">전체 {total}개</p>
      {posts.length === 0 ? (
        <p className="text-center text-text-muted py-16 text-[14px]">지도글이 없어요.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {posts.map((post) => {
            const cats = post.categories.map((c) => c.category.name).join(", ");
            return (
              <div key={post.id} className="bg-white rounded-xl border border-border-card px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <a href={`/post/${post.id}`} target="_blank" rel="noopener noreferrer"
                    className="text-[14px] font-semibold text-text-heading hover:text-brand truncate block">
                    {post.title}
                  </a>
                  <p className="text-[12px] text-text-muted mt-0.5">
                    {post.author.nickname ?? post.author.name}
                    {post.author.email && <span className="ml-1 text-text-placeholder">({post.author.email})</span>}
                    <span className="mx-1">·</span>
                    {post.location}{cats && ` · ${cats}`}
                    <span className="mx-1">·</span>
                    {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                    <span className="mx-1">·</span>
                    댓글 {post._count.comments}
                    {post.status === "HIDDEN" && <span className="ml-1 text-amber-500">(비공개)</span>}
                  </p>
                </div>
                <button onClick={() => del(post.id, post.title)} disabled={deleting === post.id}
                  className="shrink-0 px-3 h-8 rounded-lg bg-red-50 text-red-500 text-[12px] font-semibold border border-red-200 cursor-pointer hover:bg-red-100 disabled:opacity-40">
                  {deleting === post.id ? "…" : "삭제"}
                </button>
              </div>
            );
          })}
        </div>
      )}
      <Pagination page={page} totalPages={Math.ceil(total / 20)} onChange={(p) => { setPage(p); load(p); }} />
    </div>
  );
}
