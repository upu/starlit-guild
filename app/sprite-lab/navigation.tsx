"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { spriteStudies } from "./studies";

export function SpriteLabNavigation() {
  const pathname = usePathname();
  return (
    <nav className="sprite-lab-navigation" aria-label="ドット絵見本帳">
      <Link href="/sprite-lab" aria-current={pathname === "/sprite-lab" ? "page" : undefined}>
        見本帳
      </Link>
      <Link
        href="/sprite-lab/adventure"
        aria-current={pathname === "/sprite-lab/adventure" ? "page" : undefined}
      >
        冒険の動き
      </Link>
      {spriteStudies.map(({ id, title }) => (
        <Link
          key={id}
          href={`/sprite-lab/${id}`}
          aria-current={pathname === `/sprite-lab/${id}` ? "page" : undefined}
        >
          {title}
        </Link>
      ))}
    </nav>
  );
}
