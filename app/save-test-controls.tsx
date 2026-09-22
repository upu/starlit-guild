"use client";
import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { level } from "@/lib/game";
import { storyStages } from "@/lib/prologue";
import type { Game } from "./save-panel-types";

function TestFields({
  game,
  values,
  setValues,
  apply,
}: {
  game: Game;
  values: number[];
  setValues: (values: number[]) => void;
  apply: () => void;
}) {
  const [clears, level, gold] = values;
  const field = (label: string, value: number, min: number, max: number, index: number) => (
    <label>
      {label}
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const next = [...values];
          next[index] = Number(event.target.value);
          setValues(next);
        }}
      />
    </label>
  );
  return (
    <div className="test-fields">
      {field("達成ステージ", clears, 0, storyStages.length, 0)}
      {field("仲間のLv.", level, 1, 50, 1)}
      {field("所持金", gold, 0, 10000000, 2)}
      <button disabled={game.otherTab || !values.every(Number.isFinite)} onClick={apply}>
        適用する
      </button>
    </div>
  );
}

export function TestControls({ game, onAdjust }: { game: Game; onAdjust: () => void }) {
  const [values, setValues] = useState([
    storyStages.filter((stage) => game.s.done[stage.quest]).length,
    level(game.s.xp.aria),
    game.s.gold,
  ]);
  if (!game.testToolsEnabled || !game.profile?.test) return null;
  const adjust = (clears: number, level: number, gold: number) => {
    game.adjust(clears, level, gold);
    onAdjust();
  };
  return (
    <section className="test-controls">
      <div>
        <FlaskConical size={18} />
        <b>テスト用の冒険</b>
        <small>変更するのはこの記録だけです。適用すると、隊はキャンプへ戻ります。</small>
      </div>

      <TestFields
        game={game}
        values={values}
        setValues={setValues}
        apply={() => {
          adjust(values[0], values[1], values[2]);
        }}
      />
    </section>
  );
}
