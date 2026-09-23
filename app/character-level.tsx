import { levelProgress } from "@/lib/game";

const amount = (value: number) => Math.floor(value).toLocaleString("ja-JP");

/** Level, total EXP and the gauge toward the next level; the cap shows MAX instead. */
export function CharacterLevel({ xp }: { xp: number }) {
  const progress = levelProgress(xp);
  if (progress.next === null)
    return (
      <>
        <span className="character-level">
          Lv. {progress.level}
          <b>MAX</b>
        </span>
        <div className="character-exp">
          <p>EXP {amount(progress.xp)}</p>
        </div>
      </>
    );
  return (
    <>
      <span className="character-level">Lv. {progress.level}</span>
      <div className="character-exp">
        <p>
          EXP {amount(progress.xp)} / {amount(progress.next)}
          <small>次のLvまで {Math.ceil(progress.remaining).toLocaleString("ja-JP")}</small>
        </p>
        <progress
          max={1}
          value={progress.ratio}
          aria-label={`次のレベルまで ${String(Math.floor(progress.ratio * 100))}%`}
        />
      </div>
    </>
  );
}
