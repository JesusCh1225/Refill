import Logo from "@/components/atom/Logo";
import NavLink from "@/components/atom/NavLink";
import Button from "@/components/atom/Button";

const NAV_LINKS = [
  { href: "/musicmap", label: "음악맵" },
  { href: "/lesson", label: "레슨" },
  { href: "/market", label: "마켓" },
  { href: "/community", label: "커뮤니티" },
];

interface HeaderProps {
  onLogoClick?: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  return (
    <header
      className="px-10 flex items-center justify-between border-b border-border-header"
      style={{ height: "60px" }}
    >
      <Logo onClick={onLogoClick} />
      <nav className="flex items-center gap-8">
        {NAV_LINKS.map((link) => (
          <NavLink key={link.label} href={link.href}>
            {link.label}
          </NavLink>
        ))}
        <Button variant="primary">시작하기</Button>
      </nav>
    </header>
  );
}
