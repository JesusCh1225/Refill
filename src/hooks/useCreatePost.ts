"use client";

import { useSession } from "next-auth/react";
import type { PostDraft, SearchResultItem } from "@/data/sampleMockResults";

// 글쓰기 진입(로그인 체크)과 등록 API 호출을 모아둔 공용 훅.
// 홈/검색 화면처럼 단순히 등록 후 이동만 하면 되는 곳에서 createPost까지 사용하고,
// 음악맵처럼 좌표 지오코딩·마커 갱신이 얽힌 곳에서는 requireLogin만 재사용한다.
export function useCreatePost() {
  const { status: authStatus } = useSession();

  const requireLogin = (): boolean => {
    if (authStatus !== "authenticated") {
      alert("글을 작성하려면 로그인이 필요해요.");
      return false;
    }
    return true;
  };

  const createPost = async (draft: PostDraft): Promise<SearchResultItem | null> => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  return { requireLogin, createPost };
}
