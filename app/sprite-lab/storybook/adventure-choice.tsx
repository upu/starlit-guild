"use client";

export function PaintedChoice({
  value,
  change,
  draft = false,
}: {
  value: boolean;
  change: (value: boolean) => void;
  draft?: boolean;
}) {
  return (
    <label>
      <input
        type="checkbox"
        checked={value}
        onChange={(event) => {
          change(event.target.checked);
        }}
      />
      {draft ? "試作の手描き表示（OFFで旧素材と比較）" : "本編の手描き表示（OFFで旧素材と比較）"}
    </label>
  );
}

export function StudyPlaybackControls({
  quest,
  painted,
  setPainted,
  paused,
  setPaused,
  completed = false,
}: {
  quest: string;
  painted: boolean;
  setPainted: (value: boolean) => void;
  paused: boolean;
  setPaused: (value: boolean) => void;
  completed?: boolean;
}) {
  return (
    <>
      <PaintedChoice
        value={painted}
        change={setPainted}
        draft={[
          "keystone-night-road",
          "berne-restoration",
          "lantern-detour",
          "brekka-arrival",
          "starlit-guild-founding",
          "glowing-moss-trail",
          "glowing-moss-trail-next-day",
        ].includes(quest)}
      />
      <button
        disabled={completed}
        onClick={() => {
          setPaused(!paused);
        }}
      >
        {completed ? "採取終了" : paused ? "再生" : "一時停止"}
      </button>
    </>
  );
}
