"use client";
import { travellerNames, type Loadout, type RoadBattle } from "@/lib/scrolling-battle";

export function RoadLoadout({
  state,
  equip,
}: {
  state: RoadBattle;
  equip: (value: Loadout) => void;
}) {
  return (
    <details className="road-loadout">
      <summary>
        技の付け替え <span>すべて自動で発動</span>
      </summary>
      <div className="road-loadout-grid">
        <label>
          アリア
          <select
            aria-label="アリアの技"
            value={state.loadout.aria}
            onChange={(event) => {
              equip({
                ...state.loadout,
                aria: event.target.value === "rapid" ? "rapid" : "pierce",
              });
            }}
          >
            <option value="pierce">貫く矢 · 3回ごとに複数の敵へ</option>
            <option value="rapid">速射 · 単体を素早く攻撃</option>
          </select>
        </label>
        <label>
          レオン
          <select
            aria-label="レオンの技"
            value={state.loadout.leon}
            onChange={(event) => {
              equip({ ...state.loadout, leon: event.target.value === "guard" ? "guard" : "sweep" });
            }}
          >
            <option value="sweep">薙ぎ払い · 3回ごとに周囲へ</option>
            <option value="guard">守りの構え · 自分の被害を半減</option>
          </select>
        </label>
      </div>
    </details>
  );
}

export function RoadHealth({ state }: { state: RoadBattle }) {
  return (
    <div className="road-party">
      {state.heroes.map((hero) => (
        <div key={hero.id}>
          <span>
            {travellerNames[hero.id]}
            {hero.hp <= 0 ? " · 戦闘不能" : ""}
          </span>
          <meter
            min={0}
            max={hero.maxHp}
            value={hero.hp}
            aria-label={`${travellerNames[hero.id]}のHP`}
          />
        </div>
      ))}
    </div>
  );
}

type ControlsProps = {
  paused: boolean;
  disabled: boolean;
  resting: boolean;
  assist: () => void;
  togglePause: () => void;
  restart: () => void;
};

export function RoadControls({
  paused,
  disabled,
  resting,
  assist,
  togglePause,
  restart,
}: ControlsProps) {
  return (
    <div className="road-controls">
      <button className="road-assist" disabled={disabled || paused} onClick={assist}>
        {resting ? "回復を手伝う" : "タップで援護"}
        <span>操作しなくても進みます</span>
      </button>
      <button disabled={disabled} onClick={togglePause}>
        {paused ? "再開" : "一時停止"}
      </button>
      <button onClick={restart} aria-label="試作を最初からやり直す">
        やり直す
      </button>
    </div>
  );
}
