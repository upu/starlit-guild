import { useState } from "react";
import { guildProducts, guildMaterials } from "@/lib/guild-content";
import { guildStock } from "@/lib/guild-production";
import { guildUnlocked } from "@/lib/guild-base";
import type { GuildProps } from "./guild-controls";

export function GuildShop({ state, ready, onAction }: GuildProps) {
  const [notice, setNotice] = useState("");
  if (!guildUnlocked(state)) return null;
  return (
    <section className="guild-section guild-supplies">
      <h3>種と材料のお店</h3>
      <p>所持金 {Math.floor(state.gold).toLocaleString("ja-JP")} G</p>
      <div role="status" aria-live="polite">
        {notice}
      </div>
      {guildProducts.map((item) => (
        <div className="guild-product" key={item.id}>
          <div>
            <b>{item.name}</b>
            <p>
              {item.price} G · 在庫{guildStock(state, item.id)}
            </p>
          </div>
          <div className="guild-inline">
            {[1, 10].map((quantity) => (
              <button
                key={quantity}
                disabled={
                  !ready ||
                  state.gold < item.price * quantity ||
                  guildStock(state, item.id) + quantity > 9999
                }
                aria-label={`${item.name}を${String(quantity)}個購入`}
                onClick={() => {
                  if (onAction({ type: "guildBuy", id: item.id, quantity }))
                    setNotice(`${item.name}を${String(quantity)}個購入しました。`);
                }}
              >
                {quantity}個 · {item.price * quantity} G
              </button>
            ))}
          </div>
        </div>
      ))}
      <h3>収穫物の在庫</h3>
      <p>薬草：{guildStock(state, "herbs")}個（バッグと共通）</p>
      {guildMaterials
        .filter((item) => !("price" in item))
        .map((item) => (
          <p key={item.id}>
            {item.name}：{guildStock(state, item.id)}個
          </p>
        ))}
    </section>
  );
}
