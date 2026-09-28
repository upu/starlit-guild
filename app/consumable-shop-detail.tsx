"use client";
import type { State, Action } from "@/lib/game";
import { consumableStock, type Consumable } from "@/lib/consumables";
import { ShopItemIcon } from "./shop-item-icon";

export function ConsumableShopDetail({
  item,
  state,
  ready,
  onAction,
  onBought,
}: {
  item: Consumable;
  state: State;
  ready: boolean;
  onAction: (action: Action) => boolean;
  onBought: (name: string) => void;
}) {
  const stock = consumableStock(state, item.id);
  return (
    <section className="shop-detail" aria-labelledby="shop-detail-name" id="shop-detail">
      <div className="shop-detail-scroll">
        <div className="shop-detail-heading">
          <ShopItemIcon item={item} />
          <div>
            <h3 id="shop-detail-name">{item.name}</h3>
            <span>
              共有在庫 {stock}個 · {item.effect.timing === "pinch" ? "ピンチ時" : "出発時"}
              に自動使用
            </span>
          </div>
        </div>
        <p>{item.description}</p>
        <p>購入後はキャラクター画面の「アイテム」に登録。</p>
      </div>
      <div className="shop-purchase consumable-purchase">
        {[1, 10].map((quantity) => (
          <button
            key={quantity}
            aria-label={`${item.name}を${String(quantity)}個 ${String(item.price * quantity)} Gで購入`}
            disabled={!ready || state.gold < item.price * quantity || stock + quantity > 9999}
            onClick={() => {
              if (onAction({ type: "buyConsumable", id: item.id, quantity }))
                onBought(`${item.name} ×${String(quantity)}`);
            }}
          >
            {quantity}個 · {item.price * quantity} G
          </button>
        ))}
        <small>
          {stock >= 9999
            ? "所持上限です"
            : state.gold < item.price
              ? `あと ${String(Math.ceil(item.price - state.gold))} G`
              : `1個 ${String(item.price)} G`}
        </small>
      </div>
    </section>
  );
}
