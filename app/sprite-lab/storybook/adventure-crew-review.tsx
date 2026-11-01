"use client";
export function CrewReviewButtons({
  restart,
}: {
  restart: (packing: boolean, mode: "battle" | "battle-ending" | "earthwork") => void;
}) {
  return (
    <>
      {(["battle", "battle-ending", "earthwork"] as const).map((mode) => (
        <button
          key={mode}
          onClick={() => {
            restart(false, mode);
          }}
        >
          {mode === "battle"
            ? "戦闘から"
            : mode === "battle-ending"
              ? "戦闘終了直前から"
              : "水路作業から"}
        </button>
      ))}
    </>
  );
}
