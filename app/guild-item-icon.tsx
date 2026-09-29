import { guildGoodFrame } from "@/lib/guild-menu-model";
import { GuildRoomImage } from "./guild-room-image";
import { GuildPropImage } from "./guild-prop-image";
export function GuildItemIcon({ id }: { id: string }) {
  if (id === "carrot") return <GuildPropImage frame={4} />;
  return <GuildRoomImage atlas="goods-v3" frame={guildGoodFrame(id)} />;
}
