"use client";
import { useState } from "react";
import { SquareDashed } from "lucide-react";
import { type State, type Action, heroes } from "@/lib/game";
import {
  assignedConsumable,
  consumables,
  consumableStock,
  shopConsumables,
  type Consumable,
} from "@/lib/consumables";
import { CharacterIconChoices } from "./character-icon-choices";
import { ShopItemIcon } from "./shop-item-icon";

type Props = { state: State; ready: boolean; onAction: (action: Action) => boolean; hero: string };
export function ConsumableSlot({
  state,
  hero,
  expanded,
  onClick,
}: {
  state: State;
  hero: string;
  expanded: boolean;
  onClick: () => void;
}) {
  const item = assignedConsumable(state, hero);
  const stock = item ? consumableStock(state, item.id) : 0;
  const count = stock ? `共有 ${String(stock)}個` : "在庫なし";
  const active = state.squads.some((sq) => sq.run?.consumableEffects?.[hero]);
  return (
    <button
      className="character-slot"
      aria-label={`アイテム・${item?.name ?? "登録なし"}${item ? `・${count}` : ""}・付け替える`}
      aria-expanded={expanded}
      aria-controls="character-options"
      onClick={onClick}
    >
      <small>アイテム</small>
      {item ? (
        <ShopItemIcon item={item} />
      ) : (
        <SquareDashed className="empty-slot-icon" aria-hidden="true" />
      )}
      <span>
        <b>{item?.name ?? "登録なし"}</b>
        {item && <small>{count}</small>}
        {active && <small>この周回：経験値 +10%</small>}
      </span>
    </button>
  );
}
function ConsumableChoice({
  item,
  current,
  state,
}: {
  item?: Consumable;
  current?: string;
  state: State;
}) {
  if (!item) return <p>空のアイコンをもう一度タップで登録を外します。</p>;
  return (
    <>
      <ShopItemIcon item={item} />
      <b>{item.name}</b>
      <p>{item.description}</p>
      <small>
        共有在庫 {consumableStock(state, item.id)}個 ·{" "}
        {current === item.id ? "登録中" : "もう一度タップで登録"}
      </small>
      <small>
        {item.effect.timing === "departure"
          ? "変更は次の出発から。使用済みの効果はこの周回が終わるまで続きます。"
          : "変更は次の被弾から反映されます。"}
      </small>
    </>
  );
}
export function ConsumableDetails(props: Props) {
  const current = assignedConsumable(props.state, props.hero);
  const [selected, setSelected] = useState(current?.id ?? "empty");
  const [notice, setNotice] = useState("");
  const choices = shopConsumables(props.state);
  const item = choices.find((item) => item.id === selected);
  function select(id: string) {
    if (id !== selected) {
      setSelected(id);
      return;
    }
    if (!props.ready) return;
    if (
      props.onAction({
        type: "assignConsumable",
        hero: props.hero,
        id: id === "empty" ? undefined : id,
      })
    )
      setNotice(id === "empty" ? "アイテムを外しました。" : "アイテムを登録しました。");
  }
  return (
    <section className="character-equipment">
      <h3>アイテムの付け替え</h3>
      <CharacterIconChoices
        label="アイテムの候補"
        emptyLabel="アイテムを外す"
        selected={selected}
        onSelect={select}
        choices={choices.map((item) => ({
          id: item.id,
          name: item.name,
          icon: <ShopItemIcon item={item} />,
          badge: current?.id === item.id ? "登録中" : undefined,
        }))}
      />
      <div className="character-choice-detail">
        <ConsumableChoice item={item} current={current?.id} state={props.state} />
        <small>在庫は全員で共有。なくなっても登録は残り、補充すると自動使用を再開します。</small>
      </div>
      <p role="status">{notice}</p>
    </section>
  );
}
export function ConsumableBag({ state }: { state: State }) {
  const items = consumables.filter(
    (item) =>
      consumableStock(state, item.id) > 0 ||
      Object.values(state.consumables?.assigned ?? {}).includes(item.id),
  );
  return (
    <section className="bag-section">
      <h3>アイテム</h3>
      {items.length === 0 ? (
        <p>お店で購入すると、キャラクターのアイテムに登録できます。</p>
      ) : (
        <div className="bag-items">
          {items.map((item) => (
            <article key={item.id}>
              <ShopItemIcon item={item} />
              <div>
                <h4>
                  {item.name}
                  <span>×{consumableStock(state, item.id)}</span>
                </h4>
                <p>{item.description}</p>
                <small>
                  共有在庫 ·{" "}
                  {heroes
                    .filter((hero) => state.consumables?.assigned[hero.id] === item.id)
                    .map((hero) => hero.name)
                    .join("・") || "登録なし"}
                </small>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
