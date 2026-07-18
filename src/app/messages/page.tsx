"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Header from "@/components/organisms/Header";
import Avatar from "@/components/atom/Avatar";
import Spinner from "@/components/atom/Spinner";

interface Partner {
  id: number;
  name: string;
  nickname: string | null;
  avatarUrl: string | null;
}

interface Conversation {
  partner: Partner;
  lastMessage: { content: string; createdAt: string; isFromMe: boolean };
  unreadCount: number;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "방금";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  const router = useRouter();
  const { status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/"); return; }
    if (status !== "authenticated") return;
    fetch("/api/messages")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setConversations(data.conversations); })
      .finally(() => setLoading(false));
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-surface-page">
        <Header />
        <div className="flex items-center justify-center py-40"><Spinner /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-page">
      <Header />
      <div className="mx-auto px-3 sm:px-6 pt-6 pb-20" style={{ maxWidth: "600px" }}>
        <h1 className="text-[20px] font-bold text-text-heading mb-5">채팅</h1>
        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border-card px-6 py-16 text-center">
            <p className="text-[14px] text-text-muted">아직 대화가 없어요.</p>
            <p className="text-[12px] text-text-muted mt-1">게시글이나 프로필에서 채팅을 시작해 보세요.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border-card overflow-hidden">
            {conversations.map((conv, i) => {
              const name = conv.partner.nickname ?? conv.partner.name;
              return (
                <Link
                  key={conv.partner.id}
                  href={`/messages/${conv.partner.id}`}
                  className={`flex items-center gap-3 px-4 py-4 hover:bg-surface-card transition-colors ${i > 0 ? "border-t border-border-base" : ""}`}
                >
                  <div className="relative shrink-0">
                    <Avatar src={conv.partner.avatarUrl} name={name} className="w-11 h-11" textClassName="text-[15px]" />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold text-text-heading truncate">{name}</span>
                      <span className="text-[11px] text-text-placeholder shrink-0">{formatTime(conv.lastMessage.createdAt)}</span>
                    </div>
                    <p className={`text-[13px] truncate mt-0.5 ${conv.unreadCount > 0 ? "text-text-body font-medium" : "text-text-muted"}`}>
                      {conv.lastMessage.isFromMe ? "나: " : ""}{conv.lastMessage.content}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
