"use client";
import { useState } from "react";
import { CharacterIconChoices } from "./character-icon-choices";
import { TechniqueIcon } from "./technique-icon";
import { level, type State, type Action } from "@/lib/game";
import {
  techniques,
  techniquesUnlocked,
  knowsTechnique,
  equippedTechnique,
  learnableTechniques,
  type Technique,
  type TechniqueSlot,
} from "@/lib/techniques";
type Props = { state: State; hero: string; ready: boolean; onAction: (action: Action) => boolean };
function TechniqueChoice({
  technique: t,
  notice,
  ...props
}: Props & { technique: Technique; notice: (text: string) => void }) {
  const s = props.state,
    known = knowsTechnique(s, t.id),
    selected = equippedTechnique(s, props.hero, t.slot) === t.id;
  const enoughLevel = level(s.xp[props.hero] || 0) >= t.level;
  function learn() {
    if (props.onAction({ type: "learnTechnique", id: t.id }))
      notice(t.name + "を習得しました。選択中のアイコンをもう一度タップでセットできます。");
  }
  return (
    <article className="character-choice-detail">
      <h4>
        <TechniqueIcon id={t.id} slot={t.slot} />
        {t.name}
      </h4>
      <p>{t.description}</p>
      <small>
        {known ? "習得済み" : `未習得 · 必要 Lv. ${String(t.level)} · ${String(t.cost)} G`}
      </small>
      {!known && !enoughLevel && <small>レベルが足りません</small>}
      {!known && s.gold < t.cost && <small>所持金が足りません</small>}
      {known ? (
        <small>{selected ? "セット中" : "選択中のアイコンをもう一度タップでセット"}</small>
      ) : (
        <button
          aria-label={t.name + "を習得する"}
          disabled={!props.ready || !enoughLevel || s.gold < t.cost}
          onClick={learn}
        >
          習得する
        </button>
      )}
    </article>
  );
}
function TechniqueChoices({
  slot,
  notice,
  ...props
}: Props & { slot: TechniqueSlot; notice: (text: string) => void }) {
  const away = props.state.squads.some((sq) => sq.run && sq.members.includes(props.hero));
  const current = equippedTechnique(props.state, props.hero, slot);
  const [selected, setSelected] = useState(current ?? "empty");
  const choices = techniques.filter((t) => t.hero === props.hero && t.slot === slot);
  const chosen = choices.find((t) => t.id === selected);
  function select(id: string) {
    if (id !== selected) {
      setSelected(id);
      return;
    }
    if (!props.ready || away || id === current) return;
    if (id !== "empty" && !knowsTechnique(props.state, id)) return;
    if (
      props.onAction({
        type: "setTechnique",
        hero: props.hero,
        techniqueSlot: slot,
        id: id === "empty" ? undefined : id,
      })
    )
      notice(id === "empty" ? "技を外しました。" : "技をセットしました。");
  }
  return (
    <section className="character-equipment">
      <h3>
        {slot === "active" ? "アクティブ技" : "パッシブ技"}
        <span>1枠</span>
      </h3>
      <CharacterIconChoices
        label="技の候補"
        emptyLabel="技を外す候補"
        selected={selected}
        onSelect={select}
        choices={choices.map((t) => ({
          id: t.id,
          name: t.name,
          icon: <TechniqueIcon id={t.id} slot={slot} />,
          badge: current === t.id ? "セット中" : undefined,
          muted: !knowsTechnique(props.state, t.id),
        }))}
      />
      {chosen ? (
        <TechniqueChoice {...props} technique={chosen} notice={notice} />
      ) : (
        <div className="character-choice-detail">
          <p>
            {current ? "空のアイコンをもう一度タップで技を外します。" : "技をセットしていません。"}
          </p>
        </div>
      )}
    </section>
  );
}

export function TechniquePanel(props: Props) {
  const [notice, setNotice] = useState({ hero: props.hero, text: "" });
  const [slot, setSlot] = useState<TechniqueSlot | null>(null);
  const showNotice = (text: string) => {
    setNotice({ hero: props.hero, text });
  };
  const away = props.state.squads.some((sq) => sq.run && sq.members.includes(props.hero));
  if (!techniquesUnlocked(props.state) || !techniques.some((t) => t.hero === props.hero))
    return null;
  const candidates = learnableTechniques(props.state).filter((t) => t.hero === props.hero);
  return (
    <section className="character-skill">
      <h3>
        スキル <small>所持金 {Math.floor(props.state.gold).toLocaleString("ja-JP")} G</small>
      </h3>
      {away && <p>冒険中です。技の付け替えは帰還後にできます。</p>}
      {candidates.length > 0 && <p>習得できる技があります。</p>}
      <p role="status">{notice.hero === props.hero ? notice.text : ""}</p>
      <div className="character-slots">
        {(["active", "passive"] as const).map((kind) => {
          const current = techniques.find(
            (t) => t.id === equippedTechnique(props.state, props.hero, kind),
          );
          return (
            <button
              key={kind}
              className="character-slot"
              aria-label={`${kind === "active" ? "アクティブ技" : "パッシブ技"}・${current?.name ?? "セットなし"}・習得・セット`}
              title={current?.name ?? "セットなし"}
              aria-expanded={slot === kind}
              aria-controls="character-technique-options"
              onClick={() => {
                setSlot(slot === kind ? null : kind);
              }}
            >
              <TechniqueIcon id={current?.id} slot={kind} />
              <small>{kind === "active" ? "アクティブ技" : "パッシブ技"}</small>
            </button>
          );
        })}
      </div>
      <div id="character-technique-options">
        {slot && (
          <>
            <p className="technique-help">
              セットすると自動で働きます。帰還中の付け替えは何度でも無料です。
            </p>
            <TechniqueChoices
              key={`${props.hero}-${slot}`}
              {...props}
              slot={slot}
              notice={showNotice}
            />
          </>
        )}
      </div>
    </section>
  );
}
