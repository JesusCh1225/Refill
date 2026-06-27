"use client";

import { useSession } from "next-auth/react";
import { useToast } from "@/context/toast";
import type { PostDraft, SearchResultItem } from "@/data/sampleMockResults";

export function useCreatePost() {
  const { status: authStatus } = useSession();
  const { showToast } = useToast();

  const requireLogin = (): boolean => {
    if (authStatus !== "authenticated") {
      showToast("글을 작성하려면 로그인이 필요해요.", "error");
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
      if (!res.ok) {
        showToast("글 등록에 실패했어요. 다시 시도해주세요.", "error");
        return null;
      }
      return await res.json();
    } catch {
      showToast("글 등록에 실패했어요. 다시 시도해주세요.", "error");
      return null;
    }
  };

  return { requireLogin, createPost };
}
