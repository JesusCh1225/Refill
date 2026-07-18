"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/atom/Avatar";

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

interface Props {
  onSelect?: () => void;
}

export default function ConversationList({ onSelect }: Props) {
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setConversations(data.conversations); })
      .catch(() => {});
  }, []);

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <p className="text-[14px] text-text-muted">아직 대화가 없어요.</p>
        <p className="text-[12px] text-text-muted mt-1">게시글이나 프로필에서 채팅을 시작해 보세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {conversations.map((conv, i) => {
        const name = conv.partner.nickname ?? conv.partner.name;
        const isActive = pathname === `/messages/${conv.partner.id}`;
        return (
          <Link
            key={conv.partner.id}
            href={`/messages/${conv.partner.id}`}
            onClick={onSelect}
            className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
              isActive ? "bg-brand-bg" : "hover:bg-surface-card"
            } ${i > 0 ? "border-t border-border-base" : ""}`}
          >
            <div className="relative shrink-0">
              <Avatar src={conv.partner.avatarUrl} name={name} className="w-10 h-10" textClassName="text-[14px]" />
              {conv.unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[13px] truncate ${conv.unreadCount > 0 ? "font-bold text-text-heading" : "font-semibold text-text-body"}`}>
                  {name}
                </span>
                <span className="text-[11px] text-text-placeholder shrink-0">{formatTime(conv.lastMessage.createdAt)}</span>
              </div>
              <p className={`text-[12px] truncate mt-0.5 ${conv.unreadCount > 0 ? "text-text-body font-medium" : "text-text-muted"}`}>
                {conv.lastMessage.isFromMe ? "나: " : ""}{conv.lastMessage.content}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
