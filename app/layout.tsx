import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./phone.css";

export const viewport: Viewport = {width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#111b20'};

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
