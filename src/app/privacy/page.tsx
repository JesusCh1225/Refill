import Link from "next/link";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";

export const metadata = {
  title: "개인정보처리방침 | Refill",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-page flex flex-col">
      <Header />
      <main
        className="flex-1 mx-auto w-full px-4 sm:px-6 pt-10 pb-20"
        style={{ maxWidth: "720px" }}
      >
        <h1 className="text-[22px] font-bold text-text-heading mb-1">
          개인정보처리방침
        </h1>
        <p className="text-[13px] text-text-muted mb-8">
          시행일: 2026년 7월 1일
        </p>

        <p className="text-[13px] text-text-body leading-relaxed mb-8">
          Refill(이하 &ldquo;서비스&rdquo;)은 회원의 개인정보를 중요하게
          생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 이 방침은
          서비스가 어떤 정보를 수집하고 어떻게 이용·보관하는지 안내합니다.
        </p>

        <Section title="1. 수집하는 개인정보 항목">
          <p className="mb-2">
            서비스는 소셜 로그인(Google·카카오·네이버)을 통해, 그리고 회원이
            직접 입력하는 방식으로 아래 정보를 수집합니다.
          </p>
          <table className="w-full text-[12px] border border-border-card rounded-lg overflow-hidden">
            <thead className="bg-surface-card">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-text-heading border-b border-border-card">
                  항목
                </th>
                <th className="text-left px-3 py-2 font-semibold text-text-heading border-b border-border-card">
                  수집 방법
                </th>
                <th className="text-left px-3 py-2 font-semibold text-text-heading border-b border-border-card">
                  수집 목적
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card">
              <tr>
                <td className="px-3 py-2">이름, 닉네임, 프로필 사진</td>
                <td className="px-3 py-2">소셜 로그인 시 자동 수집</td>
                <td className="px-3 py-2">회원 식별, 프로필 표시</td>
              </tr>
              <tr>
                <td className="px-3 py-2">
                  이메일 주소 (제공하는 소셜 계정에 한함)
                </td>
                <td className="px-3 py-2">소셜 로그인 시 자동 수집</td>
                <td className="px-3 py-2">회원 식별</td>
              </tr>
              <tr>
                <td className="px-3 py-2">소셜 계정 고유 ID, 인증 토큰</td>
                <td className="px-3 py-2">소셜 로그인 시 자동 수집</td>
                <td className="px-3 py-2">계정 연동·인증 유지</td>
              </tr>
              <tr>
                <td className="px-3 py-2">
                  소개글, 연락처, 대표 음원 링크
                </td>
                <td className="px-3 py-2">회원 직접 입력 (선택)</td>
                <td className="px-3 py-2">프로필 정보 표시</td>
              </tr>
              <tr>
                <td className="px-3 py-2">
                  서비스 이용 기록 (게시물, 댓글, 북마크 등)
                </td>
                <td className="px-3 py-2">서비스 이용 중 생성</td>
                <td className="px-3 py-2">서비스 제공</td>
              </tr>
              <tr>
                <td className="px-3 py-2">업로드 이미지 파일</td>
                <td className="px-3 py-2">회원 직접 업로드</td>
                <td className="px-3 py-2">게시물·프로필 사진 표시</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="2. 개인정보의 이용 목적">
          <ul className="list-disc list-inside space-y-1.5">
            <li>회원 가입 및 관리</li>
            <li>서비스 제공 (게시글 작성, 댓글, 알림 등)</li>
            <li>서비스 개선 및 신규 기능 개발</li>
            <li>부정 이용 방지 및 서비스 보안 유지</li>
          </ul>
        </Section>

        <Section title="3. 개인정보의 보유 및 이용 기간">
          <ol className="list-decimal list-inside space-y-1.5">
            <li>
              회원 탈퇴 시 개인정보는 즉시 삭제됩니다. 단, 관련 법령에 따라 일정
              기간 보관이 필요한 경우 해당 기간 동안 보관 후 파기합니다.
            </li>
            <li>
              탈퇴 후에도 다른 회원이 공유하거나 스크랩한 게시물의 경우 별도
              조치가 필요할 수 있습니다.
            </li>
          </ol>
        </Section>

        <Section title="4. 개인정보의 제3자 제공">
          서비스는 회원의 사전 동의 없이 개인정보를 외부에 제공하지 않습니다.
          다만, 아래 경우는 예외입니다.
          <ul className="list-disc list-inside mt-2 space-y-1.5">
            <li>회원이 직접 동의한 경우</li>
            <li>법령의 규정에 의거하거나 수사기관의 적법한 요청이 있는 경우</li>
          </ul>
        </Section>

        <Section title="5. 개인정보 처리 위탁">
          서비스는 원활한 운영을 위해 아래 업체에 개인정보 처리를 위탁합니다.
          <table className="w-full text-[12px] border border-border-card rounded-lg overflow-hidden mt-3">
            <thead className="bg-surface-card">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-text-heading border-b border-border-card">
                  수탁 업체
                </th>
                <th className="text-left px-3 py-2 font-semibold text-text-heading border-b border-border-card">
                  위탁 업무
                </th>
                <th className="text-left px-3 py-2 font-semibold text-text-heading border-b border-border-card">
                  국외 이전
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card">
              <tr>
                <td className="px-3 py-2">Vercel Inc.</td>
                <td className="px-3 py-2">서버 호스팅, 이미지 파일 저장</td>
                <td className="px-3 py-2">미국</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Neon Inc.</td>
                <td className="px-3 py-2">데이터베이스 운영</td>
                <td className="px-3 py-2">미국</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Google LLC</td>
                <td className="px-3 py-2">
                  소셜 로그인 인증, 검색어 AI 분석(Gemini API)
                </td>
                <td className="px-3 py-2">미국</td>
              </tr>
              <tr>
                <td className="px-3 py-2">카카오(Kakao Corp.)</td>
                <td className="px-3 py-2">소셜 로그인 인증</td>
                <td className="px-3 py-2">국내</td>
              </tr>
              <tr>
                <td className="px-3 py-2">네이버(NAVER Corp.)</td>
                <td className="px-3 py-2">소셜 로그인 인증, 지도·장소 검색</td>
                <td className="px-3 py-2">국내</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-text-muted">
            국외 이전 업체(Vercel, Neon, Google)는 해당 업체의 개인정보
            보호정책에 따라 정보를 보호합니다. Google의 개인정보처리방침은{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              policies.google.com/privacy
            </a>
            에서 확인하실 수 있습니다.
          </p>
        </Section>

        <Section title="6. 쿠키(Cookie) 사용">
          서비스는 로그인 상태 유지를 위해 JWT(JSON Web Token) 방식의 세션
          쿠키를 사용합니다.
          <ul className="list-disc list-inside mt-2 space-y-1.5">
            <li>쿠키 목적: 로그인 인증 상태 유지</li>
            <li>
              보관 기간: 브라우저 종료 시 또는 로그아웃 시 만료되는 세션
              쿠키와, 로그인 유지를 위한 단기 지속 쿠키가 사용될 수 있습니다.
            </li>
            <li>
              거부 방법: 브라우저 설정에서 쿠키를 거부할 수 있으나, 이 경우
              로그인이 필요한 서비스 이용이 제한됩니다.
            </li>
          </ul>
        </Section>

        <Section title="7. 이용자의 권리">
          회원은 언제든지 다음의 권리를 행사할 수 있습니다.
          <ul className="list-disc list-inside mt-2 space-y-1.5">
            <li>자신의 개인정보 열람 요청</li>
            <li>오류 정보의 정정 요청</li>
            <li>개인정보 삭제 요청 (회원 탈퇴를 통해 즉시 가능)</li>
            <li>개인정보 처리 정지 요청</li>
          </ul>
          <p className="mt-2">
            권리 행사는 서비스 내 설정 페이지 또는 아래 문의처를 통해
            가능합니다.
          </p>
        </Section>

        <Section title="8. 개인정보 보호를 위한 기술적 조치">
          <ul className="list-disc list-inside space-y-1.5">
            <li>회원 비밀번호는 저장하지 않으며, 소셜 로그인만 지원합니다.</li>
            <li>HTTPS를 통한 암호화 통신</li>
            <li>데이터베이스 접근 권한 최소화</li>
          </ul>
        </Section>

        <Section title="9. 개인정보 처리방침의 변경">
          이 방침은 법령·서비스 변경에 따라 개정될 수 있으며, 변경 시 서비스 내
          공지를 통해 안내합니다.
        </Section>

        <Section title="10. 개인정보 보호 문의">
          개인정보 관련 문의는 아래 연락처로 해주세요.
          <div className="mt-2 p-3 bg-surface-card rounded-lg text-[12px] space-y-1">
            <p>
              <span className="font-semibold">서비스명:</span> Refill
            </p>
            <p>
              <span className="font-semibold">문의:</span> alslql1234@gmail.com{" "}
              {/* TODO: 운영자 이메일 */}
            </p>
          </div>
        </Section>

        <div className="mt-10 pt-6 border-t border-border-header">
          <Link
            href="/terms"
            className="text-[13px] text-brand hover:underline"
          >
            이용약관 보기 →
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-[15px] font-bold text-text-heading mb-3">{title}</h2>
      <div className="text-[13px] text-text-body leading-relaxed space-y-1.5">
        {children}
      </div>
    </section>
  );
}
