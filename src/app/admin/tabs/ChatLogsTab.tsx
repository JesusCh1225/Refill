"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Avatar from "@/components/atom/Avatar";
import Spinner from "@/components/atom/Spinner";
import Pagination from "@/app/admin/Pagination";

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

function getDisplayName(u: ConvUser) {
  return u.nickname ?? u.name;
}

function ChatLogModal({ user1Id, user2Id, user1, user2, onClose }: {
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
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border-base">
          <div className="flex flex-col gap-0.5">
            <p className="text-[15px] font-bold text-text-heading">
              {getDisplayName(user1)} ↔ {getDisplayName(user2)}
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
            const senderName = isUser1 ? getDisplayName(user1) : getDisplayName(user2);
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

export default function ChatLogsTab() {
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

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(inputQ.trim()); }} className="flex gap-2 mb-5">
        <input
          type="text"
          value={inputQ}
          onChange={(e) => setInputQ(e.target.value)}
          placeholder="사용자 이름 · 닉네임 · 이메일로 검색"
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
            {q ? `"${q}" 검색 결과 ` : "전체 "}{total}건의 대화
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
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Avatar src={conv.user1.avatarUrl} name={getDisplayName(conv.user1)} className="w-8 h-8" textClassName="text-[11px]" />
                    <span className="text-[12px] text-text-placeholder">↔</span>
                    <Avatar src={conv.user2.avatarUrl} name={getDisplayName(conv.user2)} className="w-8 h-8" textClassName="text-[11px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-text-heading truncate">
                      {getDisplayName(conv.user1)}
                      <span className="text-text-muted font-normal mx-1">↔</span>
                      {getDisplayName(conv.user2)}
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
          <Pagination page={page} totalPages={Math.ceil(total / 20)} onChange={(p) => setPage(p)} />
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
