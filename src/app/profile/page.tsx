"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Header from "@/components/organisms/Header";
import Spinner from "@/components/atom/Spinner";
import ProfileHeader from "@/components/profile/ProfileHeader";
import AvatarCropModal from "@/components/profile/AvatarCropModal";
import InfoTab from "@/components/profile/InfoTab";
import PostsTab from "@/components/profile/PostsTab";
import BookmarksTab from "@/components/profile/BookmarksTab";
import type { SearchResultItem } from "@/data/sampleMockResults";

type Tab = "info" | "posts" | "bookmarks";

interface UserProfile {
  id: number;
  name: string;
  email: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  bio: string | null;
  contact: string | null;
  representativeSong: string | null;
  createdAt: string;
  oauthAccounts: { provider: string }[];
}

const TABS: { id: Tab; label: string }[] = [
  { id: "info", label: "내 정보" },
  { id: "posts", label: "작성한 글" },
  { id: "bookmarks", label: "북마크" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { status, update } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("info");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [myPosts, setMyPosts] = useState<SearchResultItem[]>([]);
  const [myBookmarks, setMyBookmarks] = useState<SearchResultItem[]>([]);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [postDeleteLoading, setPostDeleteLoading] = useState(false);

  // 아바타
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: UserProfile) => { setProfile(data); setNicknameInput(data.nickname ?? data.name); })
      .catch(() => {});
    fetch("/api/profile/posts")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setMyPosts(data))
      .catch(() => {});
    fetch("/api/bookmarks?full=1")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setMyBookmarks(data))
      .catch(() => {});
  }, [status]);

  const handleNicknameSave = async () => {
    if (!nicknameInput.trim() || saving || !profile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nicknameInput.trim() }),
      });
      if (res.ok) setProfile((p) => p ? { ...p, nickname: nicknameInput.trim() } : p);
    } finally {
      setSaving(false);
    }
  };

  const handleProfileFieldSave = async (
    field: "bio" | "contact" | "representativeSong",
    value: string,
  ) => {
    if (!profile) return;
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value.trim() || null }),
    });
    if (res.ok) setProfile((p) => p ? { ...p, [field]: value.trim() || null } : p);
  };

  const handleDeleteAccount = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await fetch("/api/profile", { method: "DELETE" });
      await signOut({ redirect: false });
      router.replace("/");
    } finally {
      setDeleting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setAvatarError("이미지 파일만 선택할 수 있어요."); return; }
    if (file.size > 5 * 1024 * 1024) { setAvatarError("파일 크기는 5MB 이하여야 해요."); return; }
    setAvatarSrc(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleAvatarUpload = async (blob: Blob) => {
    if (avatarUploading) return;
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const fd = new FormData();
      fd.append("image", blob, "avatar.jpg");
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      if (!res.ok) {
        setAvatarError("업로드에 실패했어요. 다시 시도해 주세요.");
        return;
      }
      const { url } = await res.json();
      setProfile((p) => p ? { ...p, avatarUrl: url } : p);
      await update({ image: url });
      setAvatarSrc(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarReset = async () => {
    if (avatarUploading) return;
    setAvatarUploading(true);
    try {
      await fetch("/api/upload/avatar", { method: "DELETE" });
      setProfile((p) => p ? { ...p, avatarUrl: null } : p);
      await update({ image: null });
    } finally {
      setAvatarUploading(false);
    }
  };

  const cancelPreview = () => { setAvatarSrc(null); setAvatarError(null); };
  const triggerAvatarChange = () => { setAvatarError(null); fileInputRef.current?.click(); };;

  const handlePostDelete = async (postId: number) => {
    if (postDeleteLoading) return;
    setPostDeleteLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (res.ok) { setMyPosts((prev) => prev.filter((p) => p.id !== postId)); setDeletingPostId(null); }
    } finally {
      setPostDeleteLoading(false);
    }
  };

  if (status === "loading" || !profile) {
    return (
      <div className="min-h-screen bg-surface-page">
        <Header />
        <div className="flex items-center justify-center py-40">
          <Spinner />
        </div>
      </div>
    );
  }

  const hasCustomAvatar = !!profile.avatarUrl?.includes(".blob.vercel-storage.com");

  return (
    <div className="min-h-screen bg-surface-page">
      <Header />

      {avatarSrc && (
        <AvatarCropModal
          imageSrc={avatarSrc}
          uploading={avatarUploading}
          error={avatarError}
          onSave={handleAvatarUpload}
          onCancel={cancelPreview}
        />
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <div className="mx-auto px-3 sm:px-6 pt-5 sm:pt-8 pb-20" style={{ maxWidth: "720px" }}>
        <ProfileHeader profile={profile} onAvatarClick={triggerAvatarChange} />

        {/* 탭 */}
        <div className="flex gap-1 mb-6 bg-white rounded-2xl border border-border-card p-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-colors border-none cursor-pointer ${
                tab === t.id ? "bg-brand text-white" : "bg-transparent text-text-muted hover:text-text-body"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "info" && (
          <InfoTab
            profile={profile}
            nicknameInput={nicknameInput}
            onNicknameChange={setNicknameInput}
            onNicknameSave={handleNicknameSave}
            nicknameSaving={saving}
            avatarUploading={avatarUploading}
            hasCustomAvatar={hasCustomAvatar}
            onAvatarClick={triggerAvatarChange}
            onAvatarReset={handleAvatarReset}
            showDeleteConfirm={showDeleteConfirm}
            onShowDeleteConfirm={setShowDeleteConfirm}
            onDeleteAccount={handleDeleteAccount}
            deleting={deleting}
            onProfileFieldSave={handleProfileFieldSave}
          />
        )}
        {tab === "posts" && (
          <PostsTab
            posts={myPosts}
            deletingPostId={deletingPostId}
            deleteLoading={postDeleteLoading}
            onDeleteClick={setDeletingPostId}
            onDeleteConfirm={handlePostDelete}
            onDeleteCancel={() => setDeletingPostId(null)}
          />
        )}
        {tab === "bookmarks" && <BookmarksTab bookmarks={myBookmarks} />}
      </div>
    </div>
  );
}
