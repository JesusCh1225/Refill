"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Logo from "@/components/atom/Logo";
import NavLink from "@/components/atom/NavLink";
import Avatar from "@/components/atom/Avatar";
import LoginModal from "@/components/organisms/LoginModal";

const NAV_LINKS = [
  { href: "/musicmap", label: "음악맵", disabled: false },
  { href: "/community", label: "커뮤니티", disabled: true },
];

interface HeaderProps {
  onLogoClick?: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header
        className="relative px-4 sm:px-10 flex items-center justify-between border-b border-border-header bg-white"
        style={{ height: "60px" }}
      >
        <Logo onClick={onLogoClick} />

        {/* 데스크톱 네비게이션 */}
        <nav className="hidden sm:flex items-center gap-8">
          <NavLink href="/">검색</NavLink>
          {NAV_LINKS.map((link) =>
            link.disabled ? (
              <div
                key={link.label}
                className="relative flex flex-col items-center gap-0.5"
              >
                <span className="text-[10px] font-semibold text-brand leading-none">
                  개발중
                </span>
                <span className="text-sm text-text-muted cursor-not-allowed">
                  {link.label}
                </span>
              </div>
            ) : (
              <NavLink key={link.label} href={link.href}>
                {link.label}
              </NavLink>
            ),
          )}

          {loading ? (
            <div className="w-8 h-8 rounded-full bg-brand-bg animate-pulse" />
          ) : session ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Avatar src={session.user.image} name={session.user.name ?? "?"} className="w-8 h-8" textClassName="text-sm" />
                <span className="text-[13px] text-text-body font-medium">
                  {session.user.name}
                </span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-[12px] text-text-muted hover:text-text-body transition-colors border-none bg-transparent cursor-pointer"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="bg-brand text-white px-4.5 py-2 rounded-full text-2xs font-medium hover:opacity-80 transition-opacity border-none cursor-pointer"
            >
              로그인
            </button>
          )}
        </nav>

        {/* 모바일 우측 영역 */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href="/"
            className="px-2 text-sm text-text-body hover:text-brand transition-colors"
          >
            검색
          </Link>
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-brand-bg animate-pulse" />
          ) : session ? (
            <Link
              href="/profile"
              className="hover:opacity-80 transition-opacity"
            >
              <Avatar src={session.user.image} name={session.user.name ?? "?"} className="w-8 h-8" textClassName="text-sm" />
            </Link>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="bg-brand text-white px-3 py-1.5 rounded-full text-[12px] font-medium hover:opacity-80 transition-opacity border-none cursor-pointer"
            >
              로그인
            </button>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="메뉴"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-body border-none bg-transparent cursor-pointer hover:bg-surface-card transition-colors"
          >
            {menuOpen ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        {menuOpen && (
          <div className="sm:hidden absolute top-full left-0 right-0 z-40 bg-white border-b border-border-header shadow-lg">
            <nav className="flex flex-col px-4 py-3 gap-0.5">
              {NAV_LINKS.map((link) =>
                link.disabled ? (
                  <div
                    key={link.label}
                    className="flex items-center gap-2 py-3 px-3 rounded-xl text-text-muted cursor-not-allowed"
                  >
                    <span className="text-sm">{link.label}</span>
                    <span className="text-[10px] font-semibold text-brand bg-brand-bg px-1.5 py-0.5 rounded-full">
                      개발중
                    </span>
                  </div>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="py-3 px-3 text-sm text-text-body font-medium hover:bg-surface-card rounded-xl transition-colors"
                  >
                    {link.label}
                  </Link>
                ),
              )}
              {session && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="py-3 px-3 text-sm text-text-muted text-left border-none bg-transparent cursor-pointer hover:bg-surface-card rounded-xl transition-colors"
                >
                  로그아웃
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </>
  );
}
