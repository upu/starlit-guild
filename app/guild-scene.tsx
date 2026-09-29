import { MessageCircle, PackageOpen, Sprout, CookingPot } from "lucide-react";
import { type State } from "@/lib/game";
import { guildStoryUnlocked } from "@/lib/guild-base";
import { guildStories } from "@/lib/guild-stories";
import { GuildResidents } from "./guild-residents";

export const guildPlaces = {
  garden: "菜園",
  workbench: "作業台",
  shop: "種・材料",
  stories: "日常",
};
export type GuildPlace = keyof typeof guildPlaces;
type SceneProps = { state: State; now: number; onVisit: (place: GuildPlace) => void };

function GuildSceneLinks({ state, onVisit }: Omit<SceneProps, "now">) {
  const unread = guildStories.filter(
    (story) => guildStoryUnlocked(state, story.id) && !state.story?.read.includes(story.id),
  ).length;
  const work = state.guild?.work;
  const stations = [
    {
      id: "stories",
      icon: MessageCircle,
      note: unread ? `${String(unread)}つの話` : "仲間のひと幕",
    },
    {
      id: "workbench",
      icon: CookingPot,
      note: !work
        ? "仕込みをする"
        : !state.guild?.roles.workbench
          ? "担当者待ち"
          : work.batch
            ? "仕込み中"
            : "材料・空き待ち",
    },
    { id: "shop", icon: PackageOpen, note: "種を買い足す" },
    {
      id: "garden",
      icon: Sprout,
      note: "栽培地へ出かける",
    },
  ] as const;
  return (
    <nav aria-label="旅団の施設" className="guild-scene-links">
      {stations.map(({ id, icon: Icon, note }) => (
        <button
          key={id}
          className={`guild-hotspot hotspot-${id}`}
          aria-label={guildPlaces[id]}
          onClick={() => {
            onVisit(id);
          }}
        >
          <span>
            <Icon size={16} aria-hidden="true" />
            {guildPlaces[id]}
          </span>
          <small>{note}</small>
        </button>
      ))}
    </nav>
  );
}
export function GuildScene({ state, onVisit }: SceneProps) {
  return (
    <div className="guild-scene guild-home-scene">
      <div className="guild-scene-art" aria-hidden="true" />
      <span className="guild-location guild-location-loft">リンデ · 倉庫の二階</span>
      <GuildResidents state={state} />
      {!!state.guild?.roles.workbench && !!state.guild.work?.batch && (
        <span className="guild-steam" aria-hidden="true">
          〰
        </span>
      )}
      <GuildSceneLinks state={state} onVisit={onVisit} />
    </div>
  );
}
