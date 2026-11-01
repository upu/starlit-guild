"use client";
export function PuppetReviewButton({
  quest,
  restart,
}: {
  quest: string;
  restart: (packing: boolean, mode: "puppet-escape" | "opening") => void;
}) {
  if (
    [
      "begging-golem",
      "waiting-households",
      "berne-road",
      "berne-house-calls",
      "missing-keystone",
    ].includes(quest)
  )
    return (
      <button
        onClick={() => {
          restart(false, "opening");
        }}
      >
        冒頭で停止
      </button>
    );
  if (quest !== "sweet-blockade") return null;
  return (
    <>
      <button
        onClick={() => {
          restart(false, "opening");
        }}
      >
        冒頭で停止
      </button>
      <button
        onClick={() => {
          restart(false, "puppet-escape");
        }}
      >
        撤退から
      </button>
    </>
  );
}
