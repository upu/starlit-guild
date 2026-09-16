"use client";
import { useState } from "react";
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
  const away = s.squads.some((sq) => sq.run && sq.members.includes(props.hero)),
    enoughLevel = level(s.xp[props.hero] || 0) >= t.level;
  function choose() {
    if (known) {
      if (
        props.onAction({ type: "setTechnique", hero: props.hero, techniqueSlot: t.slot, id: t.id })
      )
        notice(t.name + "をセットしました。");
    } else if (props.onAction({ type: "learnTechnique", id: t.id }))
      notice(t.name + "を習得しました。「セットする」で使い始められます。");
  }
  return (
    <article className="shop-item">
      <h4>{t.name}</h4>
      <p>{t.description}</p>
      <small>{known ? "習得済み" : `必要 Lv. ${String(t.level)} · ${String(t.cost)} G`}</small>
      <button
        disabled={!props.ready || selected || (known ? away : !enoughLevel || s.gold < t.cost)}
        onClick={choose}
      >
        {selected ? "セット中" : known ? "セットする" : "習得する"}
      </button>
    </article>
  );
}
function TechniqueChoices({
  slot,
  notice,
  ...props
}: Props & { slot: TechniqueSlot; notice: (text: string) => void }) {
  const away = props.state.squads.some((sq) => sq.run && sq.members.includes(props.hero));
  return (
    <section className="character-equipment">
      <h3>
        {slot === "active" ? "自動で使う技" : "常に働く技"}
        <span>1枠</span>
      </h3>
      <div className="equipment-choices">
        {techniques
          .filter((t) => t.hero === props.hero && t.slot === slot)
          .map((t) => (
            <TechniqueChoice key={t.id} {...props} technique={t} notice={notice} />
          ))}
        {equippedTechnique(props.state, props.hero, slot) && (
          <button
            className="outline"
            disabled={!props.ready || away}
            onClick={() => {
              if (props.onAction({ type: "setTechnique", hero: props.hero, techniqueSlot: slot }))
                notice("技を外しました。習得済みの技は無料でセットできます。");
            }}
          >
            技を外す
          </button>
        )}
      </div>
    </section>
  );
}
export function TechniquePanel(props: Props) {
  const [notice, setNotice] = useState("");
  if (!techniquesUnlocked(props.state) || !techniques.some((t) => t.hero === props.hero))
    return null;
  const candidates = learnableTechniques(props.state).filter((t) => t.hero === props.hero);
  return (
    <section className="character-skill">
      <h3>技の習得・セット</h3>
      <p>所持金 {Math.floor(props.state.gold).toLocaleString("ja-JP")} G</p>
      <p>技はセットすると自動で働きます。付け替えは帰還中に、何度でも無料でできます。</p>
      {candidates.length > 0 && <p>習得できる技があります。</p>}
      <p role="status">{notice}</p>
      <TechniqueChoices {...props} slot="active" notice={setNotice} />
      <TechniqueChoices {...props} slot="passive" notice={setNotice} />
    </section>
  );
}
