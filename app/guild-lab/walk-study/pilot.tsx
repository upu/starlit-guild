import { WalkFigure } from "./figure";
export function WalkPilot({ frame }: { frame: number }) {
  return (
    <section className="walk-pilot">
      <h2>レオンへの描き写し・試作</h2>
      <p>
        見本と同じコマで再生します。奥の手は戻るようになりましたが、手足の位置はまだ一致していません。旅団の絵は差し替えていません。
      </p>
      <div className="walk-pilot-pair">
        <div className="walk-large">
          <WalkFigure frame={frame} guides />
        </div>
        <div
          className="walk-pilot-sprite"
          role="img"
          aria-label={`レオン試作 ${String(frame + 1)} コマ目`}
          style={{
            backgroundPosition: `${String(((frame % 4) / 3) * 100)}% ${String(Math.floor(frame / 4) * 100)}%`,
          }}
        />
      </div>
    </section>
  );
}
