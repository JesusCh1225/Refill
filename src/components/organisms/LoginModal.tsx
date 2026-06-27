"use client";

import Link from "next/link";
import SocialLoginButtons, { BUTTON_WIDTH } from "@/components/molecules/SocialLoginButtons";

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const cb = typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl flex flex-col items-center px-8 py-8 gap-5 w-full"
        style={{ maxWidth: BUTTON_WIDTH + 64, boxShadow: "0 24px 64px rgba(15,23,42,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex justify-end -mb-2">
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-body border-none bg-transparent cursor-pointer text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="text-center">
          <p className="text-[26px] font-black tracking-widest text-brand">REFILL</p>
          <p className="text-[12px] text-text-muted mt-0.5">음악을 채우다.</p>
        </div>

        <div className="text-center">
          <p className="text-[15px] font-bold text-text-heading">로그인 / 회원가입</p>
          <p className="text-[12px] text-text-muted mt-1">소셜 계정으로 간편하게 시작하세요</p>
        </div>

        <SocialLoginButtons callbackUrl={cb} />

        <p className="text-[11px] text-text-placeholder text-center leading-relaxed">
          로그인 시{" "}
          <Link href="/terms" className="underline hover:text-text-muted" target="_blank">이용약관</Link>
          {" "}및{" "}
          <Link href="/privacy" className="underline hover:text-text-muted" target="_blank">개인정보처리방침</Link>
          에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}
