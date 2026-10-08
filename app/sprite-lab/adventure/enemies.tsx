"use client";
import { useEffect, useRef } from "react";
import { enemySampleSize, samplePixelFrame } from "@/lib/adventure-pixel-sampling";
import { enemyDisplayHeight } from "@/app/phaser/road-enemy-appearance";
import type { RoadEnemy } from "@/lib/road-view";
import { adventureHeroAsset } from "@/lib/adventure-hero-art";

type Example = {
  label: string;
  asset: string;
  kind: RoadEnemy["kind"];
  boss?: boolean;
  index?: number;
  rect?: readonly [number, number, number, number];
};
const examples: Example[] = [
  { label: "スライム", asset: "/sprites.png", kind: "slime", index: 8 },
  { label: "大きなスライム", asset: "/sprites.png", kind: "slime", boss: true, index: 8 },
  { label: "狼", asset: "/sprites.png", kind: "slime", index: 9 },
  { label: "竜", asset: "/sprites.png", kind: "slime", boss: true, index: 10 },
  { label: "植物", asset: "/sprites.png", kind: "slime", index: 11 },
  {
    label: "カボチャ頭の少女",
    asset: "/animations/road/puppets-v1.webp",
    kind: "pumpety",
    rect: [0, 0, 740, 724],
  },
  {
    label: "人形",
    asset: "/animations/road/puppets-v1.webp",
    kind: "puppet",
    rect: [740, 0, 610, 724],
  },
  {
    label: "ゴーレム",
    asset: "/animations/road/puppets-v1.webp",
    kind: "golem",
    rect: [1350, 0, 822, 724],
  },
  { label: "リコの仕掛け", asset: "/animations/road/lico-standing-v1.webp", kind: "lico" },
  { label: "メリル", asset: "/animations/road/merrill-standing-v1.webp", kind: "merrill" },
  { label: "メリル・歌", asset: "/animations/road/merrill-song-v1.webp", kind: "merrill" },
  { label: "コロタケ", asset: "/animations/road/mushroom-v1.webp", kind: "mushroom" },
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
    image.src = example.asset;
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
  const [x, y, width, height] =
    example.rect ??
    (example.index !== undefined
      ? [
          Math.round(((example.index % 4) * image.width) / 4),
          Math.round((Math.floor(example.index / 4) * image.height) / 3),
          Math.floor(image.width / 4),
          Math.floor(image.height / 3),
        ]
      : [0, 0, image.width, image.height]);
  const h =
    (enemyDisplayHeight({ kind: example.kind, boss: example.boss ?? false }, 390, 400) /
      (390 * 0.18 * 0.9)) *
    48;
  const w = example.kind === "slime" ? h : (h * width) / height;
  const sample = samplePixelFrame(
    image,
    { x, y, width, height },
    enemySampleSize(w, h, 48),
    example.index !== undefined,
  );
  canvas.width = sample.width;
  canvas.height = sample.height;
  canvas.style.width = `${String(w)}px`;
  canvas.style.height = `${String(h)}px`;
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
