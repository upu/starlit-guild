"use client";
import { useEffect, useRef } from "react";
import { enemySampleSize, samplePixelFrame } from "@/lib/adventure-pixel-sampling";
import { enemyDisplayHeight } from "@/app/phaser/road-enemy-appearance";
import type { RoadEnemy } from "@/lib/road-view";
import { adventureHeroAsset } from "@/lib/adventure-hero-art";

import {
  adventureEnemyArt as art,
  adventureEnemyAsset,
  type AdventureEnemyId,
} from "@/lib/adventure-enemy-art";

type Example = {
  label: string;
  art: AdventureEnemyId;
  kind: RoadEnemy["kind"];
  boss?: boolean;
};
const examples: Example[] = [
  { label: "スライム", art: "slime", kind: "slime" },
  { label: "大きなスライム", art: "slime", kind: "slime", boss: true },
  { label: "狼", art: "wolf", kind: "slime" },
  { label: "竜", art: "dragon", kind: "slime", boss: true },
  { label: "植物", art: "plant", kind: "slime" },
  {
    label: "カボチャ頭の少女",
    art: "pumpety",
    kind: "pumpety",
  },
  {
    label: "人形",
    art: "puppet",
    kind: "puppet",
  },
  {
    label: "ゴーレム",
    art: "golem",
    kind: "golem",
  },
  { label: "リコの仕掛け", art: "lico-standing", kind: "lico" },
  { label: "メリル", art: "merrill-standing", kind: "merrill" },
  { label: "メリル・歌", art: "merrill-song", kind: "merrill" },
  { label: "コロタケ", art: "mushroom", kind: "mushroom" },
];

function EnemyFigure({ example, zoom }: { example: Example; zoom: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let disposed = false;
    const image = new Image();
    image.onload = () => {
      if (!disposed) paintExample(canvas, image, example);
    };
    image.onerror = () => {
      if (!disposed)
        canvas.setAttribute("aria-label", `${example.label}の画像を読み込めませんでした`);
    };
    image.src = adventureEnemyAsset(example.art);
    return () => {
      disposed = true;
    };
  }, [example]);
  return (
    <figure>
      <div className="enemy-study-floor" style={{ height: 130 * zoom }}>
        <canvas ref={ref} role="img" aria-label={example.label} style={{ zoom }} />
      </div>
      <figcaption>{example.label}</figcaption>
    </figure>
  );
}

function paintExample(canvas: HTMLCanvasElement, image: HTMLImageElement, example: Example) {
  const [x, y, width, height] = [0, 0, image.width, image.height];
  const h =
    ((enemyDisplayHeight({ kind: example.kind, boss: example.boss ?? false }, 390, 400) /
      (390 * 0.18 * 0.9)) *
      48 *
      art.cell) /
    art.height;
  const w = h;
  const sample = samplePixelFrame(image, { x, y, width, height }, enemySampleSize(w, h, 48), false);
  canvas.width = sample.width;
  canvas.height = sample.height;
  canvas.style.width = `${String(w)}px`;
  canvas.style.height = `${String(h)}px`;
  const origin = art.foot / art.cell;
  canvas.style.transform = `translateY(${String(h * (1 - origin))}px)`;
  canvas.getContext("2d")?.drawImage(sample, 0, 0);
  canvas.dataset.status = "ready";
}

export default function EnemyStudy({ zoom }: { zoom: number }) {
  return (
    <section aria-label="敵との大きさ比較">
      <h2>敵との大きさ比較</h2>
      <p>味方の立ち姿48pxを基準に並べています。上の大きさ設定で一緒に拡大できます。</p>
      <div className="adventure-study-figures enemy-study-figures">
        <figure>
          <div className="enemy-study-floor" style={{ height: 130 * zoom }}>
            <div
              role="img"
              aria-label="レオン・比較基準"
              style={{
                width: 96 * zoom,
                height: 96 * zoom,
                transform: `translateY(${String(8 * zoom)}px)`,
                backgroundImage: `url(${adventureHeroAsset("leon")})`,
                backgroundSize: `${String(384 * zoom)}px ${String(576 * zoom)}px`,
                backgroundPosition: `0px ${String(-192 * zoom)}px`,
                imageRendering: "pixelated",
              }}
            />
          </div>
          <figcaption>レオン・比較基準</figcaption>
        </figure>
        {examples.map((example) => (
          <EnemyFigure key={example.label} example={example} zoom={zoom} />
        ))}
      </div>
    </section>
  );
}
