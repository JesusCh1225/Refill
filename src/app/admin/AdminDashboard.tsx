"use client";

import { useEffect, useState, useCallback } from "react";
import Avatar from "@/components/atom/Avatar";
import Spinner from "@/components/atom/Spinner";

type Tab = "posts" | "users";

interface PostItem {
  id: number;
  title: string;
  category: string;
  createdAt: string;
  author: { id: number; name: string; nickname: string | null; email: string | null };
  _count: { comments: number };
}

interface UserItem {
  id: number;
  name: string;
  email: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  createdAt: string;
  _count: { communityPosts: number; posts: number };
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("posts");

  return (
    <main className="mx-auto px-4 sm:px-6 pt-8 pb-20" style={{ maxWidth: "900px" }}>
      <h1 className="text-[22px] font-bold text-text-heading mb-6">관리자 대시보드</h1>

      <div className="flex gap-1 mb-6 border-b border-border-base">
        {(["posts", "users"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-[14px] font-semibold border-none bg-transparent cursor-pointer transition-colors ${
              tab === t
                ? "text-brand border-b-2 border-brand -mb-px"
                : "text-text-muted hover:text-text-body"
            }`}
          >
            {t === "posts" ? "커뮤니티 게시글" : "회원"}
          </button>
        ))}
      </div>

      {tab === "posts" && <PostsTab />}
      {tab === "users" && <UsersTab />}
    </main>
  );
}

function PostsTab() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts?page=${p}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
        setTotal(data.total);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`"${title}" 게시글을 삭제할까요?`)) return;
    setDeleting(id);
    const res = await fetch(`/api/community/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => t - 1);
    } else {
      alert("삭제에 실패했어요.");
    }
    setDeleting(null);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <p className="text-[13px] text-text-muted mb-4">전체 {total}개</p>
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : posts.length === 0 ? (
        <p className="text-center text-text-muted py-16 text-[14px]">게시글이 없어요.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-xl border border-border-card px-4 py-3 flex items-center gap-3"
            >
              <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                post.category === "자유" ? "bg-brand-bg text-brand" : "bg-amber-50 text-amber-600"
              }`}>
                {post.category}
              </span>
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
              <button
                onClick={() => handleDelete(post.id, post.title)}
                disabled={deleting === post.id}
                className="shrink-0 px-3 h-8 rounded-lg bg-red-50 text-red-500 text-[12px] font-semibold border border-red-200 cursor-pointer hover:bg-red-100 transition-colors disabled:opacity-40"
              >
                {deleting === post.id ? "…" : "삭제"}
              </button>
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-[13px] border cursor-pointer transition-colors ${
                p === page
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-text-body border-border-base hover:border-brand/50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${p}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" 계정을 삭제할까요?\n해당 사용자의 모든 게시글과 댓글도 함께 삭제됩니다.`)) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setTotal((t) => t - 1);
    } else {
      alert("삭제에 실패했어요.");
    }
    setDeleting(null);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <p className="text-[13px] text-text-muted mb-4">전체 {total}명</p>
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : users.length === 0 ? (
        <p className="text-center text-text-muted py-16 text-[14px]">회원이 없어요.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((user) => {
            const displayName = user.nickname ?? user.name;
            return (
              <div
                key={user.id}
                className="bg-white rounded-xl border border-border-card px-4 py-3 flex items-center gap-3"
              >
                <Avatar src={user.avatarUrl} name={displayName} className="w-9 h-9 shrink-0" textClassName="text-[11px]" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-text-heading">
                    {displayName}
                    {user.nickname && <span className="ml-1 text-[12px] text-text-muted font-normal">({user.name})</span>}
                  </p>
                  <p className="text-[12px] text-text-muted mt-0.5">
                    {user.email ?? "이메일 없음"}
                    <span className="mx-1">·</span>
                    가입일 {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                    <span className="mx-1">·</span>
                    커뮤니티 {user._count.communityPosts}개
                    <span className="mx-1">·</span>
                    지도글 {user._count.posts}개
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(user.id, displayName)}
                  disabled={deleting === user.id}
                  className="shrink-0 px-3 h-8 rounded-lg bg-red-50 text-red-500 text-[12px] font-semibold border border-red-200 cursor-pointer hover:bg-red-100 transition-colors disabled:opacity-40"
                >
                  {deleting === user.id ? "…" : "삭제"}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-[13px] border cursor-pointer transition-colors ${
                p === page
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-text-body border-border-base hover:border-brand/50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
