import Link from "next/link";

interface AuthorLinkProps {
  authorId?: number | null;
  name: string;
  className?: string;
}

export default function AuthorLink({ authorId, name, className = "" }: AuthorLinkProps) {
  if (!authorId) return <span className={className}>{name}</span>;
  return (
    <Link href={`/profile/${authorId}`} className={`${className} hover:text-brand transition-colors`}>
      {name}
    </Link>
  );
}
