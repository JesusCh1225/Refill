"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Avatar from "@/components/atom/Avatar";
import Spinner from "@/components/atom/Spinner";
import BlockButton from "@/components/atom/BlockButton";

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
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

/** 두 메시지가 같은 발신자 + 같은 분(minute) 안에 있는지 */
function sameMinuteGroup(a: Message, b: Message): boolean {
  if (a.isFromMe !== b.isFromMe) return false;
  const da = new Date(a.createdAt);
  const db = new Date(b.createdAt);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate() &&
    da.getHours() === db.getHours() &&
    da.getMinutes() === db.getMinutes()
  );
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);

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

    setLoading(true);
    setMessages([]);

    fetch(`/api/messages/${userId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        setMessages(data.messages);
        setPartner(data.partner);
        if (data.messages.length > 0) lastIdRef.current = data.messages[data.messages.length - 1].id;
      })
      .finally(() => setLoading(false));

    fetch(`/api/messages/${userId}/read`, { method: "PATCH" }).catch(() => {});
  }, [status, userId, router]);

  useEffect(() => {
    if (!loading) scrollToBottom();
  }, [loading]);

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
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await fetch(`/api/messages/${userId}/leave`, { method: "PATCH" });
      router.push("/messages");
    } finally {
      setLeaving(false);
      setLeaveConfirm(false);
    }
  };

  const partnerName = partner ? (partner.nickname ?? partner.name) : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Spinner />
      </div>
    );
  }

  let lastDate = "";

  return (
    /* 모바일: h-[calc(100svh-60px)]로 전체 화면 채움 / 데스크톱: h-full로 우측 패널 채움 */
    <div className="flex flex-col h-[calc(100svh-60px)] sm:h-full">

      {/* 채팅 헤더 */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-border-base">
        {/* 모바일에서만 뒤로가기 */}
        <button
          onClick={() => router.push("/messages")}
          className="sm:hidden text-text-muted hover:text-text-body border-none bg-transparent cursor-pointer shrink-0 text-[18px] leading-none"
        >
          ←
        </button>
        {partner ? (
          <Link href={`/profile/${partner.id}`} className="flex items-center gap-2.5 hover:opacity-75 transition-opacity flex-1 min-w-0">
            <Avatar src={partner.avatarUrl} name={partnerName} className="w-8 h-8" textClassName="text-[12px]" />
            <span className="text-[15px] font-bold text-text-heading truncate">{partnerName}</span>
          </Link>
        ) : (
          <span className="text-[15px] font-bold text-text-heading flex-1">알 수 없는 사용자</span>
        )}

        {/* 더보기 메뉴 */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-card border-none bg-transparent cursor-pointer transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-40 bg-white rounded-xl border border-border-base shadow-lg overflow-hidden min-w-35">
                <button
                  onClick={() => { setMenuOpen(false); setLeaveConfirm(true); }}
                  className="w-full text-left px-4 py-2.5 text-[13px] text-text-body hover:bg-surface-card transition-colors"
                >
                  채팅방 나가기
                </button>
                {partner && (
                  <BlockButton
                    userId={partner.id}
                    variant="menu"
                    onBlockChange={() => setMenuOpen(false)}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 채팅방 나가기 확인 모달 */}
      {leaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !leaving && setLeaveConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl px-6 py-5 max-w-sm w-full flex flex-col gap-4">
            <p className="text-[14px] font-semibold text-text-heading">채팅방 나가기</p>
            <p className="text-[13px] text-text-muted leading-relaxed">
              채팅방을 나가면 대화 목록에서 사라져요. 상대방이 다시 메시지를 보내면 다시 표시돼요.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setLeaveConfirm(false)}
                disabled={leaving}
                className="px-4 h-9 rounded-xl border border-border-base text-[13px] text-text-muted bg-transparent cursor-pointer hover:bg-surface-card disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="px-4 h-9 rounded-xl bg-red-500 text-white text-[13px] font-semibold border-none cursor-pointer hover:bg-red-600 disabled:opacity-50"
              >
                {leaving ? "처리 중…" : "나가기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메시지 목록 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col bg-surface-page">
        {messages.length === 0 && (
          <p className="text-center text-[13px] text-text-muted py-10">첫 메시지를 보내보세요.</p>
        )}
        {messages.map((msg, idx) => {
          const prev = messages[idx - 1];
          const next = messages[idx + 1];
          const isLastInGroup = !next || !sameMinuteGroup(msg, next);
          const isFirstInGroup = !prev || !sameMinuteGroup(prev, msg);

          const dateStr = new Date(msg.createdAt).toDateString();
          const showDate = dateStr !== lastDate;
          if (showDate) lastDate = dateStr;

          const topMargin = showDate ? "mt-0" : isFirstInGroup ? "mt-3" : "mt-0.5";

          return (
            <div key={msg.id} className={topMargin}>
              {showDate && (
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-border-base" />
                  <span className="text-[11px] text-text-placeholder shrink-0">{formatDate(msg.createdAt)}</span>
                  <div className="flex-1 h-px bg-border-base" />
                </div>
              )}

              {msg.isFromMe ? (
                /* 내 메시지 — 오른쪽 정렬 */
                <div className="flex flex-row-reverse items-end gap-1.5">
                  <div
                    className={`max-w-[70%] px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap bg-brand text-white ${
                      isLastInGroup ? "rounded-2xl rounded-br-sm" : "rounded-2xl"
                    }`}
                    style={{ wordBreak: "break-word" }}
                  >
                    {msg.content}
                  </div>
                  {isLastInGroup && (
                    <span className="text-[10px] text-text-placeholder shrink-0 mb-1">{formatTime(msg.createdAt)}</span>
                  )}
                </div>
              ) : (
                /* 상대방 메시지 — 왼쪽 정렬 + 아바타 */
                <div className="flex flex-row items-end gap-1.5">
                  <div className="w-8 h-8 shrink-0 flex items-end">
                    {isLastInGroup ? (
                      <Avatar src={partner?.avatarUrl ?? null} name={partnerName} className="w-8 h-8" textClassName="text-[10px]" />
                    ) : null}
                  </div>
                  <div
                    className={`max-w-[70%] px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap bg-white border border-border-base text-text-body ${
                      isLastInGroup ? "rounded-2xl rounded-bl-sm" : "rounded-2xl"
                    }`}
                    style={{ wordBreak: "break-word" }}
                  >
                    {msg.content}
                  </div>
                  {isLastInGroup && (
                    <span className="text-[10px] text-text-placeholder shrink-0 mb-1">{formatTime(msg.createdAt)}</span>
                  )}
                </div>
              )}
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
          placeholder="메시지 입력 (Enter 전송 / Shift+Enter 줄바꿈)"
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
