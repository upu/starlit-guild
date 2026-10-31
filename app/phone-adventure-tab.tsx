import { useState, type ReactNode } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { useGardenDialogue } from "./use-garden-dialogue";
import { MapStage } from "./map-stage";
import { AdventureBanter } from "./phone-adventure-banter";
import { waitsForScene } from "./phone-restoration-mode";
import type { RendererStatus } from "./phaser/renderer-session";
import type { TownActivity } from "@/lib/road-town-activity";
import type { PhoneFrameModel } from "./phone-game-types";
import type { useRestorationHandoff } from "./use-restoration-handoff";

type AdventureTabProps = {
  model: PhoneFrameModel;
  restoration: ReturnType<typeof useRestorationHandoff>;
  nightBridgeStudy: boolean;
  lindeStudy: boolean;
  lanternStudy: boolean;
  reviewPaused?: boolean;
  children: ReactNode;
};
const seedlingScene = (model: PhoneFrameModel) =>
  model.run?.quest === "merrill-seedlings" ? "true" : undefined;
function adventurePaused(model: PhoneFrameModel, waiting: boolean, reviewPaused: boolean) {
  return reviewPaused || !!model.sheet || !!model.returnIntent || (!!model.ending && !waiting);
}
export function AdventureTab({
  model: m,
  restoration,
  nightBridgeStudy,
  lindeStudy,
  lanternStudy,
  reviewPaused = false,
  children,
}: AdventureTabProps) {
  const [rendererStatus, setRendererStatus] = useState<RendererStatus>("loading");
  const [townActivity, setTownActivity] = useState<TownActivity | null>(null);
  const moss = useGardenDialogue(
    m,
    restoration.waiting && restoration.quest === "lico-records" ? restoration.squad : null,
  );
  const visualLoading =
    waitsForScene(restoration.quest, restoration.active, rendererStatus) ||
    (!!moss.key && rendererStatus === "loading");
  return (
    <TabsContent
      value="adventure"
      className={"phone-adventure" + (m.run ? " phone-adventure-running" : "")}
      data-restoration-scene={
        restoration.active && restoration.quest === "berne-restoration" ? "true" : undefined
      }
      data-records-scene={
        restoration.active && restoration.quest === "lico-records" ? "true" : undefined
      }
      data-seedling-battle={seedlingScene(m)}
    >
      <MapStage
        state={m.state}
        squad={m.squad}
        now={m.clock}
        ready={m.ready}
        onAction={m.act}
        startQuest={m.quest.id}
        paused={adventurePaused(m, restoration.waiting, reviewPaused)}
        restoration={restoration}
        nightBridgeStudy={nightBridgeStudy}
        lindeStudy={lindeStudy}
        lanternStudy={lanternStudy}
        onRendererStatus={setRendererStatus}
        mossBedsDialogue={moss.moss}
        recordsDialogue={moss.records}
        merrillSinging={moss.merrillSinging}
        onTownActivity={setTownActivity}
      />
      <AdventureBanter
        model={m}
        restoration={restoration}
        visualLoading={visualLoading}
        recordsPatient={moss.records.patient}
        onCurrentLine={moss.key ? moss.onLine : undefined}
        townActivity={townActivity}
      />
      {children}
    </TabsContent>
  );
}
