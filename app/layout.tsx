import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "星灯りの旅団 | ファンタジー放置RPG",
  description: "仲間を集め、冒険を見守るファンタジー放置RPG。",
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

