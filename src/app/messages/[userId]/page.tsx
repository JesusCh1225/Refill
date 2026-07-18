"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/organisms/Header";
import Avatar from "@/components/atom/Avatar";
import Spinner from "@/components/atom/Spinner";

interface Message {
  id: number;
  content: string;
  createdAt: string;
  isFromMe: boolean;
}

interface Partner {
  id: number;
  name: string;
  nickname: string | null;
  avatarUrl: string | null;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export default function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const { status } = useSession();

  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (smooth = false) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: smooth ? "smooth" : "instant" });
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/"); return; }
    if (status !== "authenticated") return;

    fetch(`/api/messages/${userId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) { router.replace("/messages"); return; }
        setMessages(data.messages);
        setPartner(data.partner);
        if (data.messages.length > 0) lastIdRef.current = data.messages[data.messages.length - 1].id;
      })
      .finally(() => setLoading(false));

    fetch(`/api/messages/${userId}/read`, { method: "PATCH" }).catch(() => {});
  }, [status, userId, router]);

  // 메시지 로드 후 스크롤 맨 아래로
  useEffect(() => {
    if (!loading) scrollToBottom();
  }, [loading]);

  // 3초마다 새 메시지 폴링
  useEffect(() => {
    if (status !== "authenticated") return;
    const timer = setInterval(async () => {
      const since = lastIdRef.current;
      const res = await fetch(`/api/messages/${userId}?since=${since}`).catch(() => null);
      if (!res?.ok) return;
      const data = await res.json();
      if (data.messages.length === 0) return;
      setMessages((prev) => [...prev, ...data.messages]);
      lastIdRef.current = data.messages[data.messages.length - 1].id;
      fetch(`/api/messages/${userId}/read`, { method: "PATCH" }).catch(() => {});
      scrollToBottom(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [status, userId]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (res.ok) {
        const msg: Message = await res.json();
        setMessages((prev) => [...prev, msg]);
        lastIdRef.current = msg.id;
        setText("");
        setTimeout(() => scrollToBottom(true), 50);
        inputRef.current?.focus();
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-surface-page">
        <Header />
        <div className="flex items-center justify-center flex-1"><Spinner /></div>
      </div>
    );
  }

  const partnerName = partner ? (partner.nickname ?? partner.name) : "알 수 없는 사용자";

  // 날짜 구분선 렌더
  let lastDate = "";

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface-page">
      <Header />

      {/* 채팅 헤더 */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-border-base" style={{ minHeight: "56px" }}>
        <button
          onClick={() => router.push("/messages")}
          className="text-text-muted hover:text-text-body border-none bg-transparent cursor-pointer shrink-0 flex items-center"
        >
          ←
        </button>
        {partner && (
          <Link href={`/profile/${partner.id}`} className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
            <Avatar src={partner.avatarUrl} name={partnerName} className="w-9 h-9" textClassName="text-[13px]" />
            <span className="text-[15px] font-bold text-text-heading">{partnerName}</span>
          </Link>
        )}
      </div>

      {/* 메시지 영역 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
        {messages.length === 0 && (
          <p className="text-center text-[13px] text-text-muted py-8">첫 메시지를 보내보세요.</p>
        )}

        {messages.map((msg) => {
          const dateStr = new Date(msg.createdAt).toDateString();
          const showDate = dateStr !== lastDate;
          lastDate = dateStr;

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-border-base" />
                  <span className="text-[11px] text-text-placeholder shrink-0">{formatDate(msg.createdAt)}</span>
                  <div className="flex-1 h-px bg-border-base" />
                </div>
              )}
              <div className={`flex items-end gap-1.5 ${msg.isFromMe ? "flex-row-reverse" : "flex-row"}`}>
                <div
                  className={`max-w-[72%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
                    msg.isFromMe
                      ? "bg-brand text-white rounded-br-sm"
                      : "bg-white border border-border-base text-text-body rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-text-placeholder shrink-0 mb-0.5">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 입력 영역 */}
      <div className="shrink-0 px-4 py-3 bg-white border-t border-border-base flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 1000))}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요 (Enter 전송)"
          rows={1}
          className="flex-1 px-3 py-2.5 rounded-xl border border-border-base text-[14px] text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-brand transition-colors resize-none leading-relaxed"
          style={{ maxHeight: "120px", overflowY: "auto" }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 120) + "px";
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center border-none cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-40 shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
