import { useId, type SVGProps } from "react";
import { guildPropFrames, guildPropsAsset } from "./phaser/guild-art";

export function GuildPropImage({ frame, ...props }: SVGProps<SVGSVGElement> & { frame: number }) {
  const clip = useId();
  const rect = guildPropFrames[frame];
  const [x, y, width, height] = rect;
  return (
    <svg viewBox={rect.join(" ")} aria-hidden="true" {...props}>
      <defs>
        <clipPath id={clip}>
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      <image href={guildPropsAsset} width="1536" height="1024" clipPath={`url(#${clip})`} />
    </svg>
  );
}
