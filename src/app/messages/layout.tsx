import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Header from "@/components/organisms/Header";
import ConversationList from "@/components/messages/ConversationList";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-surface-page">
      <div className="shrink-0">
        <Header />
      </div>

      <div className="flex flex-1 overflow-hidden sm:px-6 sm:py-6 min-h-0" style={{ maxWidth: "var(--max-w-hero)", marginInline: "auto", width: "100%" }}>
        <div className="flex flex-1 overflow-hidden min-h-0 w-full sm:rounded-2xl sm:border sm:border-border-base bg-white sm:shadow-sm">
          {/* 좌측 대화 목록 — 데스크톱에서만 표시 */}
          <aside className="hidden sm:flex sm:flex-col sm:w-70 lg:w-75 shrink-0 border-r border-border-base bg-white overflow-y-auto">
            <div className="px-5 py-4 border-b border-border-base shrink-0">
              <h1 className="text-[17px] font-bold text-text-heading">채팅</h1>
            </div>
            <ConversationList />
          </aside>

          {/* 우측 콘텐츠 */}
          <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-surface-page">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
