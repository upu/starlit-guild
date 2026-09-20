"use client";
import Link from "next/link";
import { useState } from "react";
import { ROAD_LENGTH, roadStatus } from "@/lib/scrolling-battle";
import { useRoadBattle, useRoadCanvas } from "./use-road-battle";
import { RoadChat } from "./road-chat";
import { RoadControls, RoadLoadout, RoadStages } from "./road-controls";
import { roadStages } from "@/lib/scrolling-stages";
import "./road.css";

function RoadStage({ game }: { game: ReturnType<typeof useRoadBattle> }) {
  const [retry, setRetry] = useState(0);
  const host = useRoadCanvas(
    { read: game.read, assist: game.assist, status: game.setStatus },
    retry,
  );
  return (
    <section className="road-stage" aria-label="横スクロールの戦場">
      <div ref={host} className="road-canvas" data-status={game.status} aria-hidden="true" />
      <div className="road-scene-caption">
        <span>{roadStages[game.view.stage].name}</span>
        <span>{game.paused ? "一時停止中" : "自動で冒険中"}</span>
      </div>
      <div className="road-scene-status" role="status">
        {game.paused ? "一時停止中" : roadStatus(game.view)}
      </div>
      {game.status !== "ready" && (
        <div className="road-loading" role="status">
          <p>
            {game.status === "error" ? "景色を読み込めませんでした" : "森へ向かう支度をしています…"}
          </p>
          {game.status === "error" && (
            <button
              onClick={() => {
                game.setStatus("loading");
                setRetry((value) => value + 1);
              }}
            >
              もう一度読み込む
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export default function RoadPrototype() {
  const game = useRoadBattle(),
    state = game.view;
  const percent = Math.floor((state.distance / ROAD_LENGTH) * 100);
  return (
    <main className="road-prototype">
      <header className="road-header">
        <div>
          <span className="road-eyebrow">STARLIT GUILD / BATTLE STUDY</span>
          <h1>
            {state.heroes.length === 3 ? "みんなで、森の向こうへ。" : "ふたりで、森の向こうへ。"}
          </h1>
        </div>
        <Link href="/">タイトルへ</Link>
      </header>
      <div className="road-intro">
        <span>横スクロール戦闘の試作</span>
        <p>眺めるだけで進む旅。ときどき、あなたの手助けを。</p>
      </div>
      <RoadStages stage={state.stage} select={game.selectStage} />
      <div className="road-progress">
        <div>
          <span>出発</span>
          <span>
            {state.round}周目 · 踏破 {percent}%
          </span>
          <span>森の出口</span>
        </div>
        <progress max={ROAD_LENGTH} value={state.distance} aria-label="森の出口までの進み具合" />
      </div>
      <RoadStage game={game} />
      <div className="road-summary">
        <span>
          討伐 {state.defeated} · 薬草 {state.herbs} · 踏破 {state.clears}回
          {state.stage === "cargo" && ` · 配達 ${String(state.deliveries)}回`}
        </span>
      </div>
      <RoadChat key={state.stage} time={state.time} members={state.heroes.map((hero) => hero.id)} />
      <RoadLoadout state={state} equip={game.equip} />
      <RoadControls
        paused={game.paused}
        disabled={game.status !== "ready"}
        resting={state.phase === "rest"}
        work={state.gathering?.task}
        assist={game.assist}
        togglePause={() => {
          game.setPaused(!game.paused);
        }}
        restart={game.restart}
      />
      <p className="road-footnote">
        試作専用の冒険です。本編の記録は変わりません。閉じると試作の進行はリセットされます。
      </p>
    </main>
  );
}
