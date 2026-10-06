import { Clock3, Repeat, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { guildRecipes, guildMaterialName, guildLevel } from "@/lib/guild-content";
import { guildStock } from "@/lib/guild-production";
import { consumableById } from "@/lib/consumables";
import { GuildRolePicker, type GuildProps } from "./guild-controls";
import { workStatus, workProgress } from "@/lib/guild-ui-status";
import { GuildItemIcon } from "./guild-item-icon";
import { GuildRecipeMenu } from "./guild-recipe-menu";

export function GuildWorkbench(
  props: GuildProps & {
    now: number;
    onShop: () => void;
    selected?: string;
    onSelect: (id: string) => void;
  },
) {
  const { state } = props;
  const id = props.selected ?? guildRecipes[0].id,
    work = state.guild?.work;
  const recipe = guildRecipes.find((item) => item.id === (work?.recipe ?? id)) ?? guildRecipes[0];
  return (
    <section className="guild-workshop">
      <GuildRecipeMenu {...props} selected={recipe.id} onSelect={props.onSelect} />
      <GuildRolePicker {...props} role="workbench" />
      <div className="guild-recipe-heading">
        <b>{recipe.name}</b>
        <span>
          <Clock3 size={14} />
          {recipe.minutes}分 · ×{guildLevel(state.guild?.crafting ?? 0)}
        </span>
      </div>
      <div className="guild-ingredients">
        {Object.entries(recipe.ingredients).map(([material, quantity]) => (
          <span
            key={material}
            className={guildStock(state, material) < quantity ? "is-short" : ""}
            title={guildMaterialName(material)}
            aria-label={`${guildMaterialName(material)}：必要${String(quantity)}、所持${String(guildStock(state, material))}`}
          >
            <GuildItemIcon id={material} />
            <b>
              {quantity}
              <small> / {guildStock(state, material)}</small>
            </b>
          </span>
        ))}
      </div>
      <p className="guild-item-effect">{consumableById(recipe.output)?.description}</p>
      <div className="guild-output-preview">
        <GuildItemIcon id={recipe.output} />
        <span>
          <b>できあがり ×{guildLevel(state.guild?.crafting ?? 0)}</b>
          <small>
            所持 {state.consumables?.items[recipe.output] ?? 0} · 完成すると自動で在庫へ
          </small>
        </span>
      </div>
      {work ? <WorkStatus {...props} /> : <WorkOrder {...props} id={id} />}
      <button className="guild-supply-link" onClick={props.onShop}>
        材料を買う
      </button>
    </section>
  );
}
function WorkStatus({ state, ready, onAction, now }: GuildProps & { now: number }) {
  const work = state.guild?.work;
  if (!work) return null;
  const progress = workStatus(state, now);
  return (
    <div className="guild-work-status" role="status">
      <div>
        <Clock3 size={18} aria-hidden="true" />
        <b>{progress}</b>
        <span>{work.remaining === null ? "∞" : `残り ${String(work.remaining)}回`}</span>
      </div>
      {work.batch && (
        <progress aria-label="加工の進み具合" value={workProgress(state, now)} max={1} />
      )}
      <button
        disabled={!ready}
        onClick={() => {
          onAction({ type: "guildCancel" });
        }}
      >
        加工を中止する
      </button>
      <small>仕込み中の材料は戻りません。</small>
    </div>
  );
}
function WorkOrder({ state, ready, onAction, id }: GuildProps & { id: string }) {
  const [repeat, setRepeat] = useState(false),
    [count, setCount] = useState("1");
  const quantity = repeat ? 1 : Number(count);
  return (
    <div className="guild-work-order">
      {!state.guild?.roles.workbench && <p className="guild-production-note">担当：未選択</p>}
      <WorkQuantity count={count} setCount={setCount} repeat={repeat} setRepeat={setRepeat} />
      <button
        className="guild-primary"
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
    </div>
  );
}

function WorkQuantity({
  count,
  setCount,
  repeat,
  setRepeat,
}: {
  count: string;
  setCount: (count: string) => void;
  repeat: boolean;
  setRepeat: (repeat: boolean) => void;
}) {
  const quantity = Number(count);
  return (
    <div className="guild-quantity">
      <button
        aria-label="作る回数を減らす"
        disabled={repeat || quantity <= 1}
        onClick={() => {
          setCount(String(Math.max(1, quantity - 1)));
        }}
      >
        <Minus size={18} />
      </button>
      <input
        aria-label="作る回数（1〜99）"
        type="number"
        min={1}
        max={99}
        value={count}
        disabled={repeat}
        onChange={(event) => {
          setCount(event.currentTarget.value);
        }}
      />
      <button
        aria-label="作る回数を増やす"
        disabled={repeat || quantity >= 99}
        onClick={() => {
          setCount(String(Math.min(99, quantity + 1)));
        }}
      >
        <Plus size={18} />
      </button>
      <button
        aria-label="材料がある限りくり返す"
        aria-pressed={repeat}
        onClick={() => {
          setRepeat(!repeat);
        }}
      >
        <Repeat size={20} />
      </button>
    </div>
  );
}
