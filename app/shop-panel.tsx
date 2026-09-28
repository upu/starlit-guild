"use client";
import { useState } from "react";
import { Coins } from "lucide-react";
import { heroes, type State, type Action } from "@/lib/game";
import {
  inventoryOf,
  shopItems,
  shopTier,
  type Equipment,
  type EquipmentSlot,
} from "@/lib/equipment";
import { shopConsumables, consumableStock, type ShopConsumable } from "@/lib/consumables";
import { ConsumableShopDetail } from "./consumable-shop-detail";
import { Bonuses } from "./equipment-panels";
import { ShopItemIcon } from "./shop-item-icon";

type Props = { state: State; ready: boolean; onAction: (action: Action) => boolean };
type Filter = EquipmentSlot | "consumable";
type Product = Equipment | ShopConsumable;
const stockOf = (s: State, item: Product) =>
  "effect" in item ? consumableStock(s, item.id) : (inventoryOf(s).items[item.id] ?? 0);
const amount = (value: number) => Math.floor(value).toLocaleString("ja-JP");
const filters = [
  { id: "weapon", label: "武器" },
  { id: "armor", label: "防具" },
  { id: "consumable", label: "アイテム" },
] as const;

function ShopDetail({
  item,
  state,
  ready,
  onAction,
  onBought,
}: Props & {
  item: Equipment;
  onBought: (name: string) => void;
}) {
  const owned = stockOf(state, item);
  const shortage = Math.max(0, item.price - state.gold);
  const wearers = item.heroes
    ?.map((id) => heroes.find((hero) => hero.id === id)?.name ?? id)
    .join("・");
  return (
    <section className="shop-detail" aria-labelledby="shop-detail-name" id="shop-detail">
      <div className="shop-detail-scroll">
        <div className="shop-detail-heading">
          <ShopItemIcon item={item} />
          <div>
            <h3 id="shop-detail-name">{item.name}</h3>
            <span>
              {wearers ? `${wearers}用` : "だれでも装備可"} · 所持 {owned}
            </span>
          </div>
        </div>
        <p>{item.description}</p>
        <Bonuses item={item} />
      </div>
      <div className="shop-purchase">
        <div>
          <b>{amount(item.price)} G</b>
          <small>
            {owned >= 9999
              ? "所持上限です"
              : shortage > 0
                ? `あと ${amount(shortage)} G`
                : "購入後はキャラクター画面で装備"}
          </small>
        </div>
        <button
          disabled={!ready || shortage > 0 || owned >= 9999}
          aria-label={`${item.name}を${String(item.price)} Gで購入`}
          onClick={() => {
            if (onAction({ type: "buy", id: item.id })) onBought(item.name);
          }}
        >
          購入
        </button>
      </div>
    </section>
  );
}

function ShopGrid({
  items,
  selected,
  state,
  onSelect,
}: {
  items: Product[];
  selected?: Product;
  state: State;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="shop-grid-scroll" role="group" aria-label="商品一覧">
      <div className="shop-grid">
        {items.map((item) => (
          <button
            key={item.id}
            className="shop-slot"
            aria-label={`${item.name}・${amount(item.price)} G・所持 ${String(stockOf(state, item))}`}
            aria-pressed={selected?.id === item.id}
            aria-controls="shop-detail"
            title={item.name}
            onClick={() => {
              onSelect(item.id);
            }}
          >
            <ShopItemIcon item={item} />
            <span className="shop-owned" aria-hidden="true">
              {stockOf(state, item)}
            </span>
          </button>
        ))}
      </div>
      {items.length === 0 && <p>この種類の商品はまだありません。</p>}
    </div>
  );
}

function ShopFilters({ filter, onChange }: { filter: Filter; onChange: (id: Filter) => void }) {
  return (
    <div className="shop-filters" role="group" aria-label="商品の種類">
      {filters.map(({ id, label }) => (
        <button
          key={id}
          aria-pressed={filter === id}
          onClick={() => {
            onChange(id);
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function ShopPanel(props: Props) {
  const [filter, setFilter] = useState<Filter>("weapon");
  const [selectedId, setSelectedId] = useState("");
  const [purchase, setPurchase] = useState({ name: "", count: 0 });
  const items =
    filter === "consumable"
      ? shopConsumables(props.state)
      : shopItems(props.state).filter((item) => item.slot === filter);
  const selected = items.find((item) => item.id === selectedId) ?? items.at(0);
  const unlocked = shopTier(props.state) > 0;
  return (
    <div className="shop-panel">
      <div className="shop-wallet">
        <Coins aria-hidden="true" />
        <span>所持金</span>
        <b>{amount(props.state.gold)} G</b>
      </div>
      {unlocked ? (
        <>
          <ShopFilters
            filter={filter}
            onChange={(id) => {
              setFilter(id);
              setSelectedId("");
            }}
          />
          <ShopGrid
            key={filter}
            items={items}
            selected={selected}
            state={props.state}
            onSelect={setSelectedId}
          />
          {selected && (
            <ProductDetail
              {...props}
              item={selected}
              onBought={(name) => {
                setPurchase((previous) => ({ name, count: previous.count + 1 }));
              }}
            />
          )}
        </>
      ) : (
        <p>街の配達仕事を終えると、お店を利用できます。</p>
      )}
      {unlocked && (
        <p className="purchase-notice" role="status" aria-atomic="true">
          <span key={purchase.count}>
            {purchase.name
              ? `${purchase.name}をバッグに入れました。`
              : "アイコンを選ぶと詳細を確認できます。"}
          </span>
        </p>
      )}
    </div>
  );
}

function ProductDetail(props: Props & { item: Product; onBought: (name: string) => void }) {
  return "effect" in props.item ? (
    <ConsumableShopDetail {...props} item={props.item} />
  ) : (
    <ShopDetail {...props} item={props.item} />
  );
}
