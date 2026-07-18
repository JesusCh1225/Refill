import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Header from "@/components/organisms/Header";
import ConversationList from "@/components/messages/ConversationList";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <div className="flex flex-col sm:h-screen sm:overflow-hidden bg-surface-page">
      <div className="shrink-0">
        <Header />
      </div>

      {/* 커뮤니티와 동일한 좌우 여백 — 2패널 전체를 가운데 정렬 */}
      <div className="flex flex-1 sm:overflow-hidden px-4 sm:px-6 py-4 sm:py-6 min-h-0" style={{ maxWidth: "var(--max-w-hero)", marginInline: "auto", width: "100%" }}>
        <div className="flex flex-1 sm:overflow-hidden min-h-0 w-full rounded-2xl border border-border-base overflow-hidden bg-white shadow-sm">
          {/* 좌측 대화 목록 — 데스크톱에서만 표시 */}
          <aside className="hidden sm:flex sm:flex-col sm:w-70 lg:w-75 shrink-0 border-r border-border-base bg-white overflow-y-auto">
            <div className="px-5 py-4 border-b border-border-base shrink-0">
              <h1 className="text-[17px] font-bold text-text-heading">채팅</h1>
            </div>
            <ConversationList />
          </aside>

          {/* 우측 콘텐츠 */}
          <main className="flex-1 flex flex-col sm:overflow-hidden min-w-0 bg-surface-page">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
