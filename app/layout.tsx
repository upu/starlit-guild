import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import siteTargets from "../config/site-targets.json";
import "./globals.css";
import "./phone.css";
import "./mobile-polish.css";
import "./battle-effects.css";
import "./stories.css";
import "./navigation.css"; // Adventure, party, and memory screens.
import "./cinematic.css";
import "./quest-picker.css";
import "./phaser.css";
import "./prologue.css";
import "./equipment.css";
import "./shop.css";
import "./guild.css";
import "./adventure-actions.css";
import "./adventure-chat.css";
import "./phone-navigation.css"; // Shared bottom navigation shell and responsive sizing.
import "./dialog-shell.css"; // Shared dialog shell; feature dialogs keep their own layout.

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#102a26" };

const sharedMetadata: Metadata = {
  title: "星灯りの旅団 | STARLIT GUILD",
  description: "仲間を見守り、旅団と帰る場所を育てる。タップで応援できるファンタジー放置RPG。",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "星灯りの旅団",
  },
  twitter: {
    card: "summary_large_image",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "星灯りの旅団", statusBarStyle: "default" },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/icons/lantern.svg",
    shortcut: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const localHost = host?.startsWith("localhost:") || host?.startsWith("127.0.0.1:");
  const protocol = localHost ? "http" : "https";
  const siteUrl = new URL(host ? `${protocol}://${host}` : siteTargets.production.url);
  const image = {
    url: new URL("/social/x-card.png", siteUrl),
    width: 1200,
    height: 630,
    alt: "星灯りの夜空を背景に並ぶアリア、レオン、ミラと、星灯りの旅団のロゴ",
  };

  return {
    ...sharedMetadata,
    metadataBase: siteUrl,
    openGraph: { ...sharedMetadata.openGraph, url: siteUrl, images: [image] },
    twitter: { ...sharedMetadata.twitter, images: [image] },
  };
}

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
