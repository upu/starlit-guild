import type { ComponentProps } from "react";
import { StorybookStage, StorybookStageLoading } from "./stage";

export function StoryReaderStage({
  status,
  ...props
}: ComponentProps<typeof StorybookStage> & { status: "loading" | "ready" | "failed" }) {
  if (status === "loading") return <StorybookStageLoading />;
  return <StorybookStage {...props} fallback={status === "failed"} />;
}
