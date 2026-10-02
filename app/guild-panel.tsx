import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GuildGarden } from "./guild-garden";
import { GuildWorkbench } from "./guild-workbench";
import { GuildShop } from "./guild-shop";
import { GuildChat } from "./guild-chat";
import { GuildToolbar } from "./guild-toolbar";
import { GuildScene, guildPlaces, type GuildPlace } from "./guild-scene";
import { GuildGardenScene, gardenSites, type GardenSite } from "./guild-garden-scene";
import { GuildRolePicker, type GuildProps } from "./guild-controls";
import { guildLevel, guildPlots, type GuildPlotId } from "@/lib/guild-content";
import { guildUnlocked } from "@/lib/guild-base";
import { plotName } from "./guild-plot-view";

type PanelProps = GuildProps & { now: number; paused?: boolean };
type Sheet = GuildPlace | GuildPlotId;
const isPlot = (sheet: Sheet): sheet is GuildPlotId => guildPlots.some((id) => id === sheet);
type FacilityProps = PanelProps & {
  sheet: Sheet | null;
  site: GardenSite;
  onClose: () => void;
  onRestoreFocus: () => void;
};
function GuildFacility({ sheet, site, onClose, onRestoreFocus, ...props }: FacilityProps) {
  return (
    <Dialog
      open={sheet !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="phone-dialog guild-detail"
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onRestoreFocus();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {sheet ? (isPlot(sheet) ? plotName(sheet) : guildPlaces[sheet]) : "旅団"}
          </DialogTitle>
        </DialogHeader>
        {sheet && isPlot(sheet) && <GuildGarden key={sheet} {...props} id={sheet} />}
        {sheet === "workbench" && <GuildWorkbench {...props} />}
        {sheet === "shop" && <GuildShop {...props} />}
        {sheet === "roles" && <GuildRolePicker {...props} role={site} />}
      </DialogContent>
    </Dialog>
  );
}
function useGuildView() {
  const [sheet, setSheet] = useState<Sheet | null>(null),
    [view, setView] = useState<"home" | "garden">("home"),
    [site, setSite] = useState<GardenSite>("linde");
  const panel = useRef<HTMLDivElement>(null),
    lastControl = useRef<Sheet>("workbench");
  const visit = (next: Sheet) => {
    lastControl.current = next;
    setSheet(next);
  };
  const restoreFocus = () => {
    panel.current
      ?.querySelector<HTMLButtonElement>(`[data-guild-control="${lastControl.current}"]`)
      ?.focus();
  };
  return { sheet, setSheet, view, setView, site, setSite, panel, visit, restoreFocus };
}
export function GuildPanel(props: PanelProps) {
  const { state, now } = props;
  const { sheet, setSheet, view, setView, site, setSite, panel, visit, restoreFocus } =
    useGuildView();
  if (!guildUnlocked(state)) return null;
  return (
    <div className={`guild-panel guild-view-${view}`} ref={panel}>
      <GuildHeading state={state} title={view === "home" ? "星灯りの旅団" : gardenSites[site]} />
      {view === "home" ? (
        <GuildScene
          state={state}
          now={now}
          onAction={props.onAction}
          ready={props.ready}
          onWorkbench={() => {
            visit("workbench");
          }}
        />
      ) : (
        <GuildGardenScene
          state={state}
          now={now}
          site={site}
          onSite={setSite}
          onPlot={visit}
          onRoles={() => {
            visit("roles");
          }}
        />
      )}
      {view === "home" && <GuildChat {...props} paused={props.paused === true || sheet !== null} />}
      <GuildToolbar
        garden={view === "garden"}
        onHome={() => {
          setView("home");
        }}
        onGarden={() => {
          setView("garden");
        }}
        onShop={() => {
          visit("shop");
        }}
      />
      <GuildFacility
        {...props}
        sheet={sheet}
        site={site}
        onClose={() => {
          setSheet(null);
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
