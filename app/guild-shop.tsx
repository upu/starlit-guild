import { Coins } from "lucide-react";
import { useState } from "react";
import { guildProducts } from "@/lib/guild-content";
import { guildStock } from "@/lib/guild-production";
import { guildUnlocked } from "@/lib/guild-base";
import type { GuildProps } from "./guild-controls";
import { PhaserGuild } from "./phaser-guild";
import { guildShopSpot } from "@/lib/guild-menu-model";
import { GuildItemIcon } from "./guild-item-icon";

export function GuildShop({ state, ready, onAction }: GuildProps) {
  const [notice, setNotice] = useState(""),
    [selected, setSelected] = useState(guildProducts[0].id);
  const item = guildProducts.find((product) => product.id === selected) ?? guildProducts[0];
  if (!guildUnlocked(state)) return null;
  return (
    <section className="guild-shop">
      <div className="shop-wallet">
        <Coins aria-hidden="true" />
        <b>{Math.floor(state.gold).toLocaleString("ja-JP")} G</b>
      </div>
      <GuildCatalog
        state={state}
        selected={selected}
        onSelect={(id) => {
          setSelected(id);
          setNotice("");
        }}
      />
      <div className="guild-purchase">
        <GuildItemIcon id={item.id} />
        <div>
          <b>{item.name}</b>
          <small>所持 {guildStock(state, item.id)}</small>
        </div>
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
                setNotice(`${item.name} ×${String(quantity)}`);
            }}
          >
            <b>×{quantity}</b>
            <small>{item.price * quantity} G</small>
          </button>
        ))}
      </div>
      <p className="guild-purchase-notice" role="status" aria-live="polite">
        {notice}
      </p>
    </section>
  );
}

function GuildCatalog({
  state,
  selected,
  onSelect,
}: {
  state: GuildProps["state"];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="guild-shelf-scene" role="group" aria-label="種と材料の商品一覧">
      <PhaserGuild state={state} now={state.updatedAt} site="shop" selected={selected} />
      {guildProducts.map((product, index) => {
        const point = guildShopSpot(index);
        return (
          <button
            className="guild-scene-choice guild-product-choice"
            key={product.id}
            style={{ left: `${String(point.x * 100)}%`, top: `${String((point.y - 0.22) * 100)}%` }}
            aria-label={product.name}
            aria-pressed={selected === product.id}
            onClick={() => {
              onSelect(product.id);
            }}
          >
            <span>
              <b>{product.name}</b>
              <small>{product.price} G</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
