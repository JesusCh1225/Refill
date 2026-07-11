"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/atom/Avatar";
import Spinner from "@/components/atom/Spinner";

type Tab = "posts" | "users";
type PostType = "community" | "map";

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

interface UserItem {
  id: number;
  name: string;
  email: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  createdAt: string;
  _count: { communityPosts: number; posts: number };
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center gap-2 mt-6">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-8 h-8 rounded-lg text-[13px] border cursor-pointer transition-colors ${
            p === page ? "bg-brand text-white border-brand" : "bg-white text-text-body border-border-base hover:border-brand/50"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
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
              tab === t ? "text-brand border-b-2 border-brand -mb-px" : "text-text-muted hover:text-text-body"
            }`}
          >
            {t === "posts" ? "게시글" : "회원"}
          </button>
        ))}
      </div>

      {tab === "posts" && <PostsTab />}
      {tab === "users" && <UsersTab />}
    </main>
  );
}

function PostsTab() {
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
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/posts?type=community&page=${p}`);
      if (res.ok) { const d = await res.json(); setPosts(d.posts); setTotal(d.total); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const del = async (id: number, title: string) => {
    if (!confirm(`"${title}" 게시글을 삭제할까요?`)) return;
    setDeleting(id);
    const res = await fetch(`/api/community/${id}`, { method: "DELETE" });
    if (res.ok) { setPosts((p) => p.filter((x) => x.id !== id)); setTotal((t) => t - 1); }
    else alert("삭제 실패");
    setDeleting(null);
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
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
      <Pagination page={page} totalPages={Math.ceil(total / 20)} onChange={(p) => { setPage(p); load(p); }} />
    </div>
  );
}

function MapPostsList() {
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
    else alert("삭제 실패");
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

function UsersTab() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${p}`);
      if (res.ok) { const d = await res.json(); setUsers(d.users); setTotal(d.total); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const del = async (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    if (!confirm(`"${name}" 계정을 삭제할까요?\n해당 사용자의 모든 게시글과 댓글도 함께 삭제됩니다.`)) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) { setUsers((p) => p.filter((u) => u.id !== id)); setTotal((t) => t - 1); }
    else alert("삭제 실패");
    setDeleting(null);
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <div>
      <p className="text-[13px] text-text-muted mb-3">전체 {total}명</p>
      {users.length === 0 ? (
        <p className="text-center text-text-muted py-16 text-[14px]">회원이 없어요.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((user) => {
            const displayName = user.nickname ?? user.name;
            return (
              <div
                key={user.id}
                onClick={() => router.push(`/admin/users/${user.id}`)}
                className="bg-white rounded-xl border border-border-card px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-brand/40 hover:shadow-sm transition-all"
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
                    가입 {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                    <span className="mx-1">·</span>
                    커뮤니티 {user._count.communityPosts}개
                    <span className="mx-1">·</span>
                    지도글 {user._count.posts}개
                  </p>
                </div>
                <button
                  onClick={(e) => del(e, user.id, displayName)}
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
      <Pagination page={page} totalPages={Math.ceil(total / 20)} onChange={(p) => { setPage(p); load(p); }} />
    </div>
  );
}
