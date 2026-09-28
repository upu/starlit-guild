import { useState } from "react";
import { guildRecipes, guildMaterialName, guildLevel } from "@/lib/guild-content";
import { guildStock } from "@/lib/guild-production";
import { consumableById } from "@/lib/consumables";
import { GuildRolePicker, timeRemaining, type GuildProps } from "./guild-controls";

export function GuildWorkbench(props: GuildProps & { now: number }) {
  const { state, ready } = props;
  const [id, setId] = useState(guildRecipes[0].id);
  const work = state.guild?.work;
  const recipe = guildRecipes.find((item) => item.id === (work?.recipe ?? id)) ?? guildRecipes[0];
  return (
    <section className="guild-section">
      <h3>作業台</h3>
      <GuildRolePicker {...props} role="workbench" />
      <p className="guild-caption">
        レオンは焼くもの、ミラはお茶、リコはソーダが得意で、時間を25%短縮します。お茶の蒸らし3分は短縮しません。担当を外すと一時停止します。
      </p>
      <label className="guild-field">
        作り方
        <select
          aria-label="作り方"
          disabled={!ready || !!work}
          value={recipe.id}
          onChange={(e) => {
            setId(e.currentTarget.value);
          }}
        >
          {guildRecipes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <p>{consumableById(recipe.output)?.description}</p>
      <p className="guild-caption">
        基本{recipe.minutes}分 · 1回で{guildLevel(state.guild?.crafting ?? 0)}
        個。効果は各回の仕込み時に決まります。
      </p>
      <ul>
        {Object.entries(recipe.ingredients).map(([material, quantity]) => (
          <li key={material}>
            {guildMaterialName(material)} {quantity}個（在庫{guildStock(state, material)}）
          </li>
        ))}
      </ul>
      {work ? <WorkStatus {...props} /> : <WorkOrder {...props} id={id} />}
      <p className="guild-caption">
        材料は1回の仕込みごとに使います。材料切れ・完成品の在庫上限では待機し、補充・使用後に再開します。閉じている間も進みます。
      </p>
      <p className="guild-caption">できた品は、キャラクターのアイテム枠に登録できます。</p>
    </section>
  );
}
function WorkStatus({ state, ready, onAction, now }: GuildProps & { now: number }) {
  const work = state.guild?.work;
  if (!work) return null;
  const progress = !state.guild?.roles.workbench
    ? "担当者待ち（一時停止）"
    : work.batch
      ? work.batch.readyAt <= now
        ? "在庫に空きができるまで待機"
        : timeRemaining(work.batch.readyAt, now)
      : "材料・在庫の空き待ち";
  return (
    <div className="guild-plot" role="status">
      <p>
        {progress} · {work.remaining === null ? "くり返し" : `残り${String(work.remaining)}回`}
      </p>
      {work.batch && <p>仕込み中：{work.batch.quantity}個</p>}
      <button
        className="outline"
        disabled={!ready}
        onClick={() => {
          onAction({ type: "guildCancel" });
        }}
      >
        加工を中止する
      </button>
      <p className="guild-caption">
        中止すると、仕込み中の材料は戻りません。まだ始めていない分は使いません。
      </p>
    </div>
  );
}

function WorkOrder({ state, ready, onAction, id }: GuildProps & { id: string }) {
  const [repeat, setRepeat] = useState(false),
    [count, setCount] = useState("1");
  const quantity = repeat ? 1 : Number(count);
  return (
    <>
      <label className="guild-check">
        <input
          type="checkbox"
          checked={repeat}
          onChange={(e) => {
            setRepeat(e.currentTarget.checked);
          }}
        />
        材料がある限りくり返す
      </label>
      {!repeat && (
        <label className="guild-field">
          作る回数（1〜99）
          <input
            type="number"
            min={1}
            max={99}
            value={count}
            onChange={(e) => {
              setCount(e.currentTarget.value);
            }}
          />
        </label>
      )}
      <button
        disabled={
          !ready ||
          !state.guild?.roles.workbench ||
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          quantity > 99
        }
        onClick={() => {
          onAction({ type: "guildCraft", id, quantity, value: repeat });
        }}
      >
        加工を始める
      </button>
    </>
  );
}
