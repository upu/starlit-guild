import type { ReactNode } from "react";
import { env } from "cloudflare:workers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SpriteLabNavigation } from "./navigation";
import "./lab.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "ドット絵見本帳 | 星灯りの旅団",
  robots: { index: false, follow: false },
};

export default function SpriteLabLayout({ children }: { children: ReactNode }) {
  if (env.ENABLE_TEST_TOOLS !== "true") notFound();
  return (
    <div className="sprite-lab-shell">
      <header className="sprite-lab-header">
        <Link href="/sprite-lab">ドット絵見本帳</Link>
        <div>
          <Link href="/guild-lab">部屋・家具配置の試作</Link>
          <Link href="/">ゲームへ戻る</Link>
        </div>
      </header>
      <SpriteLabNavigation />
      {children}
    </div>
  );
}
