"use client";

import ConversationList from "@/components/messages/ConversationList";

export default function MessagesPage() {
  return (
    <>
      {/* 모바일: 대화 목록 전체 표시 */}
      <div className="sm:hidden bg-white min-h-full">
        <div className="px-4 py-4 border-b border-border-base">
          <h1 className="text-[18px] font-bold text-text-heading">채팅</h1>
        </div>
        <ConversationList />
      </div>

      {/* 데스크톱: 우측 빈 상태 */}
      <div className="hidden sm:flex flex-col items-center justify-center h-full text-center gap-2">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-text-placeholder">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <p className="text-[15px] font-semibold text-text-muted">대화를 선택하세요</p>
        <p className="text-[13px] text-text-placeholder">왼쪽에서 대화 상대를 선택하면 채팅을 시작할 수 있어요.</p>
      </div>
    </>
  );
}
