"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import SocialLoginButtons, { BUTTON_WIDTH } from "@/components/molecules/SocialLoginButtons";

function errorMessage(error: string | null): string | null {
  if (!error) return null;
  if (error === "OAuthCallback" || error === "AccessDenied") return "로그인이 취소됐어요.";
  return "로그인 중 오류가 발생했어요. 다시 시도해 주세요.";
}

function LoginModalContent() {
  const router = useRouter();
  const params = useSearchParams();
  const error = params.get("error");
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const message = errorMessage(error);

  const handleClose = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl flex flex-col items-center px-8 py-8 gap-5 w-full"
        style={{ maxWidth: BUTTON_WIDTH + 64, boxShadow: "0 24px 64px rgba(15,23,42,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex justify-end -mb-2">
          <button
            onClick={handleClose}
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

        {message && (
          <p className="text-[13px] text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 w-full text-center">
            {message}
          </p>
        )}

        <SocialLoginButtons callbackUrl={callbackUrl} />

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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginModalContent />
    </Suspense>
  );
}
