"use client";

import { useState } from "react";
import InfoField from "@/components/atom/InfoField";
import EditableField from "@/components/atom/EditableField";
import Avatar from "@/components/atom/Avatar";

const PROVIDER_LABEL: Record<string, string> = { kakao: "카카오", naver: "네이버" };

function parseList(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json) as string[]; } catch { return []; }
}

interface ListFieldProps {
  title: string;
  description: string;
  placeholder: string;
  initialJson: string | null;
  onSave: (json: string) => Promise<void>;
}

function ListField({ title, description, placeholder, initialJson, onSave }: ListFieldProps) {
  const [items, setItems] = useState<string[]>(() => parseList(initialJson));
  const [saving, setSaving] = useState(false);
  const initial = parseList(initialJson);
  const isDirty = JSON.stringify(items) !== JSON.stringify(initial);

  const update = (idx: number, val: string) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? val : it)));
  const remove = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));
  const add = () => setItems((prev) => [...prev, ""]);
  const handleSave = async () => {
    setSaving(true);
    const cleaned = items.filter((it) => it.trim());
    try { await onSave(JSON.stringify(cleaned)); setItems(cleaned); } finally { setSaving(false); }
  };

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-[14px] font-bold text-text-heading">{title}</h2>
        <p className="text-[12px] text-text-muted mt-0.5">{description}</p>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={it}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              maxLength={200}
              className="flex-1 h-9 px-3 rounded-lg border border-border-base text-[13px] text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-brand transition-colors"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="w-9 h-9 rounded-lg border border-border-base text-text-muted text-[14px] bg-transparent cursor-pointer hover:border-red-300 hover:text-red-400 transition-colors shrink-0"
            >
              ✕
            </button>
          </div>
        ))}
        {items.length < 20 && (
          <button
            type="button"
            onClick={add}
            className="self-start px-3 h-8 rounded-lg border border-dashed border-border-base text-[12px] text-text-muted bg-transparent cursor-pointer hover:border-brand hover:text-brand transition-colors"
          >
            + 항목 추가
          </button>
        )}
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="px-4 h-9 rounded-lg bg-brand text-white text-[12px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "저장중…" : "저장"}
        </button>
      </div>
    </section>
  );
}

interface UserProfile {
  name: string;
  email: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  bio: string | null;
  contact: string | null;
  representativeSong: string | null;
  licenses: string | null;
  career: string | null;
  createdAt: string;
  oauthAccounts: { provider: string }[];
}

interface Props {
  profile: UserProfile;
  nicknameInput: string;
  onNicknameChange: (v: string) => void;
  onNicknameSave: () => void;
  nicknameSaving: boolean;
  avatarUploading: boolean;
  hasCustomAvatar: boolean;
  onAvatarClick: () => void;
  onAvatarReset: () => void;
  showDeleteConfirm: boolean;
  onShowDeleteConfirm: (v: boolean) => void;
  onDeleteAccount: () => void;
  deleting: boolean;
  onProfileFieldSave: (field: "bio" | "contact" | "representativeSong" | "licenses" | "career", value: string) => Promise<void>;
}

