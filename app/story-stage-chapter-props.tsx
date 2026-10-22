import type { CSSProperties } from "react";
import type { StoryStageCue } from "@/lib/story-stage";

const names = {
  keeper: "塔の管理人",
  worker: "作業者",
  merchant: "取引先の人",
  "masked-pumpety": "パンプキンヘッドの少女",
  merrill: "メリル",
  cook: "料理人",
  doctor: "町の医者",
  parent: "家の人",
  child: "子ども",
};
const frames = { idle: 0, explain: 1, point: 2, wave: 3 };
const bedFrames = { rest: 0, listen: 1, ask: 2, nod: 3 };
export function ChapterStageProps({ cue }: { cue: StoryStageCue }) {
  const items = [
    ...new Map(
      [...(cue.items ?? []), ...(cue.sequence?.flatMap((s) => s.items) ?? [])].map((item) => [
        item.id,
        item,
      ]),
    ).values(),
  ];
  return (
    <>
      {cue.extras?.map((extra) => (
        <div
          key={extra.id}
          className="story-stage-extra"
          data-npc={extra.id}
          data-speaking={!!extra.speaking}
          data-pose={extra.pose ?? "idle"}
          data-bed={extra.id === "child" && !!extra.bed}
          style={{ left: `${String(extra.x)}%`, bottom: `${String(extra.bottom ?? 23)}%` }}
        >
          <span className="story-stage-shadow" />
          <span
            className="story-stage-extra-sprite"
            style={{
              backgroundImage: `url(/story-stage/${extra.id}-poses.webp)`,
              backgroundPositionX: `${String(((extra.id === "child" && extra.bed ? bedFrames[extra.bed] : frames[extra.pose ?? "idle"]) / 3) * 100)}%`,
              backgroundPositionY:
                (extra.id === "child" && extra.bed) || extra.chair ? "100%" : "0%",
              transform: extra.chair ? `scaleX(${extra.left ? "1" : "-1"})` : undefined,
            }}
          />
          <span className="story-stage-name">{extra.name ?? names[extra.id]}</span>
        </div>
      ))}
      {items.map((item) => (
        <span
          key={item.id}
          className="story-stage-item"
          hidden={!cue.items?.some((shown) => shown.id === item.id)}
          data-item={item.id}
          data-glow={item.glow}
          data-dissipating={!!item.dissipating}
          data-art={item.art}
          style={
            {
              left: `${String(item.x)}%`,
              bottom: `${String(item.bottom)}%`,
              width: `${String(item.width ?? 10)}%`,
              "--item-art": `url(/story-stage/prop-${item.art}.webp)`,
            } as CSSProperties
          }
        />
      ))}
    </>
  );
}
