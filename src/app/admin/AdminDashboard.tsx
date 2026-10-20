"use client";

import { useState } from "react";
import PostsTab from "@/app/admin/tabs/PostsTab";
import UsersTab from "@/app/admin/tabs/UsersTab";
import ChatLogsTab from "@/app/admin/tabs/ChatLogsTab";
import DangerZone from "@/app/admin/tabs/DangerZone";

type Tab = "posts" | "users" | "chats" | "danger";

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("posts");

  return (
    <main className="mx-auto px-4 sm:px-6 pt-8 pb-20" style={{ maxWidth: "900px" }}>
      <h1 className="text-[22px] font-bold text-text-heading mb-6">관리자 대시보드</h1>

      <div className="flex gap-1 mb-6 border-b border-border-base">
        {(["posts", "users", "chats", "danger"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-[14px] font-semibold border-none bg-transparent cursor-pointer transition-colors ${
              tab === t
                ? t === "danger" ? "text-red-500 border-b-2 border-red-400 -mb-px" : "text-brand border-b-2 border-brand -mb-px"
                : "text-text-muted hover:text-text-body"
            }`}
          >
            {t === "posts" ? "게시글" : t === "users" ? "회원" : t === "chats" ? "채팅 로그" : "위험 작업"}
          </button>
        ))}
      </div>

      {tab === "posts" && <PostsTab />}
      {tab === "users" && <UsersTab />}
      {tab === "chats" && <ChatLogsTab />}
      {tab === "danger" && <DangerZone />}
    </main>
  );
}
