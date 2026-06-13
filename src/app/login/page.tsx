import SocialLoginButtons, { BUTTON_WIDTH } from "@/components/molecules/SocialLoginButtons";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center px-4">
      <div
        className="bg-white rounded-3xl flex flex-col items-center px-8 py-10 gap-5 w-full"
        style={{ maxWidth: BUTTON_WIDTH + 64, boxShadow: "0 20px 60px rgba(15,23,42,0.10)" }}
      >
        <div className="text-center mb-2">
          <p className="text-[30px] font-black tracking-widest text-brand">REFILL</p>
          <p className="text-[13px] text-text-muted mt-1">음악을 채우다.</p>
        </div>

        <div className="text-center">
          <p className="text-[16px] font-bold text-text-heading">로그인 / 회원가입</p>
          <p className="text-[13px] text-text-muted mt-1">소셜 계정으로 간편하게 시작하세요</p>
        </div>

        <SocialLoginButtons callbackUrl="/" />

        <p className="text-[11px] text-text-placeholder text-center mt-1 leading-relaxed">
          로그인 시 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}
