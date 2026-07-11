"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/organisms/Header";
import CommunityEditor from "@/components/community/CommunityEditor";
import Spinner from "@/components/atom/Spinner";

export default function CommunityWritePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("자유");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/community");
  }, [status, router]);

  const handleSubmit = async () => {
    if (!title.trim()) { setError("제목을 입력해 주세요."); return; }
    if (!content || content === "<p></p>") { setError("내용을 입력해 주세요."); return; }
    if (content.replace(/<[^>]*>/g, "").length > 10_000) { setError("내용이 너무 길어요. 10,000자 이하로 작성해 주세요."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, content }),
      });
      if (res.ok) {
        const post = await res.json();
        router.push(`/community/${post.id}`);
      } else {
        setError("저장에 실패했어요. 다시 시도해 주세요.");
      }
    } finally { setSaving(false); }
  };

  if (status === "loading") {
    return <div className="min-h-screen bg-surface-page flex items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="min-h-screen bg-surface-page">
      <Header />
      <main className="mx-auto px-4 sm:px-6 pt-8 pb-20" style={{ maxWidth: "760px" }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-bold text-text-heading">글쓰기</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.back()}
              className="px-4 h-9 rounded-xl border border-border-base text-[13px] text-text-body bg-white cursor-pointer hover:bg-surface-card transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 h-9 rounded-xl bg-brand text-white text-[13px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-50"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border-card px-5 py-5 flex flex-col gap-4">
          {/* 카테고리 */}
          <div className="flex items-center gap-3">
            <label className="text-[13px] font-semibold text-text-muted w-14 shrink-0">카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border-base text-[13px] text-text-body bg-white cursor-pointer focus:outline-none focus:border-brand transition-colors"
            >
              <option value="자유">자유</option>
              <option value="문의">문의</option>
            </select>
          </div>

          {/* 제목 */}
          <div className="flex items-center gap-3">
            <label className="text-[13px] font-semibold text-text-muted w-14 shrink-0">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              placeholder="제목을 입력하세요"
              className="flex-1 h-9 px-3 rounded-lg border border-border-base text-[13px] text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-brand transition-colors"
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="text-[13px] font-semibold text-text-muted block mb-2">내용</label>
            <CommunityEditor
              content={content}
              onChange={setContent}
              placeholder="내용을 입력하세요"
            />
          </div>

          {error && <p className="text-[12px] text-red-500">{error}</p>}
        </div>
      </main>
    </div>
  );
}
