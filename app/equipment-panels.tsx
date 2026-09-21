"use client";
import { useState } from "react";
import { CharacterIconChoices } from "./character-icon-choices";
import Image from "next/image";
import { Coins, Leaf, Gem, Shield, Swords, Package, SquareDashed } from "lucide-react";
import {
  heroes,
  memberStats,
  memberMaxHp,
  heroSkills,
  level,
  type State,
  type Action,
} from "@/lib/game";
import {
  equipment,
  equipmentById,
  inventoryOf,
  equippedBy,
  availableCopies,
  canEquip,
  type Equipment,
  type EquipmentSlot,
} from "@/lib/equipment";
import { storyItems } from "@/lib/story-items";
import { techniquesUnlocked } from "@/lib/techniques";
import { TechniquePanel } from "./technique-panel";
import { ShopItemIcon } from "./shop-item-icon";
import { TechniqueIcon } from "./technique-icon";
import { Portrait } from "./portrait";

type Props = { state: State; ready: boolean; onAction: (action: Action) => boolean };
const amount = (value: number) => Math.floor(value).toLocaleString("ja-JP");
const heroName = (id: string) => heroes.find((hero) => hero.id === id)?.name ?? id;
const statLabels = ["採取", "護衛", "討伐"];
export function Bonuses({ item }: { item: Equipment }) {
  return (
    <span className="equipment-bonuses">
      {item.bonus.map((value, index) =>
        value > 0 ? (
          <span key={index}>
            {statLabels[index]} +{value}
          </span>
        ) : null,
      )}
    </span>
  );
}
function EquipmentIcon({ item }: { item: Equipment }) {
  return item.slot === "weapon" ? <Swords aria-hidden="true" /> : <Shield aria-hidden="true" />;
}
export function ResourcesGrid({ state: s }: { state: State }) {
  return (
    <div className="inventory-grid">
      {[
        [Coins, s.gold, "お金"],
        [Leaf, s.herbs, "薬草"],
        [Gem, s.ore, "鉱石"],
      ].map(([Icon, value, label]) => {
        const I = Icon as typeof Coins;
        return (
          <div key={String(label)}>
            <I />
            <span>{String(label)}</span>
            <b>{amount(value as number)}</b>
          </div>
        );
      })}
    </div>
  );
}
function EquipmentBag({ state: s }: { state: State }) {
  const inventory = inventoryOf(s);
  return (
    <section className="bag-section">
      <h3>装備品</h3>
      <div className="bag-items">
        {equipment
          .filter((item) => (inventory.items[item.id] ?? 0) > 0)
          .map((item) => (
            <article key={item.id}>
              <EquipmentIcon item={item} />
              <div>
                <h4>
                  {item.name}
                  <span>×{inventory.items[item.id]}</span>
                </h4>
                <p>{item.description}</p>
                <Bonuses item={item} />
                <small>
                  バッグ内 {availableCopies(s, item.id)}
                  {equippedBy(s, item.id).length > 0 &&
                    ` · ${equippedBy(s, item.id).map(heroName).join("・")}が装備中`}
                </small>
              </div>
            </article>
          ))}
      </div>
    </section>
  );
}
export function InventoryPanel({ state: s }: { state: State }) {
  const important = storyItems(s);
  return (
    <div className="bag-content">
      <ResourcesGrid state={s} />
      <EquipmentBag state={s} />
      <section className="bag-section">
        <h3>大事なもの・預かり品</h3>
        {important.length === 0 ? (
          <p>今は預かっている品はありません。</p>
        ) : (
          <div className="bag-items">
            {important.map((item) => (
              <article key={item.id}>
                {item.image ? (
                  <Image src={item.image} width={56} height={56} alt="" unoptimized />
                ) : (
                  <Package aria-hidden="true" />
                )}
                <div>
                  <h4>{item.name}</h4>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
function StatRow({ values }: { values: number[] }) {
  return (
    <div className="character-stats">
      {values.map((value, index) => (
        <span key={index}>
          {statLabels[index]}
          <b>{value}</b>
        </span>
      ))}
    </div>
  );
}
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
function EquipmentSlotPanel({
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

function CharacterEquipment(props: Props & { hero: string }) {
  const [slot, setSlot] = useState<EquipmentSlot | null>(null);
  const inventory = inventoryOf(props.state);
  return (
    <section className="character-loadout" aria-label="装備">
      <h3>装備</h3>
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
              aria-controls="character-equipment-options"
              onClick={() => {
                setSlot(slot === kind ? null : kind);
              }}
            >
              {item ? (
                <ShopItemIcon item={item} />
              ) : (
                <SquareDashed className="empty-slot-icon" aria-hidden="true" />
              )}
              <small>{item?.name ?? `${label}なし`}</small>
            </button>
          );
        })}
      </div>
      <div id="character-equipment-options">
        {slot && <EquipmentSlotPanel key={`${props.hero}-${slot}`} {...props} slot={slot} />}
      </div>
    </section>
  );
}
export function CharacterPanel(props: Props) {
  const [selected, setSelected] = useState("aria"),
    roster = heroes.filter((hero) => props.state.owned.includes(hero.id)),
    hero = roster.find((hero) => hero.id === selected) ?? roster[0];
  const hp = props.state.squads.find((squad) => squad.members.includes(hero.id))?.run?.health[
    hero.id
  ];
  return (
    <div className="character-panel">
      <div className="character-picker" aria-label="キャラクターを選ぶ">
        {roster.map((member) => (
          <button
            key={member.id}
            aria-pressed={hero.id === member.id}
            aria-label={member.name}
            title={member.name}
            onClick={() => {
              setSelected(member.id);
            }}
          >
            <Portrait index={member.sprite} size={40} />
          </button>
        ))}
      </div>
      <div className="character-scroll">
        <div className="character-heading">
          <Portrait index={hero.sprite} size={56} />
          <div>
            <h2>{hero.name}</h2>
            <p>{hero.job}</p>
            <span>Lv. {level(props.state.xp[hero.id] ?? 0)}</span>
            <p>
              {hp
                ? `HP ${String(Math.ceil(hp.hp))} / ${String(hp.maxHp)}`
                : `最大HP ${String(memberMaxHp(props.state, hero.id))}`}
            </p>
          </div>
        </div>
        <details className="character-bio" key={hero.id}>
          <summary>キャラクター詳細</summary>
          <p>{hero.bio}</p>
        </details>
        <StatRow values={memberStats(props.state, hero.id)} />
        <CharacterEquipment {...props} hero={hero.id} />
        {(!techniquesUnlocked(props.state) || !["aria", "leon"].includes(hero.id)) && (
          <section className="character-skill">
            <h3 className="character-innate">
              <TechniqueIcon id={hero.id} slot="active" />
              {heroSkills[hero.id].name}
            </h3>
            <p>{heroSkills[hero.id].description}</p>
          </section>
        )}
        <TechniquePanel {...props} hero={hero.id} />
      </div>
    </div>
  );
}
