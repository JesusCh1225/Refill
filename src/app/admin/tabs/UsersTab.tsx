"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/atom/Avatar";
import Spinner from "@/components/atom/Spinner";
import { useToast } from "@/context/toast";
import Pagination from "@/app/admin/Pagination";

interface UserItem {
  id: number;
  name: string;
  email: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  createdAt: string;
  _count: { communityPosts: number; posts: number };
}

export default function UsersTab() {
  const { showToast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [inputQ, setInputQ] = useState("");

  const load = useCallback(async (p: number, query: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (query) params.set("q", query);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) { const d = await res.json(); setUsers(d.users); setTotal(d.total); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page, q); }, [page, q, load]);

  const del = async (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    if (!confirm(`"${name}" 계정을 삭제할까요?\n해당 사용자의 모든 게시글과 댓글도 함께 삭제됩니다.`)) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) { setUsers((p) => p.filter((u) => u.id !== id)); setTotal((t) => t - 1); }
    else showToast("삭제에 실패했어요.", "error");
    setDeleting(null);
  };

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(inputQ.trim()); }} className="flex gap-2 mb-5">
        <input
          type="text"
          value={inputQ}
          onChange={(e) => setInputQ(e.target.value)}
          placeholder="이름 · 닉네임 · 이메일로 검색"
          className="flex-1 px-4 h-10 rounded-xl border border-border-base text-[14px] text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-brand transition-colors"
        />
        <button type="submit" className="px-5 h-10 rounded-xl bg-brand text-white text-[13px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity">
          검색
        </button>
        {q && (
          <button type="button" onClick={() => { setInputQ(""); setQ(""); setPage(1); }}
            className="px-4 h-10 rounded-xl border border-border-base text-[13px] text-text-muted bg-white cursor-pointer hover:bg-surface-card transition-colors">
            초기화
          </button>
        )}
      </form>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          <p className="text-[13px] text-text-muted mb-3">
            {q ? `"${q}" 검색 결과 ` : "전체 "}{total}명
          </p>
          {users.length === 0 ? (
            <p className="text-center text-text-muted py-16 text-[14px]">회원이 없어요.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {users.map((user) => {
                const name = user.nickname ?? user.name;
                return (
                  <div
                    key={user.id}
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                    className="bg-white rounded-xl border border-border-card px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-brand/40 hover:shadow-sm transition-all"
                  >
                    <Avatar src={user.avatarUrl} name={name} className="w-9 h-9 shrink-0" textClassName="text-[11px]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-text-heading">
                        {name}
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
                      onClick={(e) => del(e, user.id, name)}
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
          <Pagination page={page} totalPages={Math.ceil(total / 20)} onChange={(p) => setPage(p)} />
        </>
      )}
    </div>
  );
}
