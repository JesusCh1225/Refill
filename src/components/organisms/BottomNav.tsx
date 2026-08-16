"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={active ? "currentColor" : "none"} />
      <polyline points="9 22 9 12 15 12 15 22" stroke={active ? "white" : "currentColor"} />
    </svg>
  );
}

function MapIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill={active ? "currentColor" : "none"} />
      <circle cx="12" cy="10" r="3" fill={active ? "white" : "none"} stroke={active ? "none" : "currentColor"} />
    </svg>
  );
}

function CommunityIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" fill={active ? "currentColor" : "none"} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function MyIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [unreadMessages, setUnreadMessages] = useState(0);

  // 1:1 채팅방은 풀스크린 UI이므로 탭바 숨김
  const isMessageThread = /^\/messages\/\d+/.test(pathname);

  useEffect(() => {
    if (!session || isMessageThread) { setUnreadMessages(0); return; }
    const poll = () => {
      fetch("/api/messages/unread")
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) setUnreadMessages(data.count); })
        .catch(() => {});
    };
    poll();
    const timer = setInterval(poll, 5_000);
    return () => clearInterval(timer);
  }, [session, isMessageThread]);

  if (isMessageThread) return null;

  const active = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const tabs = [
    { href: "/", label: "홈", exact: true, Icon: HomeIcon },
    { href: "/musicmap", label: "음악맵", Icon: MapIcon },
    { href: "/community", label: "커뮤니티", Icon: CommunityIcon },
    { href: "/messages", label: "채팅", Icon: ChatIcon, badge: session ? unreadMessages : 0 },
    { href: "/profile", label: "MY", exact: true, Icon: MyIcon },
  ];

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border-base flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {tabs.map(({ href, label, exact, Icon, badge }) => {
        const isActive = active(href, exact);
        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${isActive ? "text-brand" : "text-text-muted"}`}
          >
            <div className="relative">
              <Icon active={isActive} />
              {(badge ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {badge! > 99 ? "99+" : badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
