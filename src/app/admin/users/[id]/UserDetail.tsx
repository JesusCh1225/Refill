"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Avatar from "@/components/atom/Avatar";
import Spinner from "@/components/atom/Spinner";

type Section = "communityPosts" | "mapPosts" | "communityComments" | "mapComments";

interface UserInfo {
  id: number;
  name: string;
  email: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  createdAt: string;
  _count: { communityPosts: number; posts: number; communityComments: number; comments: number };
}

interface CommunityPostItem {
  id: number;
  title: string;
  category: string;
  createdAt: string;
  _count: { comments: number };
}

interface MapPostItem {
  id: number;
  title: string;
  location: string;
  status: string;
  createdAt: string;
  categories: { category: { name: string } }[];
  _count: { comments: number };
}

interface CommunityCommentItem {
  id: number;
  content: string;
  createdAt: string;
  post: { id: number; title: string };
}

interface MapCommentItem {
  id: number;
  content: string;
  createdAt: string;
  postId: number;
  post: { id: number; title: string } | null;
}

const SECTION_LABELS: Record<Section, string> = {
  communityPosts: "커뮤니티 글",
  mapPosts: "지도글",
  communityComments: "커뮤니티 댓글",
  mapComments: "지도 댓글",
};

function DeleteBtn({ onClick, pending }: { onClick: () => void; pending: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="shrink-0 px-3 h-7 rounded-lg bg-red-50 text-red-500 text-[11px] font-semibold border border-red-200 cursor-pointer hover:bg-red-100 transition-colors disabled:opacity-40"
    >
      {pending ? "…" : "삭제"}
    </button>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center gap-2 mt-5">
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

export default function UserDetail({ userId }: { userId: number }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [section, setSection] = useState<Section>("communityPosts");
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setUser)
      .finally(() => setLoadingUser(false));
  }, [userId]);

  if (loadingUser) return <div className="flex justify-center pt-40"><Spinner /></div>;
  if (!user) return <p className="text-center pt-40 text-text-muted">회원을 찾을 수 없어요.</p>;

  const displayName = user.nickname ?? user.name;

  return (
    <main className="mx-auto px-4 sm:px-6 pt-8 pb-20" style={{ maxWidth: "900px" }}>
      <Link href="/admin" className="inline-flex items-center gap-1 text-[13px] text-text-muted hover:text-brand mb-5">
        ← 관리자 대시보드
      </Link>

      {/* 사용자 정보 */}
      <div className="bg-white rounded-2xl border border-border-card px-5 py-5 flex items-center gap-4 mb-6">
        <Avatar src={user.avatarUrl} name={displayName} className="w-12 h-12 shrink-0" textClassName="text-[14px]" />
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-bold text-text-heading">
            {displayName}
            {user.nickname && <span className="ml-2 text-[13px] font-normal text-text-muted">({user.name})</span>}
          </p>
          <p className="text-[13px] text-text-muted mt-0.5">
            {user.email ?? "이메일 없음"} · 가입 {new Date(user.createdAt).toLocaleDateString("ko-KR")}
          </p>
          <div className="flex gap-3 mt-1 text-[12px] text-text-placeholder">
            <span>커뮤니티 글 {user._count.communityPosts}</span>
            <span>지도글 {user._count.posts}</span>
            <span>커뮤니티 댓글 {user._count.communityComments}</span>
            <span>지도 댓글 {user._count.comments}</span>
          </div>
        </div>
      </div>

      {/* 섹션 탭 */}
      <div className="flex gap-1 border-b border-border-base mb-5">
        {(Object.keys(SECTION_LABELS) as Section[]).map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`px-4 py-2 text-[13px] font-semibold border-none bg-transparent cursor-pointer transition-colors ${
              section === s
                ? "text-brand border-b-2 border-brand -mb-px"
                : "text-text-muted hover:text-text-body"
            }`}
          >
            {SECTION_LABELS[s]}
          </button>
        ))}
      </div>

      {section === "communityPosts" && <CommunityPostsSection userId={userId} />}
      {section === "mapPosts" && <MapPostsSection userId={userId} />}
      {section === "communityComments" && <CommunityCommentsSection userId={userId} />}
      {section === "mapComments" && <MapCommentsSection userId={userId} />}
    </main>
  );
}

function CommunityPostsSection({ userId }: { userId: number }) {
  const [items, setItems] = useState<CommunityPostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}?section=communityPosts&page=${p}`);
      if (res.ok) { const d = await res.json(); setItems(d.items); setTotal(d.total); }
    } finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { load(page); }, [page, load]);

  const del = async (id: number, title: string) => {
    if (!confirm(`"${title}" 게시글을 삭제할까요?`)) return;
    setDeleting(id);
    const res = await fetch(`/api/community/${id}`, { method: "DELETE" });
    if (res.ok) { setItems((p) => p.filter((x) => x.id !== id)); setTotal((t) => t - 1); }
    else alert("삭제 실패");
    setDeleting(null);
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (items.length === 0) return <p className="text-center py-12 text-[14px] text-text-muted">게시글이 없어요.</p>;

  return (
    <div>
      <p className="text-[12px] text-text-muted mb-3">전체 {total}개</p>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-border-card px-4 py-3 flex items-center gap-3">
            <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              item.category === "자유" ? "bg-brand-bg text-brand" : "bg-amber-50 text-amber-600"
            }`}>{item.category}</span>
            <div className="flex-1 min-w-0">
              <a href={`/community/${item.id}`} target="_blank" rel="noopener noreferrer"
                className="text-[14px] font-semibold text-text-heading hover:text-brand truncate block">
                {item.title}
              </a>
              <p className="text-[12px] text-text-muted">
                {new Date(item.createdAt).toLocaleDateString("ko-KR")} · 댓글 {item._count.comments}
              </p>
            </div>
            <DeleteBtn onClick={() => del(item.id, item.title)} pending={deleting === item.id} />
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={Math.ceil(total / 20)} onChange={setPage} />
    </div>
  );
}

