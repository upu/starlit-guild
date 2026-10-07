import Link from "next/link";
import { spriteStudies } from "./studies";

export default function SpriteLabPage() {
  return (
    <main className="sprite-lab-index">
      <p className="sprite-lab-eyebrow">キャラクターの動きを見比べる</p>
      <h1>ドット絵見本帳</h1>
      <p>
        動きの見本と、描いたキャラクターを同じタイミングで比較できます。小さな表示と拡大、コマ送りで、気になる姿勢を確かめましょう。
      </p>
      <div className="sprite-lab-cards">
        {spriteStudies.map(({ id, title, description, atlas, rows }) => (
          <Link key={id} href={`/sprite-lab/${id}`} className="sprite-lab-card">
            <span
              className="sprite-lab-preview"
              aria-hidden="true"
              style={{
                backgroundImage: `url(/home-pixel/${atlas}.webp)`,
                backgroundSize: `400% ${String(rows * 100)}%`,
              }}
            />
            <span>
              <h2>{title}</h2>
              <p>{description}</p>
              <span className="sprite-lab-open">見本と比較する →</span>
            </span>
          </Link>
        ))}
      </div>
      <p className="sprite-lab-note">
        ゲームと同じ素材を使う制作・確認用のページです。旅団に限らず、今後の冒険や会話場面の動きもここへ追加できます。ゲームのセーブは変更しません。
      </p>
    </main>
  );
}
