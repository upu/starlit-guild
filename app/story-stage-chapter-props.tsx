import type { CSSProperties } from "react";
import type { StoryStageCue } from "@/lib/story-stage";
import type { StageExtra } from "@/lib/story-stage-cues";
import { stageExtraFrame, stageExtraRows, stageExtraAtlas } from "@/lib/story-stage-figure";

const names = {
  keeper: "塔の管理人",
  worker: "作業者",
  "stone-carrier": "石を運ぶ人",
  merchant: "取引先の人",
  "masked-pumpety": "パンプキンヘッドの少女",
  merrill: "メリル",
  cook: "料理人",
  doctor: "町の医者",
  parent: "家の人",
  child: "子ども",
};
export function ChapterStageProps({ cue }: { cue: StoryStageCue }) {
  const extras = [
    ...new Map(
      [...(cue.extras ?? []), ...(cue.sequence?.flatMap((s) => s.extras ?? []) ?? [])].map(
        (extra) => [extra.id, extra],
      ),
    ).values(),
  ];
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
      {extras.map((extra) => (
        <Extra
          key={extra.id}
          extra={extra}
          hidden={!cue.extras?.some((shown) => shown.id === extra.id)}
        />
      ))}
      {items.map((item) => (
        <span
          key={item.id}
          className="story-stage-item"
          hidden={!cue.items?.some((shown) => shown.id === item.id)}
          data-item={item.id}
          data-glow={item.glow}
          data-glow-tone={item.glowTone}
          data-dissipating={!!item.dissipating}
          data-pouring={!!item.pouring}
          data-steaming={!!item.steaming}
          data-art={item.art}
          data-shaded={!!item.shaded}
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

function Extra({ extra, hidden }: { extra: StageExtra; hidden: boolean }) {
  return (
    <div
      className="story-stage-extra"
      data-npc={extra.id}
      hidden={hidden}
      data-speaking={!!extra.speaking}
      data-pose={extra.pose ?? "idle"}
      data-bed={extra.id === "child" && !!extra.bed}
      data-restoration={!!extra.restoration}
      style={{ left: `${String(extra.x)}%`, bottom: `${String(extra.bottom ?? 23)}%` }}
    >
      <span className="story-stage-shadow" />
      <span
        className="story-stage-extra-sprite"
        style={{
          backgroundImage: `url(/story-stage/${stageExtraAtlas(extra)}-poses.webp)`,
          backgroundPositionX: `${String(((stageExtraFrame(extra) % 4) / 3) * 100)}%`,
          backgroundPositionY: `${String((Math.floor(stageExtraFrame(extra) / 4) * 100) / Math.max(1, stageExtraRows(extra) - 1))}%`,
          transform: extra.chair ? `scaleX(${extra.left ? "1" : "-1"})` : undefined,
        }}
      />
      <span className="story-stage-name">
        {extra.name ?? (extra.id === "fence-carrier" ? "柵を運ぶ人" : names[extra.id])}
      </span>
    </div>
  );
}
