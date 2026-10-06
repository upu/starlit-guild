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
  onShop: () => void;
  onBack?: () => void;
};
function GuildFacility({
  sheet,
  site,
  onClose,
  onRestoreFocus,
  onShop,
  onBack,
  ...props
}: FacilityProps) {
  const [choices, setChoices] = useState<Record<string, string>>({});
  const selection = {
    selected: sheet ? choices[sheet] : undefined,
    onSelect: (id: string) => {
      if (sheet) setChoices((previous) => ({ ...previous, [sheet]: id }));
    },
  };
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
        {sheet && isPlot(sheet) && (
          <GuildGarden key={sheet} {...props} {...selection} id={sheet} onShop={onShop} />
        )}
        {sheet === "workbench" && <GuildWorkbench {...props} {...selection} onShop={onShop} />}
        {sheet === "shop" && onBack && (
          <button className="guild-return" onClick={onBack}>
            ← 仕込みに戻る
          </button>
        )}
        {sheet === "shop" && <GuildShop {...props} />}
        {sheet === "roles" && <GuildRolePicker {...props} role={site} />}
      </DialogContent>
    </Dialog>
  );
}
function useGuildView() {
  const [sheet, setSheet] = useState<Sheet | null>(null),
    [shopReturn, setShopReturn] = useState<Sheet | null>(null),
    [view, setView] = useState<"home" | "garden">("home"),
    [site, setSite] = useState<GardenSite>("linde");
  const panel = useRef<HTMLDivElement>(null),
    lastControl = useRef<Sheet>("workbench");
  const visit = (next: Sheet) => {
    setShopReturn(null);
    lastControl.current = next;
    setSheet(next);
  };
  const restoreFocus = () => {
    panel.current
      ?.querySelector<HTMLButtonElement>(`[data-guild-control="${lastControl.current}"]`)
      ?.focus();
  };
  const openShop = () => {
    setShopReturn(sheet);
    setSheet("shop");
  };
  const back = shopReturn
    ? () => {
        setSheet(shopReturn);
        setShopReturn(null);
      }
    : undefined;
  return {
    sheet,
    setSheet,
    view,
    setView,
    site,
    setSite,
    panel,
    visit,
    restoreFocus,
    openShop,
    back,
  };
}
export function GuildPanel(props: PanelProps) {
  const { state, now } = props;
  const { panel, ...v } = useGuildView();
  if (!guildUnlocked(state)) return null;
  return (
    <div className={`guild-panel guild-view-${v.view}`} ref={panel}>
      <GuildHeading
        state={state}
        title={v.view === "home" ? "星灯りの旅団" : gardenSites[v.site]}
      />
      {v.view === "home" ? (
        <GuildScene
          state={state}
          now={now}
          onWorkbench={() => {
            v.visit("workbench");
          }}
        />
      ) : (
        <GuildGardenScene
          state={state}
          now={now}
          site={v.site}
          onSite={v.setSite}
          onPlot={v.visit}
          onRoles={() => {
            v.visit("roles");
          }}
        />
      )}
      {v.view === "home" && (
        <GuildChat {...props} paused={props.paused === true || v.sheet !== null} />
      )}
      <GuildToolbar
        garden={v.view === "garden"}
        onHome={() => {
          v.setView("home");
        }}
        onGarden={() => {
          v.setView("garden");
        }}
        onShop={() => {
          v.visit("shop");
        }}
      />
      <GuildFacility
        {...props}
        sheet={v.sheet}
        site={v.site}
        onClose={() => {
          v.setSheet(null);
        }}
        onRestoreFocus={v.restoreFocus}
        onShop={v.openShop}
        onBack={v.back}
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
