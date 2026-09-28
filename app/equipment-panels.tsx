"use client";
import { useState } from "react";
import { CharacterEquipment, EquipmentSlotPanel } from "./character-loadout";
import { ConsumableBag, ConsumableDetails } from "./consumable-panels";
import Image from "next/image";
import { Coins, Gem, Shield, Swords, Package, X } from "lucide-react";
import { heroes, memberStats, memberMaxHp, heroSkills, type State, type Action } from "@/lib/game";
import {
  equipment,
  inventoryOf,
  equippedBy,
  availableCopies,
  type Equipment,
  type EquipmentSlot,
} from "@/lib/equipment";
import { storyItems } from "@/lib/story-items";
import {
  techniquesUnlocked,
  equippedTechnique,
  techniques,
  type TechniqueSlot,
} from "@/lib/techniques";
import { TechniquePanel, TechniqueDetails } from "./technique-panel";
import { TechniqueIcon } from "./technique-icon";
import { Portrait } from "./portrait";
import { CharacterLevel } from "./character-level";
import { useCharacterSwipe } from "./use-character-swipe";

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
      <ConsumableBag state={s} />
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
function FixedTechnique({ state, hero }: { state: State; hero: string }) {
  return (
    <section className="character-skill">
      <div className="character-slot character-slot-fixed" aria-label="アクティブスキル・変更不可">
        <small>アクティブ</small>
        <TechniqueIcon id={equippedTechnique(state, hero, "active") ?? hero} slot="active" />
        <b>{heroSkills[hero].name}</b>
      </div>
      <p>{heroSkills[hero].description}</p>
    </section>
  );
}
function CharacterHeading({ state, hero }: { state: State; hero: (typeof heroes)[number] }) {
  const hp = state.squads.find((squad) => squad.members.includes(hero.id))?.run?.health[hero.id];
  return (
    <div className="character-heading">
      <Portrait index={hero.sprite} size={56} />
      <div>
        <h2>{hero.name}</h2>
        <p>{hero.job}</p>
        <CharacterLevel xp={state.xp[hero.id] ?? 0} />
        <p>
          {hp
            ? `HP ${String(Math.ceil(hp.hp))} / ${String(hp.maxHp)}`
            : `最大HP ${String(memberMaxHp(state, hero.id))}`}
        </p>
      </div>
    </div>
  );
}
export function CharacterPanel(props: Props) {
  const [slot, setSlot] = useState<EquipmentSlot | TechniqueSlot | "consumable" | null>(null);
  const [selected, setSelected] = useState("aria"),
    roster = heroes.filter((hero) => props.state.owned.includes(hero.id)),
    hero = roster.find((hero) => hero.id === selected) ?? roster[0];
  const swipe = useCharacterSwipe(
    roster.map((member) => member.id),
    hero.id,
    slot !== null,
    setSelected,
  );
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
      <div className="character-scroll" {...swipe}>
        <CharacterHeading state={props.state} hero={hero} />
        <details className="character-bio" key={hero.id}>
          <summary>キャラクター詳細</summary>
          <p>{hero.bio}</p>
        </details>
        <StatRow values={memberStats(props.state, hero.id)} />
        <CharacterEquipment {...props} hero={hero.id} slot={slot} onSlot={setSlot} />
        {(!techniquesUnlocked(props.state) || !["aria", "leon"].includes(hero.id)) && (
          <FixedTechnique state={props.state} hero={hero.id} />
        )}
        <TechniquePanel {...props} hero={hero.id} slot={slot} onSlot={setSlot} />
      </div>
      <CharacterDetails
        {...props}
        hero={hero.id}
        slot={slot}
        onClose={() => {
          setSlot(null);
        }}
      />
    </div>
  );
}

function CharacterDetails(
  props: Props & {
    hero: string;
    slot: EquipmentSlot | TechniqueSlot | "consumable" | null;
    onClose: () => void;
  },
) {
  const { slot, hero } = props;
  if (!slot) return null;
  const equipmentSlot = slot === "weapon" || slot === "armor";
  if (
    !equipmentSlot &&
    slot !== "consumable" &&
    (!techniquesUnlocked(props.state) ||
      !techniques.some((t) => t.hero === hero && t.slot === slot))
  )
    return null;
  return (
    <section className="character-bottom" id="character-options" aria-label="付け替え候補">
      <button
        className="character-bottom-close"
        aria-label="閉じる"
        title="閉じる"
        onClick={props.onClose}
      >
        <X aria-hidden="true" />
      </button>
      <div className="character-bottom-scroll" key={hero + slot}>
        {equipmentSlot ? (
          <EquipmentSlotPanel {...props} slot={slot} />
        ) : slot === "consumable" ? (
          <ConsumableDetails {...props} />
        ) : (
          <TechniqueDetails {...props} slot={slot} />
        )}
      </div>
    </section>
  );
}
