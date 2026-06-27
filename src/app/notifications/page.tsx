"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Header from "@/components/organisms/Header";
import Avatar from "@/components/atom/Avatar";
import Spinner from "@/components/atom/Spinner";

interface NotificationItem {
  id: number;
  type: "COMMENT" | "REPLY";
  isRead: boolean;
  createdAt: string;
  postId: number | null;
  commentId: number | null;
  actor: { id: number; name: string; nickname: string | null; avatarUrl: string | null };
  post: { title: string } | null;
  comment: { content: string | null; isSecret: boolean } | null;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function notiMessage(n: NotificationItem) {
  const actor = n.actor.nickname ?? n.actor.name;
  if (n.type === "COMMENT") return `${actor}님이 내 게시글에 댓글을 남겼어요.`;
  if (n.type === "REPLY") return `${actor}님이 내 댓글에 답글을 남겼어요.`;
  return "";
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/"); return; }
    if (status !== "authenticated") return;

    // PATCH(전체 읽음)와 GET(목록)을 병렬로 실행 — 둘 다 완료된 뒤에야 화면이 interactive해짐
    // → 사용자가 다음 페이지로 이동할 때 Header가 DB를 재조회해도 unreadCount = 0 보장
    Promise.all([
      fetch("/api/notifications", { method: "PATCH" }),
      fetch("/api/notifications").then((r) => r.json()),
    ])
      .then(([, data]) => setNotifications(data.notifications ?? []))
      .finally(() => setLoading(false));
  }, [status, router]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      await fetch(`/api/notifications/${n.id}`, { method: "PATCH" });
      setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, isRead: true } : item));
    }
    if (n.postId) router.push(`/post/${n.postId}`);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
      <div className="mx-auto px-3 sm:px-6 pt-6 pb-20 flex flex-col gap-4" style={{ maxWidth: "600px" }}>
        <div className="flex items-center justify-between">
          <h1 className="text-[18px] font-bold text-text-heading">알림</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[12px] text-brand border-none bg-transparent cursor-pointer hover:underline"
            >
              전체 읽음
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border-card overflow-hidden">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted text-[14px] gap-2">
              <span className="text-3xl">🔔</span>
              <p>아직 알림이 없어요.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border-header">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClick(n)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-4 hover:bg-surface-card transition-colors cursor-pointer border-none ${n.isRead ? "bg-white" : "bg-brand-bg"}`}
                  >
                    {!n.isRead && (
                      <span className="mt-2 shrink-0 w-2 h-2 rounded-full bg-brand" />
                    )}
                    <Avatar
                      src={n.actor.avatarUrl}
                      name={n.actor.nickname ?? n.actor.name}
                      className={`w-9 h-9 shrink-0 ${n.isRead ? "" : ""}`}
                      textClassName="text-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-text-body leading-snug">{notiMessage(n)}</p>
                      {n.comment && (
                        <p className="text-[12px] text-text-muted mt-1 truncate">
                          {n.comment.isSecret
                            ? "🔒 비밀 댓글입니다."
                            : `"${n.comment.content?.slice(0, 60) ?? ""}${(n.comment.content?.length ?? 0) > 60 ? "…" : ""}"`}
                        </p>
                      )}
                      {n.post && (
                        <p className="text-[11px] text-text-placeholder mt-0.5 truncate">
                          {n.post.title}
                        </p>
                      )}
                      <p className="text-[11px] text-text-placeholder mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          href="/"
          className="self-start text-[13px] text-text-muted hover:text-text-body"
        >
          ← 돌아가기
        </Link>
      </div>
    </div>
  );
}
