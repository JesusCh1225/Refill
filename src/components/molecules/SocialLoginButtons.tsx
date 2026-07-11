"use client";

// import Image from "next/image";
import { signIn } from "next-auth/react";
// import kakaoBtn from "@/styles/kakao_login_medium_wide.png";
import GoogleIcon from "@/components/atom/GoogleIcon";

export const BUTTON_WIDTH = 300;
const BTN_H = 45;

export default function SocialLoginButtons({ callbackUrl = "/" }: { callbackUrl?: string }) {
  return (
    <div className="flex flex-col gap-3 w-full items-center">
      {/* 카카오/네이버: 사업자 등록 전까지 비노출 (코드 유지)
      <button
        onClick={() => signIn("kakao", { callbackUrl })}
        className="cursor-pointer border-none bg-transparent p-0 w-full"
        style={{ maxWidth: BUTTON_WIDTH }}
      >
        <Image
          src={kakaoBtn}
          alt="카카오 로그인"
          height={BTN_H}
          style={{ width: "100%", height: "auto" }}
          priority
        />
      </button>

      <button
        onClick={() => signIn("naver", { callbackUrl })}
        className="cursor-pointer border-none p-0 flex items-center rounded-xl overflow-hidden w-full"
        style={{ maxWidth: BUTTON_WIDTH, height: BTN_H, background: "#03C75A" }}
      >
        <span
          className="flex items-center justify-center shrink-0 font-black text-white"
          style={{ width: BTN_H, height: BTN_H, fontSize: 20, letterSpacing: "-1px" }}
        >
          N
        </span>
        <span className="flex-1 text-center text-white font-semibold" style={{ fontSize: 15 }}>
          네이버로 로그인
        </span>
        <span style={{ width: BTN_H }} />
      </button>
      */}

      <button
        onClick={() => signIn("google", { callbackUrl })}
        className="cursor-pointer p-0 flex items-center rounded-xl overflow-hidden w-full border"
        style={{ maxWidth: BUTTON_WIDTH, height: BTN_H, background: "#fff", borderColor: "#dadce0" }}
      >
        <span
          className="flex items-center justify-center shrink-0"
          style={{ width: BTN_H, height: BTN_H }}
        >
          <GoogleIcon />
        </span>
        <span className="flex-1 text-center font-semibold text-[#3c4043]" style={{ fontSize: 15 }}>
          Google로 로그인
        </span>
        <span style={{ width: BTN_H }} />
      </button>
    </div>
  );
}
