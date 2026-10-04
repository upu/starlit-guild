"use client";
import { useState } from "react";
import Link from "next/link";
import { HomeRoom } from "../home-room";
import { residentIds, residentNames } from "@/lib/home-actor";
import { defaultHome, type RoomSite } from "@/lib/home-room-layout";
import type { RoomActivity } from "@/lib/home-room-life";
const activities: Record<RoomActivity, string> = {
  auto: "おまかせ",
  tea: "みんなでお茶",
  craft: "道具の手入れ",
  paper: "依頼の整理",
  garden: "菜園の世話",
};
export default function GuildLab() {
  const [site, setSite] = useState<RoomSite>("home"),
    [mode, setMode] = useState<RoomActivity>("auto");
  const [layout, setLayout] = useState(defaultHome);
  return (
    <main className="guild-lab">
      <div className="guild-lab-inner">
        <LabHeading />

        <p>お茶の席に集まったり、手紙を整理したり。仲間に触れると、手を振ってくれます。</p>
        <div className="guild-lab-actions" aria-label="場所">
          {(
            [
              ["home", "旅団ホーム"],
              ["linde", "リンデの菜園"],
              ["brekka", "塔の栽培所"],
            ] as const
          ).map(([id, name]) => (
            <button
              key={id}
              aria-pressed={site === id}
              onClick={() => {
                setSite(id);
                setMode("auto");
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <HomeRoom
          key={site}
          site={site}
          members={[...residentIds]}
          layout={layout}
          onLayout={(items) => {
            setLayout(items);
            return true;
          }}
          mode={mode}
          growth={{ "linde-1": 0.28, "linde-2": 0.85, "brekka-1": 0.6 }}
          onUse={(id) => {
            setMode(
              id === "bench"
                ? "craft"
                : id === "desk"
                  ? "paper"
                  : site === "home"
                    ? "tea"
                    : "garden",
            );
          }}
        />
        <ActivityButtons site={site} mode={mode} setMode={setMode} />
        <p className="guild-lab-caption">{residentIds.map((id) => residentNames[id]).join("・")}</p>
        <LabExplanation />
      </div>
    </main>
  );
}

function LabExplanation() {
  return (
    <details>
      <summary>今回の試作について</summary>
      <p>
        5人と、6人掛けのテーブル。家具をマスに合わせて置けます。配置を決めると仲間が通路を歩き、新しい場所で過ごします。
      </p>
      <p>
        この試作ページの家具配置は、ページを閉じると元に戻ります。冒険のセーブや生産状況は変更しません。
      </p>
    </details>
  );
}

function ActivityButtons({
  site,
  mode,
  setMode,
}: {
  site: RoomSite;
  mode: RoomActivity;
  setMode: (mode: RoomActivity) => void;
}) {
  return (
    <div className="guild-lab-actions" aria-label="過ごし方">
      {Object.entries(activities)
        .filter(([id]) => (site === "home" ? id !== "garden" : id === "auto" || id === "garden"))
        .map(([id, name]) => (
          <button
            key={id}
            aria-pressed={mode === id}
            onClick={() => {
              setMode(id as RoomActivity);
            }}
          >
            {name}
          </button>
        ))}
    </div>
  );
}

function LabHeading() {
  return (
    <header>
      <div>
        <small>星灯りの旅団 / ちいさな暮らし</small>
        <h1>おかえり、旅団ホームへ</h1>
        <Link href="/guild-lab/walk-study">共通の歩行見本を見る</Link>
        {" ／ "}
        <Link href="/guild-lab/tea-study">お茶と会話の見本を見る</Link>
      </div>
      <Link href="/">ゲームへ戻る</Link>
    </header>
  );
}
