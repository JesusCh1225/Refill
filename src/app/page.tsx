"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/organisms/Header";
import TitleSection from "@/components/organisms/TitleSection";
import SearchResultPage from "@/components/organisms/SearchResultPage";
import WritePostModal from "@/components/organisms/WritePostModal";
import { useCreatePost } from "@/hooks/useCreatePost";
import type { PostDraft } from "@/data/sampleMockResults";

function HomePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { requireLogin, createPost } = useCreatePost();
  const queryParam = searchParams.get("q");
  const [writeOpen, setWriteOpen] = useState(false);

  const handleSearch = (q: string) => {
    router.push(`/?q=${encodeURIComponent(q.trim())}`);
  };

  const handleLogoClick = () => router.push("/");

  const handleWriteClick = () => {
    if (requireLogin()) setWriteOpen(true);
  };

  // 첫 화면에서 작성한 글은 지도맵에서 바로 확인할 수 있도록 이동
  const handlePostSubmit = async (draft: PostDraft) => {
    const newPost = await createPost(draft);
    if (newPost) router.push("/musicmap");
  };

  if (queryParam !== null) {
    return (
      <SearchResultPage
        key={queryParam}
        initialQuery={queryParam}
        onBack={handleSearch}
        onLogoClick={handleLogoClick}
      />
    );
  }

  return (
    <div className="min-h-screen bg-surface-page text-text-body">
      <Header onLogoClick={handleLogoClick} />
      <TitleSection onSearch={handleSearch} />

      <button
        onClick={handleWriteClick}
        className="fixed bottom-6 right-6 z-10 flex items-center gap-2 bg-brand text-white text-xs font-semibold px-4 rounded-full border-none cursor-pointer hover:opacity-85 transition-opacity shadow-search"
        style={{ height: "44px" }}
      >
        ✦ 글쓰기
      </button>

      <WritePostModal isOpen={writeOpen} onClose={() => setWriteOpen(false)} onSubmit={handlePostSubmit} />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomePageContent />
    </Suspense>
  );
}
