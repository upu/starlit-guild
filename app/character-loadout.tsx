"use client";
import { useState } from "react";
import { SquareDashed } from "lucide-react";
import { heroes, type State, type Action } from "@/lib/game";
import {
  equipment,
  equipmentById,
  inventoryOf,
  equippedBy,
  availableCopies,
  canEquip,
  shopTier,
  type Equipment,
  type EquipmentSlot,
} from "@/lib/equipment";
import { ShopItemIcon } from "./shop-item-icon";
import { CharacterIconChoices } from "./character-icon-choices";
import { ConsumableSlot } from "./consumable-panels";
type Props = { state: State; ready: boolean; onAction: (action: Action) => boolean };
const statLabels = ["採取", "護衛", "討伐"];
const heroName = (id: string) => heroes.find((hero) => hero.id === id)?.name ?? id;
function EquipmentChoice({
  item,
  hero,
  slot,
  ...props
}: Props & { item: Equipment; hero: string; slot: EquipmentSlot }) {
  const current = equipmentById(inventoryOf(props.state).equipped[hero]?.[slot] ?? "");
  const worn = current?.id === item.id,
    available = availableCopies(props.state, item.id);
  return (
    <article className="character-choice-detail">
      <ShopItemIcon item={item} />
      <span>
        <b>{item.name}</b>
        <span className="equipment-comparison">
          {item.bonus.map((value, index) => {
            const delta = value - (current?.bonus[index] ?? 0);
            return (
              <span key={index}>
                {statLabels[index]} {delta > 0 ? "+" : ""}
                {delta}
              </span>
            );
          })}
        </span>
      </span>
      <p>{item.description}</p>
      <small>
        {worn
          ? "装備中"
          : available > 0
            ? "選択中のアイコンをもう一度タップで装備"
            : equippedBy(props.state, item.id).map(heroName).join("・") + "が装備中"}
      </small>
    </article>
  );
}
export function EquipmentSlotPanel({
  hero,
  slot,
  ...props
}: Props & { hero: string; slot: EquipmentSlot }) {
  const inventory = inventoryOf(props.state),
    current = equipmentById(inventory.equipped[hero]?.[slot] ?? ""),
    choices = equipment.filter(
      (item) => item.slot === slot && canEquip(item, hero) && (inventory.items[item.id] ?? 0) > 0,
    );
  const [selected, setSelected] = useState(current?.id ?? "empty");
  const item = choices.find((candidate) => candidate.id === selected);
  function select(id: string) {
    if (id !== selected) {
      setSelected(id);
      return;
    }
    if (!props.ready) return;
    if (id === "empty") {
      if (current) props.onAction({ type: "equip", hero, slot });
      return;
    }
    if (id !== current?.id && availableCopies(props.state, id) > 0)
      props.onAction({ type: "equip", hero, slot, id });
  }
  return (
    <section className="character-equipment">
      <h3>{slot === "weapon" ? "武器の付け替え" : "防具の付け替え"}</h3>
      <CharacterIconChoices
        label="装備の候補"
        emptyLabel="装備を外す"
        selected={selected}
        onSelect={select}
        choices={choices.map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          icon: <ShopItemIcon item={candidate} />,
          badge: current?.id === candidate.id ? "装備中" : undefined,
        }))}
      />
      {item ? (
        <EquipmentChoice {...props} item={item} hero={hero} slot={slot} />
      ) : (
        <div className="character-choice-detail">
          <p>
            {current ? "空のアイコンをもう一度タップで装備を外します。" : "何も装備していません。"}
          </p>
        </div>
      )}
      {choices.length === 0 && <p>装備できる品はまだありません。</p>}
    </section>
  );
}

export function CharacterEquipment(
  props: Props & {
    hero: string;
    slot: string | null;
    onSlot: (slot: EquipmentSlot | "consumable" | null) => void;
  },
) {
  const slot = props.slot;
  const inventory = inventoryOf(props.state);
  return (
    <section className="character-loadout" aria-label="装備">
      <div className="character-slots">
        {(["weapon", "armor"] as const).map((kind) => {
          const item = equipmentById(inventory.equipped[props.hero]?.[kind] ?? "");
          const label = kind === "weapon" ? "武器" : "防具";
          return (
            <button
              key={kind}
              className="character-slot"
              aria-label={`${label}・${item?.name ?? "装備なし"}・付け替える`}
              title={item?.name ?? "装備なし"}
              aria-expanded={slot === kind}
              aria-controls="character-options"
              onClick={() => {
                props.onSlot(slot === kind ? null : kind);
              }}
            >
              <small>{label}</small>
              {item ? (
                <ShopItemIcon item={item} />
              ) : (
                <SquareDashed className="empty-slot-icon" aria-hidden="true" />
              )}
              <b>{item?.name ?? `${label}なし`}</b>
            </button>
          );
        })}
        {shopTier(props.state) > 0 && (
          <ConsumableSlot
            state={props.state}
            hero={props.hero}
            expanded={slot === "consumable"}
            onClick={() => {
              props.onSlot(slot === "consumable" ? null : "consumable");
            }}
          />
        )}
      </div>
    </section>
  );
}
