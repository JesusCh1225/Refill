import Link from "next/link";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";

export const metadata = {
  title: "이용약관 | Refill",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-page flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full px-4 sm:px-6 pt-10 pb-20" style={{ maxWidth: "720px" }}>
        <h1 className="text-[22px] font-bold text-text-heading mb-1">이용약관</h1>
        <p className="text-[13px] text-text-muted mb-8">시행일: 2026년 7월 1일</p>

        <Section title="제1조 (목적)">
          이 약관은 Refill(이하 &ldquo;서비스&rdquo;)을 운영하는 운영자(이하 &ldquo;운영자&rdquo;)가 제공하는 음악 교류 플랫폼 서비스의 이용 조건 및 절차, 운영자와 회원 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
        </Section>

        <Section title="제2조 (용어의 정의)">
          <ol className="list-decimal list-inside space-y-1.5">
            <li>&ldquo;서비스&rdquo;란 운영자가 제공하는 Refill 플랫폼 및 관련 제반 서비스를 의미합니다.</li>
            <li>&ldquo;회원&rdquo;이란 이 약관에 동의하고 소셜 로그인을 통해 서비스에 가입한 자를 의미합니다.</li>
            <li>&ldquo;게시물&rdquo;이란 회원이 서비스 내에 작성·등록한 글, 댓글, 이미지 등 일체의 정보를 의미합니다.</li>
          </ol>
        </Section>

        <Section title="제3조 (약관의 효력 및 변경)">
          <ol className="list-decimal list-inside space-y-1.5">
            <li>이 약관은 서비스 화면에 게시하거나 기타 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
            <li>운영자는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 안내합니다.</li>
            <li>회원이 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제4조 (회원 가입)">
          <ol className="list-decimal list-inside space-y-1.5">
            <li>회원 가입은 카카오 또는 네이버 소셜 로그인을 통해 이루어집니다.</li>
            <li>만 14세 미만인 자는 서비스에 가입할 수 없습니다.</li>
            <li>회원은 가입 시 제공된 정보가 정확함을 보증하며, 변경 사항이 있을 경우 즉시 수정해야 합니다.</li>
          </ol>
        </Section>

        <Section title="제5조 (회원 탈퇴 및 계정 삭제)">
          <ol className="list-decimal list-inside space-y-1.5">
            <li>회원은 언제든지 서비스 내 프로필 설정 페이지에서 탈퇴를 신청할 수 있습니다.</li>
            <li>탈퇴 시 회원의 계정 및 관련 데이터(게시물, 좋아요, 북마크 등)는 즉시 삭제되며 복구가 불가능합니다.</li>
            <li>탈퇴한 회원이 작성한 댓글은 &ldquo;탈퇴한 회원&rdquo;으로 표시되어 내용만 유지됩니다.</li>
          </ol>
        </Section>

        <Section title="제6조 (게시물)">
          <ol className="list-decimal list-inside space-y-1.5">
            <li>회원이 작성한 게시물의 저작권은 해당 회원에게 있습니다.</li>
            <li>회원은 서비스에 게시물을 등록함으로써 운영자에게 서비스 운영·개선 목적으로 해당 게시물을 사용할 수 있는 비독점적 권리를 부여합니다.</li>
            <li>타인의 저작권, 명예, 프라이버시 등을 침해하는 게시물은 운영자가 사전 통보 없이 삭제할 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제7조 (금지 행위)">
          회원은 다음 행위를 해서는 안 됩니다.
          <ul className="list-disc list-inside mt-2 space-y-1.5">
            <li>타인의 계정 도용 또는 사칭</li>
            <li>허위 정보 유포, 사기, 스팸 행위</li>
            <li>타인에 대한 욕설, 비방, 혐오 표현</li>
            <li>서비스의 정상적인 운영을 방해하는 행위</li>
            <li>영리 목적의 광고·홍보 (운영자 사전 동의 없이)</li>
            <li>관련 법령을 위반하는 행위</li>
          </ul>
        </Section>

        <Section title="제8조 (서비스 변경 및 중단)">
          <ol className="list-decimal list-inside space-y-1.5">
            <li>운영자는 서비스의 내용을 변경하거나 중단할 수 있으며, 이 경우 사전에 공지합니다.</li>
            <li>불가피한 사유로 사전 공지 없이 서비스가 중단된 경우 사후에 공지할 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제9조 (면책 조항)">
          <ol className="list-decimal list-inside space-y-1.5">
            <li>운영자는 천재지변, 시스템 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
            <li>운영자는 회원이 서비스 내에 게시한 정보의 정확성 및 신뢰성에 대해 보증하지 않습니다.</li>
            <li>운영자는 회원 간의 거래 또는 분쟁으로 인한 손해에 대해 책임을 지지 않습니다.</li>
          </ol>
        </Section>

        <Section title="제10조 (분쟁 해결)">
          이 약관과 관련한 분쟁은 대한민국 법령을 적용하며, 분쟁이 발생할 경우 운영자의 주소지를 관할하는 법원을 합의 관할 법원으로 합니다.
        </Section>

        <div className="mt-10 pt-6 border-t border-border-header">
          <Link href="/privacy" className="text-[13px] text-brand hover:underline">
            개인정보처리방침 보기 →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-[15px] font-bold text-text-heading mb-3">{title}</h2>
      <div className="text-[13px] text-text-body leading-relaxed space-y-1.5">{children}</div>
    </section>
  );
}
