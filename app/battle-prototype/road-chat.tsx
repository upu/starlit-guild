"use client";
import { useEffect, useRef } from "react";
import { roadChat } from "@/lib/scrolling-banter";
import { expressionPortrait } from "@/lib/portrait-expressions";

function ChatLine({ line }: { line: ReturnType<typeof roadChat>[number] }) {
  const aria = line.speaker === "aria";
  const portrait = expressionPortrait(aria ? 0 : 1, line.expression);
  return (
    <li className={`road-chat-line ${aria ? "is-aria" : "is-leon"}`}>
      <span
        className="road-portrait"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${portrait?.src || ""})`,
          backgroundSize: portrait?.size,
          backgroundPosition: portrait?.position,
        }}
      />
      <div>
        <span className="road-speaker">{aria ? "アリア" : "レオン"}</span>
        <p>{line.text}</p>
      </div>
    </li>
  );
}

export function RoadChat({ time }: { time: number }) {
  const lines = roadChat(time);
  const lastId = lines.at(-1)?.id;
  const list = useRef<HTMLOListElement>(null);
  const following = useRef(true);
  useEffect(() => {
    if (list.current && following.current) list.current.scrollTop = list.current.scrollHeight;
  }, [lastId]);
  return (
    <section className="road-chat" aria-label="道中の掛け合い">
      <div className="road-chat-title">
        <h2>道中のふたり</h2>
        <span>冒険は会話中も進みます</span>
      </div>
      <ol
        ref={list}
        tabIndex={0}
        aria-label="掛け合いの履歴"
        onScroll={() => {
          const el = list.current;
          if (el) following.current = el.scrollHeight - el.scrollTop - el.clientHeight < 28;
        }}
      >
        {lines.map((line) => (
          <ChatLine key={line.id} line={line} />
        ))}
      </ol>
    </section>
  );
}