function MapPostsSection({ userId }: { userId: number }) {
  const [items, setItems] = useState<MapPostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}?section=mapPosts&page=${p}`);
      if (res.ok) { const d = await res.json(); setItems(d.items); setTotal(d.total); }
    } finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { load(page); }, [page, load]);

  const del = async (id: number, title: string) => {
    if (!confirm(`"${title}" 지도글을 삭제할까요?`)) return;
    setDeleting(id);
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) { setItems((p) => p.filter((x) => x.id !== id)); setTotal((t) => t - 1); }
    else alert("삭제 실패");
    setDeleting(null);
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (items.length === 0) return <p className="text-center py-12 text-[14px] text-text-muted">지도글이 없어요.</p>;

  return (
    <div>
      <p className="text-[12px] text-text-muted mb-3">전체 {total}개</p>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const cats = item.categories.map((c) => c.category.name).join(", ");
          return (
            <div key={item.id} className="bg-white rounded-xl border border-border-card px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <a href={`/post/${item.id}`} target="_blank" rel="noopener noreferrer"
                  className="text-[14px] font-semibold text-text-heading hover:text-brand truncate block">
                  {item.title}
                </a>
                <p className="text-[12px] text-text-muted">
                  {item.location}{cats && ` · ${cats}`} · {new Date(item.createdAt).toLocaleDateString("ko-KR")} · 댓글 {item._count.comments}
                  {item.status === "HIDDEN" && <span className="ml-1 text-amber-500">(비공개)</span>}
                </p>
              </div>
              <DeleteBtn onClick={() => del(item.id, item.title)} pending={deleting === item.id} />
            </div>
          );
        })}
      </div>
      <Pagination page={page} totalPages={Math.ceil(total / 20)} onChange={setPage} />
    </div>
  );
}

function CommunityCommentsSection({ userId }: { userId: number }) {
  const [items, setItems] = useState<CommunityCommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}?section=communityComments&page=${p}`);
      if (res.ok) { const d = await res.json(); setItems(d.items); setTotal(d.total); }
    } finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { load(page); }, [page, load]);

  const del = async (item: CommunityCommentItem) => {
    if (!confirm("이 댓글을 삭제할까요?")) return;
    setDeleting(item.id);
    const res = await fetch(`/api/community/${item.post.id}/comments/${item.id}`, { method: "DELETE" });
    if (res.ok) { setItems((p) => p.filter((x) => x.id !== item.id)); setTotal((t) => t - 1); }
    else alert("삭제 실패");
    setDeleting(null);
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (items.length === 0) return <p className="text-center py-12 text-[14px] text-text-muted">댓글이 없어요.</p>;

  return (
    <div>
      <p className="text-[12px] text-text-muted mb-3">전체 {total}개</p>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-border-card px-4 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-text-body leading-relaxed line-clamp-2 mb-1">{item.content}</p>
              <a href={`/community/${item.post.id}`} target="_blank" rel="noopener noreferrer"
                className="text-[12px] text-brand hover:underline truncate block">
                게시글: {item.post.title}
              </a>
              <p className="text-[11px] text-text-placeholder mt-0.5">{new Date(item.createdAt).toLocaleDateString("ko-KR")}</p>
            </div>
            <DeleteBtn onClick={() => del(item)} pending={deleting === item.id} />
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={Math.ceil(total / 20)} onChange={setPage} />
    </div>
  );
}

function MapCommentsSection({ userId }: { userId: number }) {
  const [items, setItems] = useState<MapCommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}?section=mapComments&page=${p}`);
      if (res.ok) { const d = await res.json(); setItems(d.items); setTotal(d.total); }
    } finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { load(page); }, [page, load]);

  const del = async (item: MapCommentItem) => {
    if (!confirm("이 댓글을 삭제할까요?")) return;
    setDeleting(item.id);
    const res = await fetch(`/api/posts/${item.postId}/comments/${item.id}`, { method: "DELETE" });
    if (res.ok) { setItems((p) => p.filter((x) => x.id !== item.id)); setTotal((t) => t - 1); }
    else alert("삭제 실패");
    setDeleting(null);
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (items.length === 0) return <p className="text-center py-12 text-[14px] text-text-muted">댓글이 없어요.</p>;

  return (
    <div>
      <p className="text-[12px] text-text-muted mb-3">전체 {total}개</p>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-border-card px-4 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-text-body leading-relaxed line-clamp-2 mb-1">{item.content}</p>
              {item.post && (
                <a href={`/post/${item.postId}`} target="_blank" rel="noopener noreferrer"
                  className="text-[12px] text-brand hover:underline truncate block">
                  게시글: {item.post.title}
                </a>
              )}
              <p className="text-[11px] text-text-placeholder mt-0.5">{new Date(item.createdAt).toLocaleDateString("ko-KR")}</p>
            </div>
            <DeleteBtn onClick={() => del(item)} pending={deleting === item.id} />
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={Math.ceil(total / 20)} onChange={setPage} />
    </div>
  );
}
