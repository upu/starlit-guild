import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GuildGarden } from "./guild-garden";
import { GuildWorkbench } from "./guild-workbench";
import { GuildShop } from "./guild-shop";
import { GuildConversations } from "./guild-conversations";
import { GuildScene, guildPlaces, type GuildPlace } from "./guild-scene";
import { GuildGardenScene, gardenSites, type GardenSite } from "./guild-garden-scene";
import type { GuildProps } from "./guild-controls";
import { guildLevel } from "@/lib/guild-content";
import { guildUnlocked } from "@/lib/guild-base";
import type { Story } from "@/lib/stories";

type PanelProps = GuildProps & { onOpen: (story: Story) => void; now: number };
type FacilityProps = PanelProps & {
  place: GuildPlace | null;
  site: GardenSite;
  onClose: () => void;
  onRestoreFocus: () => void;
};
function GuildFacility({ place, site, onOpen, onClose, onRestoreFocus, ...props }: FacilityProps) {
  return (
    <Dialog
      open={place !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="phone-dialog guild-detail"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {place === "garden" ? gardenSites[site] : place ? guildPlaces[place] : "旅団"}
          </DialogTitle>
          <DialogDescription>仲間と整える、次の冒険の支度。</DialogDescription>
        </DialogHeader>
        {place === "garden" && <GuildGarden {...props} site={site} />}
        {place === "workbench" && <GuildWorkbench {...props} />}
        {place === "shop" && <GuildShop {...props} />}
        {place === "stories" && <GuildConversations state={props.state} onOpen={onOpen} />}
      </DialogContent>
    </Dialog>
  );
}
function useGuildView(onOpen: (story: Story) => void) {
  const [place, setPlace] = useState<GuildPlace | null>(null),
    [view, setView] = useState<"home" | "garden">("home"),
    [site, setSite] = useState<GardenSite>("linde");
  const panel = useRef<HTMLDivElement>(null),
    lastLabel = useRef("菜園"),
    openingStory = useRef(false);
  const visit = (next: GuildPlace) => {
    lastLabel.current = next === "garden" ? "菜園の世話をする" : guildPlaces[next];
    openingStory.current = false;
    setPlace(next);
  };
  const read = (story: Story) => {
    openingStory.current = true;
    setPlace(null);
    onOpen(story);
  };
  const restoreFocus = () => {
    if (!openingStory.current)
      panel.current
        ?.querySelector<HTMLButtonElement>(`[aria-label="${lastLabel.current}"]`)
        ?.focus();
  };
  return { place, setPlace, view, setView, site, setSite, panel, visit, read, restoreFocus };
}
export function GuildPanel(props: PanelProps) {
  const { state, now } = props;
  const { place, setPlace, view, setView, site, setSite, panel, visit, read, restoreFocus } =
    useGuildView(props.onOpen);
  if (!guildUnlocked(state)) return null;
  return (
    <div className="guild-panel" ref={panel}>
      <GuildHeading state={state} title={view === "home" ? "星灯りの旅団" : gardenSites[site]} />
      {view === "home" ? (
        <GuildScene
          state={state}
          now={now}
          onVisit={(next) => {
            if (next === "garden") setView("garden");
            else visit(next);
          }}
        />
      ) : (
        <GuildGardenScene
          state={state}
          now={now}
          site={site}
          onSite={setSite}
          onHome={() => {
            setView("home");
          }}
          onTend={() => {
            visit("garden");
          }}
          onShop={() => {
            visit("shop");
          }}
        />
      )}
      <p className="guild-scene-hint">気になる場所をタップして、仲間の仕事をのぞいてみよう。</p>
      <GuildFacility
        {...props}
        place={place}
        site={site}
        onOpen={read}
        onClose={() => {
          setPlace(null);
        }}
        onRestoreFocus={restoreFocus}
      />
    </div>
  );
}

function GuildHeading({ state, title }: { state: GuildProps["state"]; title: string }) {
  return (
    <header className="guild-heading">
      <h2>{title}</h2>
      <p>
        F級{" "}
        <span>
          栽培 Lv.{guildLevel(state.guild?.cultivation ?? 0)} · 加工 Lv.
          {guildLevel(state.guild?.crafting ?? 0)}
        </span>
      </p>
    </header>
  );
}
