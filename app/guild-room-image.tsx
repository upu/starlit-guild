import { useId, type SVGProps } from "react";
import { guildRoomSprite } from "@/lib/guild-menu-model";
import type { guildRoomArt } from "@/lib/guild-room-art";
export function GuildRoomImage({
  atlas,
  frame,
  ...props
}: SVGProps<SVGSVGElement> & { atlas: keyof typeof guildRoomArt; frame: number }) {
  const sprite = guildRoomSprite(atlas, frame),
    clip = useId();
  const [x, y, width, height] = sprite.rect;
  return (
    <svg viewBox={sprite.rect.join(" ")} aria-hidden="true" {...props}>
      <defs>
        <clipPath id={clip}>
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      <image
        href={sprite.asset}
        width={sprite.width}
        height={sprite.height}
        clipPath={`url(#${clip})`}
      />
    </svg>
  );
}
