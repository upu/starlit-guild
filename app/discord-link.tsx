"use client";
import { createContext, useContext } from "react";
import { ExternalLink, MessagesSquare } from "lucide-react";
import "./discord-link.css";

export const DiscordInviteContext = createContext<string | null>(null);

export function DiscordLink() {
  const href = useContext(DiscordInviteContext);
  if (!href) return null;
  return (
    <a
      className="discord-link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Discordコミュニティ（新しいタブで開きます）"
    >
      <MessagesSquare size={18} aria-hidden="true" />
      <span>Discordコミュニティ</span>
      <ExternalLink size={14} aria-hidden="true" />
    </a>
  );
}

export function DiscordCommunity() {
  const href = useContext(DiscordInviteContext);
  if (!href) return null;
  return (
    <section className="discord-community" aria-label="コミュニティ">
      <p>旅の感想や仲間との交流、不具合・要望はこちらへ。</p>
      <DiscordLink />
      <small>Discordを新しいタブで開きます。</small>
    </section>
  );
}
