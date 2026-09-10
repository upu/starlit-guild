import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "星灯りの旅団 | STARLIT GUILD",
  description: "仲間が歩き、戦い、採取する。クリックで応援できる、ログイン不要のファンタジー放置RPG。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
