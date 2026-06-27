import Link from "next/link";
import Image from "next/image";
import logoImg from "@/styles/refill_01.png";

interface LogoProps {
  onClick?: () => void;
}

export default function Logo({ onClick }: LogoProps) {
  return (
    <Link href="/" className="flex items-center cursor-pointer" onClick={onClick}>
      <Image src={logoImg} alt="REFILL" height={36} style={{ width: "auto" }} />
    </Link>
  );
}
