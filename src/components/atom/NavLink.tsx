import Link from "next/link";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export default function NavLink({ href, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="text-text-body no-underline hover:text-brand transition-colors text-xs"
    >
      {children}
    </Link>
  );
}
