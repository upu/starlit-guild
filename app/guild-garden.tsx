import { useState } from "react";
import { guildCrops, plotRole, guildMaterialName, type GuildPlotId } from "@/lib/guild-content";
import { guildStock } from "@/lib/guild-production";
import { GuildRolePicker, timeRemaining, type GuildProps } from "./guild-controls";

function Plot({ id, now, ...props }: GuildProps & { id: GuildPlotId; now: number }) {
  const { state, ready, onAction } = props,
    plot = state.guild?.plots[id];
  const crops = guildCrops.filter((crop) => crop.role === plotRole(id));
  const [selection, setSelection] = useState<string>(crops[0].id);
  const growing = guildCrops.find((item) => item.id === plot?.crop);
  const crop = (plot?.batch ? growing : crops.find((item) => item.id === selection)) ?? crops[0];
  return (
    <div className="guild-plot">
      <h4>{id === "brekka-1" ? "苔床" : `プランター ${id.slice(-1)}`}</h4>
      {plot?.batch ? (
        <p>
          {growing?.name} · {timeRemaining(plot.batch.readyAt, now)}
          <br />
          収穫量 {plot.batch.quantity}個
        </p>
      ) : (
        <div className="guild-inline">
          <select
            aria-label={`${id}の作物`}
            value={selection}
            disabled={!ready}
            onChange={(e) => {
              setSelection(e.currentTarget.value);
            }}
          >
            {crops.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button
            disabled={!ready || guildStock(state, crop.seed) < 1}
            onClick={() => {
              onAction({ type: "guildPlant", id, name: crop.id });
            }}
          >
            植える
          </button>
        </div>
      )}
      <p className="guild-caption">
        {guildMaterialName(crop.seed)}：{guildStock(state, crop.seed)}個 · 基本{crop.minutes}分
      </p>
      <label className="guild-check">
        <input
          type="checkbox"
          checked={plot?.replant !== false}
          disabled={!ready}
          onChange={(e) => {
            onAction({ type: "guildReplant", id, value: e.currentTarget.checked });
          }}
        />
        収穫後に同じ作物を植え直す
      </label>
    </div>
  );
}
export function GuildGarden({
  site,
  ...props
}: GuildProps & { now: number; site: "linde" | "brekka" }) {
  return (
    <section className="guild-section">
      <p>画面を閉じている間も育ちます。世話係がいないと収穫せず、実ったまま待ちます。</p>
      <p className="guild-caption">
        世話係がいると時間10%短縮・収穫+1。アリアとリコは25%短縮・収穫+2。担当とレベルの効果は植えるときに決まります。
      </p>
      {site === "linde" ? (
        <>
          <h3>リンデのプランター</h3>
          <p className="guild-caption">倉庫の裏。普通の薬草と野菜を育てます。</p>
          <GuildRolePicker {...props} role="linde" />
          <div className="guild-plots">
            <Plot {...props} id="linde-1" />
            <Plot {...props} id="linde-2" />
          </div>
        </>
      ) : (
        <>
          <h3>ブレッカの苔床</h3>
          <p className="guild-caption">
            塔から離れた栽培所。日々の水やりは現地の人に任せ、世話係が記録と乾燥を段取りします。収穫物は乾燥苔になります。
          </p>
          <GuildRolePicker {...props} role="brekka" />
          <Plot {...props} id="brekka-1" />
        </>
      )}
      <p className="guild-caption">
        担当中も冒険に参加できます。同じ人は二つの仕事を兼ねられません。
      </p>
      <p className="guild-caption">
        種切れ・在庫上限では待機します。植え直しを外すと、次の収穫で止まります。
      </p>
    </section>
  );
}
