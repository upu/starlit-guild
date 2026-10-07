import { gardenPhase, gardenStudy } from "@/lib/home-garden-study";
import type { useStudyPlayer } from "../study-player";
export type GardenPlayer = ReturnType<typeof useStudyPlayer>;
export default function Controls({ p }: { p: GardenPlayer }) {
  const frame = Math.floor(gardenPhase(p.time));
  return (
    <div className="tea-controls">
      <button
        disabled={p.still}
        onClick={() => {
          p.setPlaying(!p.playing);
        }}
      >
        {p.playing ? "一時停止" : "再生"}
      </button>
      <button
        onClick={() => {
          p.select((frame - 1) * gardenStudy.step);
        }}
      >
        前の姿勢
      </button>
      <button
        onClick={() => {
          p.select((frame + 1) * gardenStudy.step);
        }}
      >
        次の姿勢
      </button>
      <label>
        <input
          type="checkbox"
          checked={p.slow}
          onChange={(e) => {
            p.setSlow(e.target.checked);
          }}
        />
        ゆっくり
      </label>
      <label>
        <input
          type="checkbox"
          checked={p.guides}
          onChange={(e) => {
            p.setGuides(e.target.checked);
          }}
        />
        関節を見る
      </label>
      <label>
        <input
          type="checkbox"
          checked={p.still}
          onChange={(e) => {
            p.reduce(e.target.checked);
          }}
        />
        動きを減らす
      </label>
    </div>
  );
}
