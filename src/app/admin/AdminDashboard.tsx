"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/atom/Avatar";
import Spinner from "@/components/atom/Spinner";

type Tab = "posts" | "users" | "chats";
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
        {(["posts", "users", "chats"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-[14px] font-semibold border-none bg-transparent cursor-pointer transition-colors ${
              tab === t ? "text-brand border-b-2 border-brand -mb-px" : "text-text-muted hover:text-text-body"
            }`}
          >
            {t === "posts" ? "게시글" : t === "users" ? "회원" : "채팅 로그"}
          </button>
        ))}
      </div>

      {tab === "posts" && <PostsTab />}
      {tab === "users" && <UsersTab />}
      {tab === "chats" && <ChatLogsTab />}
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

type CategoryFilter = "" | "자유" | "문의";
const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "", label: "전체" },
  { value: "자유", label: "자유" },
  { value: "문의", label: "문의" },
];

function CommunityPostsList() {
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

  const handleCategory = (cat: CategoryFilter) => {
    setCategory(cat);
    setPage(1);
  };

  const del = async (id: number, title: string) => {
    if (!confirm(`"${title}" 게시글을 삭제할까요?`)) return;
    setDeleting(id);
    const res = await fetch(`/api/community/${id}`, { method: "DELETE" });
    if (res.ok) { setPosts((p) => p.filter((x) => x.id !== id)); setTotal((t) => t - 1); }
    else alert("삭제 실패");
    setDeleting(null);
  };

  return (
    <div>
      {/* 카테고리 필터 */}
      <div className="flex gap-1 mb-4 bg-surface-card rounded-xl p-1 w-fit">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleCategory(f.value)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold border-none cursor-pointer transition-colors ${
              category === f.value
                ? "bg-white text-text-heading shadow-sm"
                : "bg-transparent text-text-muted hover:text-text-body"
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
      </>
      )}
      <Pagination page={page} totalPages={Math.ceil(total / 20)} onChange={(p) => { setPage(p); load(p, category); }} />
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

// ── 채팅 로그 탭 ─────────────────────────────────────────────────────────

interface ConvUser {
  id: number;
  name: string;
  nickname: string | null;
  email: string | null;
  avatarUrl: string | null;
}

interface ConvItem {
  user1: ConvUser;
  user2: ConvUser;
  lastMessage: string;
  latestAt: string;
  count: number;
}

interface ChatMessage {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  isRead: boolean;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDateOnly(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function displayName(u: ConvUser) {
  return u.nickname ?? u.name;
}

function ChatLogModal({
  user1Id, user2Id, user1, user2,
  onClose,
}: {
  user1Id: number; user2Id: number;
  user1: ConvUser; user2: ConvUser;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/admin/messages/${user1Id}/${user2Id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setMessages(data.messages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user1Id, user2Id]);

  useEffect(() => {
    if (!loading && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [loading]);

  let lastDate = "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-2xl" style={{ height: "80vh" }}>
        {/* 모달 헤더 */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border-base">
          <div className="flex flex-col gap-0.5">
            <p className="text-[15px] font-bold text-text-heading">
              {displayName(user1)} ↔ {displayName(user2)}
            </p>
            <p className="text-[12px] text-text-muted">
              {user1.email && `${user1.email}`}
              {user1.email && user2.email && " · "}
              {user2.email && `${user2.email}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-card border-none bg-transparent cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 메시지 목록 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1 bg-surface-page">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Spinner /></div>
          ) : messages.length === 0 ? (
            <p className="text-center text-[13px] text-text-muted py-10">메시지가 없어요.</p>
          ) : messages.map((msg) => {
            const dateStr = new Date(msg.createdAt).toDateString();
            const showDate = dateStr !== lastDate;
            lastDate = dateStr;
            const isUser1 = msg.senderId === user1Id;
            const senderName = isUser1 ? displayName(user1) : displayName(user2);
            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-border-base" />
                    <span className="text-[11px] text-text-placeholder shrink-0">{formatDateOnly(msg.createdAt)}</span>
                    <div className="flex-1 h-px bg-border-base" />
                  </div>
                )}
                <div className={`flex items-end gap-2 ${isUser1 ? "flex-row" : "flex-row-reverse"}`}>
                  <div className={`flex flex-col gap-0.5 max-w-[65%] ${isUser1 ? "items-start" : "items-end"}`}>
                    <span className="text-[11px] text-text-muted px-1">{senderName}</span>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                      isUser1
                        ? "bg-white border border-border-base text-text-body rounded-tl-sm"
                        : "bg-brand-bg text-text-body border border-brand/20 rounded-tr-sm"
                    }`} style={{ wordBreak: "break-word" }}>
                      {msg.content}
                    </div>
                  </div>
                  <span className="text-[10px] text-text-placeholder shrink-0 mb-0.5">
                    {new Date(msg.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 요약 */}
        {!loading && messages.length > 0 && (
          <div className="shrink-0 px-5 py-3 border-t border-border-base bg-surface-card rounded-b-2xl">
            <p className="text-[12px] text-text-muted">
              총 {messages.length}개 메시지
              <span className="mx-1">·</span>
              {formatDateTime(messages[0].createdAt)} — {formatDateTime(messages[messages.length - 1].createdAt)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatLogsTab() {
  const [conversations, setConversations] = useState<ConvItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [inputQ, setInputQ] = useState("");
  const [selected, setSelected] = useState<{ item: ConvItem } | null>(null);

  const load = useCallback(async (p: number, query: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (query) params.set("q", query);
      const res = await fetch(`/api/admin/messages?${params}`);
      if (res.ok) {
        const d = await res.json();
        setConversations(d.conversations);
        setTotal(d.total);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page, q); }, [page, q, load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQ(inputQ.trim());
  };

  return (
    <div>
      {/* 검색 */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <input
          type="text"
          value={inputQ}
          onChange={(e) => setInputQ(e.target.value)}
          placeholder="사용자 이름 · 닉네임 · 이메일로 검색"
          className="flex-1 px-4 h-10 rounded-xl border border-border-base text-[14px] text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-brand transition-colors"
        />
        <button
          type="submit"
          className="px-5 h-10 rounded-xl bg-brand text-white text-[13px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity"
        >
          검색
        </button>
        {q && (
          <button
            type="button"
            onClick={() => { setInputQ(""); setQ(""); setPage(1); }}
            className="px-4 h-10 rounded-xl border border-border-base text-[13px] text-text-muted bg-white cursor-pointer hover:bg-surface-card transition-colors"
          >
            초기화
          </button>
        )}
      </form>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          <p className="text-[13px] text-text-muted mb-3">
            {q ? `"${q}" 검색 결과 ` : "전체 "}
            {total}건의 대화
          </p>

          {conversations.length === 0 ? (
            <p className="text-center text-text-muted py-16 text-[14px]">대화 내역이 없어요.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {conversations.map((conv) => (
                <button
                  key={`${conv.user1.id}-${conv.user2.id}`}
                  onClick={() => setSelected({ item: conv })}
                  className="bg-white rounded-xl border border-border-card px-4 py-3.5 flex items-center gap-3 hover:border-brand/40 hover:shadow-sm transition-all text-left cursor-pointer w-full"
                >
                  {/* 참여자 */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Avatar src={conv.user1.avatarUrl} name={displayName(conv.user1)} className="w-8 h-8" textClassName="text-[11px]" />
                    <span className="text-[12px] text-text-placeholder">↔</span>
                    <Avatar src={conv.user2.avatarUrl} name={displayName(conv.user2)} className="w-8 h-8" textClassName="text-[11px]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-text-heading truncate">
                      {displayName(conv.user1)}
                      <span className="text-text-muted font-normal mx-1">↔</span>
                      {displayName(conv.user2)}
                    </p>
                    <p className="text-[12px] text-text-muted mt-0.5 truncate">{conv.lastMessage}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[12px] text-text-muted">{formatDateTime(conv.latestAt)}</p>
                    <p className="text-[11px] text-text-placeholder mt-0.5">메시지 {conv.count}개</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <Pagination
            page={page}
            totalPages={Math.ceil(total / 20)}
            onChange={(p) => setPage(p)}
          />
        </>
      )}

      {selected && (
        <ChatLogModal
          user1Id={selected.item.user1.id}
          user2Id={selected.item.user2.id}
          user1={selected.item.user1}
          user2={selected.item.user2}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ── 회원 탭 ────────────────────────────────────────────────────────────────

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