export default function InfoTab({
  profile,
  nicknameInput,
  onNicknameChange,
  onNicknameSave,
  nicknameSaving,
  avatarUploading,
  hasCustomAvatar,
  onAvatarClick,
  onAvatarReset,
  showDeleteConfirm,
  onShowDeleteConfirm,
  onDeleteAccount,
  deleting,
  onProfileFieldSave,
}: Props) {
  const savedNickname = profile.nickname ?? profile.name;
  const displayName = profile.nickname ?? profile.name;

  return (
    <div className="bg-white rounded-2xl border border-border-card px-4 py-5 sm:px-8 sm:py-7 flex flex-col gap-6">

      {/* 프로필 사진 + 닉네임 — 최상단 */}
      <section className="flex items-start gap-4 sm:gap-5">
        {/* 아바타 */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="relative group">
            <button
              type="button"
              onClick={onAvatarClick}
              disabled={avatarUploading}
              className="block rounded-full overflow-hidden w-20 h-20 cursor-pointer border-none p-0 bg-transparent disabled:opacity-60 disabled:cursor-not-allowed"
              title="사진 변경"
            >
              <Avatar src={profile.avatarUrl} name={displayName} className="w-20 h-20" textClassName="text-3xl" />
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </button>
          </div>
          {hasCustomAvatar && (
            <button
              onClick={onAvatarReset}
              disabled={avatarUploading}
              className="text-[11px] text-text-muted underline underline-offset-2 bg-transparent border-none cursor-pointer hover:text-text-body transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {avatarUploading ? "처리 중…" : "기본으로 되돌리기"}
            </button>
          )}
        </div>

        {/* 닉네임 */}
        <div className="flex-1 min-w-0 flex flex-col gap-2 pt-1">
          <div>
            <h2 className="text-[14px] font-bold text-text-heading">닉네임</h2>
            <p className="text-[12px] text-text-muted mt-0.5">게시글과 댓글에 표시되는 이름입니다.</p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={nicknameInput}
              onChange={(e) => onNicknameChange(e.target.value)}
              maxLength={20}
              placeholder="닉네임 입력"
              className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-border-base text-[13px] text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-brand transition-colors"
            />
            <button
              onClick={onNicknameSave}
              disabled={!nicknameInput.trim() || nicknameInput === savedNickname || nicknameSaving}
              className="px-4 h-10 rounded-lg bg-brand text-white text-[13px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {nicknameSaving ? "저장중…" : "저장"}
            </button>
          </div>
          <p className="text-right text-[11px] text-text-placeholder">{nicknameInput.length}/20</p>
        </div>
      </section>

      <hr className="border-border-base" />

      <EditableField
        title="소개글"
        description="다른 사용자에게 보여지는 자기소개입니다."
        type="textarea"
        initialValue={profile.bio ?? ""}
        placeholder="음악 경력, 레슨 스타일, 관심 장르 등을 자유롭게 소개해 주세요."
        maxLength={500}
        rows={4}
        onSave={(v) => onProfileFieldSave("bio", v)}
      />

      <hr className="border-border-base" />

      <EditableField
        title="연락처"
        description="인스타그램, 카카오 오픈채팅, 전화번호 등을 입력하세요."
        type="text"
        initialValue={profile.contact ?? ""}
        placeholder="예: 인스타 @my_account / 카카오 오픈채팅 링크"
        maxLength={200}
        onSave={(v) => onProfileFieldSave("contact", v)}
      />

      <hr className="border-border-base" />

      <EditableField
        title="대표 음원"
        description="SoundCloud, YouTube, Spotify 등의 링크를 입력하면 프로필에 표시돼요."
        type="url"
        initialValue={profile.representativeSong ?? ""}
        placeholder="https://soundcloud.com/..."
        maxLength={500}
        onSave={(v) => onProfileFieldSave("representativeSong", v)}
        extra={(v) => v ? (
          <a href={v} target="_blank" rel="noopener noreferrer" className="text-[12px] text-brand hover:underline truncate">
            🎵 {v}
          </a>
        ) : null}
      />

      <hr className="border-border-base" />

      <ListField
        title="보유 라이센스 / 자격증"
        description="공식 자격증, 수료증, 학위 등을 입력하세요."
        placeholder="예: 기타 강사 자격증 (한국음악협회, 2022)"
        initialJson={profile.licenses}
        onSave={(v) => onProfileFieldSave("licenses", v)}
      />

      <hr className="border-border-base" />

      <ListField
        title="경력 / 활동 이력"
        description="연주 경력, 레슨 경력, 밴드 활동 등을 입력하세요."
        placeholder="예: 홍대 OO밴드 기타리스트 (2019-2022)"
        initialJson={profile.career}
        onSave={(v) => onProfileFieldSave("career", v)}
      />

      <hr className="border-border-base" />

      {/* 로그인 정보 */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[14px] font-bold text-text-heading">로그인 정보</h2>
        <div className="flex flex-col gap-3">
          <InfoField label="이름" value={profile.name} />
          {profile.email && <InfoField label="이메일" value={profile.email} />}
          <InfoField label="가입일" value={new Date(profile.createdAt).toLocaleDateString("ko-KR")} />
          <div className="flex items-center gap-4">
            <span className="text-[12px] font-semibold text-text-muted w-14 shrink-0">연동</span>
            <div className="flex gap-1.5">
              {profile.oauthAccounts.map((acc) => (
                <span key={acc.provider} className="text-[12px] font-semibold text-brand bg-brand-bg px-2.5 py-1 rounded-full">
                  {PROVIDER_LABEL[acc.provider] ?? acc.provider}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr className="border-border-base" />

      {/* 회원 탈퇴 */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-[14px] font-bold text-red-500">회원 탈퇴</h2>
          <p className="text-[12px] text-text-muted mt-0.5">
            탈퇴 시 모든 데이터가 삭제되고 카카오/네이버 연결도 해제됩니다.
          </p>
        </div>
        {showDeleteConfirm ? (
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-red-50 border border-red-200">
            <p className="text-[13px] text-red-600 font-semibold">정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex gap-2">
              <button
                onClick={onDeleteAccount}
                disabled={deleting}
                className="px-4 h-9 rounded-lg bg-red-500 text-white text-[12px] font-semibold border-none cursor-pointer hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? "처리중…" : "탈퇴 확인"}
              </button>
              <button
                onClick={() => onShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 h-9 rounded-lg bg-white text-text-body text-[12px] font-semibold border border-border-base cursor-pointer hover:bg-surface-card transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onShowDeleteConfirm(true)}
            className="self-start px-4 h-9 rounded-lg border border-red-300 text-red-500 text-[12px] font-semibold bg-transparent cursor-pointer hover:bg-red-50 transition-colors"
          >
            회원 탈퇴
          </button>
        )}
      </section>
    </div>
  );
}
