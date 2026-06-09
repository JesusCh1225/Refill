"use client";

import InfoField from "@/components/atom/InfoField";

const PROVIDER_LABEL: Record<string, string> = { kakao: "카카오", naver: "네이버" };

interface UserProfile {
  name: string;
  email: string | null;
  nickname: string | null;
  avatarUrl: string | null;
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
  onAvatarReset: () => void;
  showDeleteConfirm: boolean;
  onShowDeleteConfirm: (v: boolean) => void;
  onDeleteAccount: () => void;
  deleting: boolean;
}

export default function InfoTab({
  profile,
  nicknameInput,
  onNicknameChange,
  onNicknameSave,
  nicknameSaving,
  avatarUploading,
  hasCustomAvatar,
  onAvatarReset,
  showDeleteConfirm,
  onShowDeleteConfirm,
  onDeleteAccount,
  deleting,
}: Props) {
  const savedNickname = profile.nickname ?? profile.name;

  return (
    <div className="bg-white rounded-2xl border border-border-card px-4 py-5 sm:px-8 sm:py-7 flex flex-col gap-6">
      {/* 프로필 사진 */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-[14px] font-bold text-text-heading">프로필 사진</h2>
          <p className="text-[12px] text-text-muted mt-0.5">
            상단 사진을 클릭하면 새 사진을 등록할 수 있어요. (JPG, PNG, WEBP · 최대 5MB)
          </p>
        </div>
        {hasCustomAvatar && (
          <button
            onClick={onAvatarReset}
            disabled={avatarUploading}
            className="self-start px-4 h-9 rounded-lg border border-border-base text-text-muted text-[12px] font-semibold bg-transparent cursor-pointer hover:bg-surface-card transition-colors disabled:opacity-50"
          >
            {avatarUploading ? "처리 중…" : "기본 사진으로 되돌리기"}
          </button>
        )}
      </section>

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

      {/* 닉네임 */}
      <section className="flex flex-col gap-3">
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
            className="flex-1 h-10 px-3 rounded-lg border border-border-base text-[13px] text-text-body placeholder:text-text-placeholder focus:outline-none focus:border-brand transition-colors"
          />
          <button
            onClick={onNicknameSave}
            disabled={!nicknameInput.trim() || nicknameInput === savedNickname || nicknameSaving}
            className="px-5 h-10 rounded-lg bg-brand text-white text-[13px] font-semibold border-none cursor-pointer hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {nicknameSaving ? "저장중…" : "저장"}
          </button>
        </div>
        <p className="text-right text-[11px] text-text-placeholder">{nicknameInput.length}/20</p>
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
