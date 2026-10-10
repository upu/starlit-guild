import type { CSSProperties } from "react";
import type { StoryStageCue } from "@/lib/story-stage";

const names = { keeper: "塔の管理人", worker: "作業者", merchant: "取引先の人" };
const frames = { idle: 0, explain: 1, point: 2, wave: 3 };
export function ChapterStageProps({ cue }: { cue: StoryStageCue }) {
  return (
    <>
      {cue.extras?.map((extra) => (
        <div
          key={extra.id}
          className="story-stage-extra"
          data-npc={extra.id}
          data-speaking={!!extra.speaking}
          data-pose={extra.pose ?? "idle"}
          style={{ left: `${String(extra.x)}%`, bottom: `${String(extra.bottom ?? 23)}%` }}
        >
          <span className="story-stage-shadow" />
          <span
            className="story-stage-extra-sprite"
            style={{
              backgroundImage: `url(/story-stage/${extra.id}-poses.webp)`,
              backgroundPositionX: `${String((frames[extra.pose ?? "idle"] / 3) * 100)}%`,
            }}
          />
          <span className="story-stage-name">{names[extra.id]}</span>
        </div>
      ))}
      {cue.items?.map((item) => (
        <span
          key={item.id}
          className="story-stage-item"
          data-item={item.id}
          data-glow={item.glow}
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
