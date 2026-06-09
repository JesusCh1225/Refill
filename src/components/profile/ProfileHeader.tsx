"use client";

import { useRef } from "react";

const PROVIDER_LABEL: Record<string, string> = { kakao: "카카오", naver: "네이버" };

interface UserProfile {
  name: string;
  email: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  oauthAccounts: { provider: string }[];
}

interface Props {
  profile: UserProfile;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProfileHeader({ profile, onFileChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const displayName = profile.nickname || profile.name;

  return (
    <div className="bg-white rounded-2xl border border-border-card px-4 py-5 sm:px-8 sm:py-7 flex items-center gap-4 sm:gap-5 mb-6">
      <div className="relative group shrink-0">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="block rounded-full overflow-hidden w-16 h-16 cursor-pointer border-none p-0 bg-transparent"
          title="프로필 사진 변경"
        >
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={displayName} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-brand-bg flex items-center justify-center text-2xl font-bold text-brand">
              {displayName[0]}
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[18px] font-bold text-text-heading">{displayName}</p>
        {profile.email && <p className="text-[13px] text-text-muted mt-0.5 truncate">{profile.email}</p>}
        <div className="flex gap-1.5 mt-1.5 flex-wrap">
          {profile.oauthAccounts.map((acc) => (
            <span key={acc.provider} className="text-[10px] font-semibold text-brand bg-brand-bg px-2 py-0.5 rounded-full">
              {PROVIDER_LABEL[acc.provider] ?? acc.provider}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
