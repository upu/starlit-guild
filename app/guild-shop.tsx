import { Coins } from "lucide-react";
import { useState } from "react";
import { guildProducts, guildMaterialName } from "@/lib/guild-content";
import { guildStock } from "@/lib/guild-production";
import { guildUnlocked } from "@/lib/guild-base";
import type { GuildProps } from "./guild-controls";
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
      <div className="guild-stock-row" aria-label="収穫物の在庫">
        {["herbs", "carrot", "dried-moss"].map((id) => (
          <span key={id} title={guildMaterialName(id)}>
            <GuildItemIcon id={id} />
            <b>{guildStock(state, id)}</b>
          </span>
        ))}
      </div>
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
    <div className="guild-catalog" role="group" aria-label="種と材料の商品一覧">
      {guildProducts.map((product) => (
        <button
          className="guild-item-tile"
          key={product.id}
          aria-label={product.name}
          aria-pressed={selected === product.id}
          onClick={() => {
            onSelect(product.id);
          }}
        >
          <GuildItemIcon id={product.id} />
          <b>{product.name}</b>
          <small>{product.price} G</small>
          <span className="guild-stock">{guildStock(state, product.id)}</span>
        </button>
      ))}
    </div>
  );
}
