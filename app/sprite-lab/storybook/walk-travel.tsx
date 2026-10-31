"use client";
import { WalkFrames } from "./walk-review";
import { travelDuration, useWalkTravel } from "./use-walk-travel";

export function WalkTravel() {
  const { elapsed, running, seek, start, pause } = useWalkTravel();
  const moving = elapsed > 0 && elapsed < travelDuration;
  return (
    <section className="storybook-travel-review">
      <h3>倉庫前を歩いて止まる（調整中）</h3>
      <p>
        立ち姿から歩き出し、短い距離を移動して止まります。途中で止めるか、時間を動かして接地を確認できます。
      </p>
      <div className="storybook-travel-ground">
        <TravelActor elapsed={elapsed} moving={moving} />
      </div>
      <label>
        移動の時刻（ミリ秒）
        <input
          type="range"
          min="0"
          max={travelDuration}
          step="1"
          value={Math.round(elapsed)}
          onChange={(event) => {
            seek(Number(event.target.value));
          }}
        />
      </label>
      <p>
        {Math.round(elapsed)} / {travelDuration} ms・{moving ? "歩行途中" : "立ち姿"}
      </p>
      <div className="storybook-study-controls">
        <button type="button" onClick={running ? pause : start}>
          {running ? "移動を一時停止" : "移動を再生"}
        </button>
        <button
          type="button"
          onClick={() => {
            seek(elapsed + 180);
          }}
        >
          移動を1コマ進める
        </button>
        <button
          type="button"
          onClick={() => {
            seek(0);
          }}
        >
          出発位置へ戻す
        </button>
      </div>
    </section>
  );
}

function TravelActor({ elapsed, moving }: { elapsed: number; moving: boolean }) {
  const frame = Math.floor(elapsed / 180) % 4;
  return (
    <div
      className="storybook-travel-actor"
      style={{ left: `${String(20 + (34.5 * elapsed) / travelDuration)}%` }}
    >
      <span className="storybook-travel-shadow" aria-hidden="true" />
      <span
        className="storybook-walk-standing"
        role="img"
        aria-label="レオンの立ち姿"
        style={{ visibility: moving ? "hidden" : "visible" }}
      />
      <WalkFrames frame={moving ? frame : -1} />
    </div>
  );
}
