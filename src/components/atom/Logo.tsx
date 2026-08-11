"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logoImg from "@/styles/refill_01.png";

export default function Logo() {
  const router = useRouter();
  return (
    <Link
      href="/"
      className="flex items-center cursor-pointer"
      onClick={(e) => { e.preventDefault(); router.push("/"); }}
    >
      <Image src={logoImg} alt="REFILL" height={36} style={{ width: "auto" }} />
    </Link>
  );
}
