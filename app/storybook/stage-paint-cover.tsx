"use client";
import { useEffect, useState } from "react";
import { afterStagePaint } from "@/lib/storybook/stage-paint";

/** Let a cut's decoded backgrounds and sprites reach the compositor before revealing it. */
export function StagePaintCover() {
  const [visible, setVisible] = useState(true);
  useEffect(
    () =>
      afterStagePaint(() => {
        setVisible(false);
      }),
    [],
  );
  if (!visible) return null;
  return (
    <div className="storybook-painted-stage storybook-stage-loading" aria-hidden="true">
      舞台を準備しています…
    </div>
  );
}
