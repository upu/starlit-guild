import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./phone.css";
import "./mobile-polish.css";
import "./battle-effects.css";
import "./stories.css";
import "./navigation.css"; // Adventure, party, and memory navigation.

export const viewport: Viewport = {width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#132625'};

export const metadata: Metadata = {
  title: "星灯りの旅団 | STARLIT GUILD",
  description: "仲間を見守り、旅団と帰る場所を育てる。タップで応援できるファンタジー放置RPG。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {capable:true,title:'星灯りの旅団',statusBarStyle:'black-translucent'},
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/icons/lantern.svg",
    shortcut: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
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
