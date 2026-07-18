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

      <div className="flex flex-1 sm:overflow-hidden">
        {/* 좌측 대화 목록 — 데스크톱에서만 표시 */}
        <aside className="hidden sm:flex sm:flex-col sm:w-[300px] lg:w-[340px] shrink-0 border-r border-border-base bg-white overflow-y-auto">
          <div className="px-5 py-4 border-b border-border-base shrink-0">
            <h1 className="text-[17px] font-bold text-text-heading">채팅</h1>
          </div>
          <ConversationList />
        </aside>

        {/* 우측 콘텐츠 */}
        <main className="flex-1 flex flex-col sm:overflow-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
