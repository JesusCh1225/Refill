"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/context/toast";

export function useBookmarks() {
  const { status } = useSession();
  const { showToast } = useToast();
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [loginRequired, setLoginRequired] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") { setIds(new Set()); return; }
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((arr: number[]) => setIds(new Set(arr)))
      .catch(() => {});
  }, [status]);

  const toggle = async (postId: number) => {
    if (status !== "authenticated") {
      setLoginRequired(true);
      return;
    }

    const had = ids.has(postId);
    const next = new Set(ids);
    had ? next.delete(postId) : next.add(postId);
    setIds(next);

    const res = await fetch(`/api/bookmarks/${postId}`, {
      method: had ? "DELETE" : "POST",
    }).catch(() => null);

    if (!res || !res.ok) {
      setIds(ids);
      showToast("북마크 저장에 실패했어요.", "error");
    }
  };

  return {
    isBookmarked: (id: number) => ids.has(id),
    toggle,
    loginRequired,
    clearLoginRequired: () => setLoginRequired(false),
  };
}
