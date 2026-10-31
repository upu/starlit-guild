import { guildUnlocked } from "@/lib/guild-base";
import type { ComponentProps } from "react";
import { GuildPanel } from "./guild-panel";
import Image from "next/image";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CompanionsTab } from "./phone-companions-tab";
import { ShopEntry } from "./shop-entry";
import { QuestCompletion } from "./quest-completion";
import { Toaster } from "@/components/ui/sonner";
import { StoryLibrary } from "./story-scenes";
import { AdventureTab } from "./phone-adventure-tab";
import { useStoryAdvance } from "./use-story-advance";
import { StoryHeading } from "./story-heading";
import { storyProgress } from "@/lib/stories";
import { TRADE_QUEST } from "@/lib/prologue";
import { allQuests } from "@/lib/game";
import { ReturnDialog } from "./phone-return-dialog";
import { resolveSheet } from "./phone-game-sheets";
import type { Game, PhoneFrameModel } from "./phone-game-types";
import { useRestorationHandoff } from "./use-restoration-handoff";
import { chapterThreeHandoffs, chapterFourHandoff, handoffQuest } from "./phone-restoration-mode";
type RestorationHandoff = ReturnType<typeof useRestorationHandoff>;

function PhoneHeader({ model: m }: { model: PhoneFrameModel }) {
  return (
    <header className={"phone-header" + (m.view === "adventure" ? " phone-header-overlay" : "")}>
      <button
        className="handbook-button bag-button"
        onClick={() => {
          m.setSheet("bag");
        }}
        aria-label="持ちものを開く"
      >
        <Image src="/ui/bag-satchel.png" width={32} height={32} alt="" unoptimized />
      </button>
      <button
        className="handbook-button"
        onClick={() => {
          m.setSheet("book");
        }}
        aria-label="旅の手帳：ヒント・思い出・アルバム・設定"
      >
        <Image src="/ui/travel-handbook.png" width={32} height={32} alt="" unoptimized />
        {(m.game.error || m.hints.unread) && <i className="unread-dot" aria-hidden="true" />}
      </button>
    </header>
  );
}
function GameNotice({ game }: { game: Game }) {
  if (!game.error && !game.otherTab) return null;
  return (
    <div className="phone-notice" role="status">
      <span>{game.otherTab ? "別のタブで冒険中です" : game.error}</span>
      {game.otherTab && <button onClick={game.takeOver}>ここで続ける</button>}
    </div>
  );
}
type FirstDepartureGuide = "quest" | "departure" | null;
function firstDepartureGuide(m: PhoneFrameModel): FirstDepartureGuide {
  if (
    m.sheet ||
    m.ending ||
    m.run ||
    storyProgress(m.state).departed.length ||
    m.state.done[TRADE_QUEST]
  )
    return null;
  return m.destinationChosen ? "departure" : "quest";
}
function firstDepartureBubble(guide: FirstDepartureGuide) {
  if (guide === "quest")
    return (
      <div className="quest-tutorial quest-tutorial-quest" id="first-quest-guide" role="status">
        まず「クエスト」で
        <br />
        <b>行き先を選ぼう</b>
      </div>
    );
  if (guide === "departure")
    return (
      <div
        className="quest-tutorial quest-tutorial-departure"
        id="first-departure-guide"
        role="status"
      >
        行き先を選んだら
        <br />
        <b>「出発」で冒険開始！</b>
      </div>
    );
  return null;
}
function adventurePrimaryAction(m: PhoneFrameModel, guide: FirstDepartureGuide) {
  if (m.run)
    return (
      <button
        className="outline return-button"
        aria-label="帰還"
        disabled={!m.ready}
        onClick={() => {
          m.requestReturn("adventure");
        }}
      >
        <Image src="/ui/return-house.png" width={32} height={32} alt="" unoptimized />
        <span>帰還</span>
      </button>
    );
  if (!m.destinationChosen) return null;
  return (
    <button
      className={"departure-button" + (guide === "departure" ? " departure-button-guided" : "")}
      aria-label="出発"
      aria-describedby={guide === "departure" ? "first-departure-guide" : undefined}
      disabled={!m.ready || !!m.ending || !!m.sheet}
      onClick={() => {
        m.act({ type: "start", id: m.quest.id, squad: m.squad.id });
      }}
    >
      <Image src="/ui/departure-boot.png" width={32} height={32} alt="" unoptimized />
      <span>出発</span>
    </button>
  );
}
export function AdventureDestination({
  model: m,
  restoration,
}: {
  model: PhoneFrameModel;
  restoration?: RestorationHandoff;
}) {
  const guide = firstDepartureGuide(m),
    obscured = !!m.sheet || !!m.ending;
  return (
    <div className="adventure-actions" aria-label="冒険の操作">
      <button
        className={"outline quest-entry" + (guide === "quest" ? " quest-entry-guided" : "")}
        aria-label="クエストを開く"
        aria-describedby={guide === "quest" ? "first-quest-guide" : undefined}
        onClick={() => {
          m.openQuests();
        }}
      >
        <Image
          src="/ui/quest-scroll.png"
          width={32}
          height={32}
          alt=""
          loading="eager"
          unoptimized
        />
        <span>クエスト</span>
      </button>
      <ShopEntry
        state={m.state}
        profileId={m.game.profile?.id}
        obscured={obscured}
        onOpen={() => {
          m.setSheet("shop");
        }}
      />
      {restoration?.waiting ? (
        <button className="outline" onClick={restoration.skip}>
          演出をスキップ
        </button>
      ) : (
        adventurePrimaryAction(m, guide)
      )}
      {firstDepartureBubble(guide)}
    </div>
  );
}
function MemoriesTab({ model: m }: { model: PhoneFrameModel }) {
  return (
    <TabsContent value="memories" className="phone-memories">
      <div className="screen-heading">
        <h2>旅の思い出</h2>
      </div>
      <StoryLibrary state={m.state} onOpen={m.openStory} />
    </TabsContent>
  );
}
function GameTabs(props: Omit<ComponentProps<typeof AdventureTab>, "children">) {
  const { model: m, restoration } = props;
  return (
    <Tabs className="phone-tabs" value={m.view} onValueChange={m.navigate}>
      <PhoneHeader model={m} />
      <div className="phone-screen">
        <AdventureTab {...props}>
          <AdventureDestination model={m} restoration={restoration} />
        </AdventureTab>
        <CompanionsTab model={m} />
        {guildUnlocked(m.state) && (
          <TabsContent value="guild" className="phone-guild">
            <GuildPanel
              key={m.game.profile?.id}
              state={m.state}
              paused={!!m.sheet || !!m.ending}
              ready={m.ready}
              onAction={m.act}
              now={m.clock}
            />
          </TabsContent>
        )}
        <MemoriesTab model={m} />
      </div>
      <TabsList
        className={"phone-navigation" + (guildUnlocked(m.state) ? " guild-navigation" : "")}
      >
        <TabsTrigger value="adventure">
          <Image src="/ui/adventure-compass.png" width={32} height={32} alt="" unoptimized />
          <span>冒険</span>
        </TabsTrigger>
        <TabsTrigger value="companions">
          <Image src="/ui/characters-silhouette.png" width={32} height={32} alt="" unoptimized />
          <span>キャラクター</span>
        </TabsTrigger>
        {guildUnlocked(m.state) && (
          <TabsTrigger value="guild">
            <Image src="/ui/guild-banner.svg" width={32} height={32} alt="" unoptimized />
            <span>旅団</span>
          </TabsTrigger>
        )}
      </TabsList>
    </Tabs>
  );
}
export function SheetDialog({ model: m }: { model: PhoneFrameModel }) {
  const { readerRef, onPointerDownOutside } = useStoryAdvance(),
    conversation = m.sheet === "story";
  const { title, description, content } = resolveSheet(m, readerRef);
  return (
    <Dialog
      open={!!m.sheet && !m.ending}
      onOpenChange={(open) => {
        if (!open && m.sheet !== "story") m.setSheet(null);
      }}
    >
      <DialogContent
        {...(!description ? { "aria-describedby": undefined } : {})}
        showCloseButton={m.sheet !== "story"}
        onOpenAutoFocus={(event) => {
          // Focusing the chapter select on open pops its picker on phones; hold focus on the dialog.
          if (m.sheet !== "quests") return;
          event.preventDefault();
          (event.currentTarget as HTMLElement).focus({ preventScroll: true });
        }}
        onPointerDownOutside={conversation ? onPointerDownOutside : undefined}
        onInteractOutside={(event) => {
          if (conversation) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (m.sheet === "story") event.preventDefault();
        }}
        className={
          "phone-dialog" +
          (conversation ? " story-dialog" : "") +
          (m.sheet === "quests" ? " quest-dialog" : "") +
          (m.sheet === "shop" ? " shop-dialog" : "")
        }
      >
        {conversation ? (
          <StoryHeading title={title} description={description} readerRef={readerRef} />
        ) : (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {content}
      </DialogContent>
    </Dialog>
  );
}
function EndingDialog({
  model: m,
  restoration,
}: {
  model: PhoneFrameModel;
  restoration: RestorationHandoff;
}) {
  if (!m.ending || restoration.waiting) return null;
  const ending = m.ending;
  return (
    <QuestCompletion
      key={(m.game.profile?.id ?? "unassigned") + ":" + ending.id}
      story={ending}
      questName={allQuests.find((q) => q.id === ending.quest)?.name ?? ending.title}
      ready={m.ready}
      completedAdventure={restoration.completed ? restoration.quest : undefined}
      onRead={() => m.readStory(ending.id)}
      onClose={() => {
        m.setSheet(null);
      }}
    />
  );
}
function chapterOneHandoff(m: PhoneFrameModel, studies: boolean[], quest: string) {
  return !studies.some(Boolean) && (m.squad.run?.quest ?? m.ending?.quest ?? m.quest.id) === quest;
}
function chapterOneModes(m: PhoneFrameModel, studies: boolean[]) {
  return {
    town: chapterOneHandoff(m, studies, "town-deliveries"),
    moss: chapterOneHandoff(m, studies, "tower-moss-removal"),
    forest: chapterOneHandoff(m, studies, "forest-wetland"),
    waterwaySearch: chapterOneHandoff(m, studies, "old-waterway"),
  };
}
export function PhoneFrame({
  model: m,
  restorationStudy = false,
  nightBridgeStudy = false,
  lindeStudy = false,
  lanternStudy = false,
  reviewPaused = false,
}: {
  model: PhoneFrameModel;
  restorationStudy?: boolean;
  nightBridgeStudy?: boolean;
  lindeStudy?: boolean;
  lanternStudy?: boolean;
  /** Freeze only the sprite-lab trial together with its separately stopped clock. */
  reviewPaused?: boolean;
}) {
  const otherStudy = lindeStudy || lanternStudy;
  const studies = [restorationStudy, nightBridgeStudy, otherStudy];
  const { town, moss, forest, waterwaySearch } = chapterOneModes(m, studies);
  const third = chapterThreeHandoffs(m, restorationStudy, nightBridgeStudy, otherStudy);
  const thirdRestoration = third.berne || third.foundation;
  const fourth = chapterFourHandoff(m, thirdRestoration, third.night, lindeStudy, lanternStudy);
  const { linde, lantern, brekka, trail, secondDay, records, seedlings, founding } = fourth;
  const restoration = useRestorationHandoff(
    m,
    Object.values({ ...third, ...fourth, town, moss, forest, waterwaySearch }).some(Boolean),
    handoffQuest(
      third.night,
      lantern,
      linde,
      brekka,
      trail,
      secondDay,
      records,
      seedlings,
      founding,
      town,
      moss,
      third.foundation,
      forest,
      waterwaySearch,
    ),
  );
  return (
    <main className="phone-game prologue-game">
      <Toaster theme="dark" position="top-center" />
      <GameNotice game={m.game} />
      <GameTabs
        model={m}
        restoration={restoration}
        nightBridgeStudy={nightBridgeStudy}
        lindeStudy={linde}
        lanternStudy={lantern}
        reviewPaused={reviewPaused}
      />
      <SheetDialog model={m} />
      <EndingDialog model={m} restoration={restoration} />
      <ReturnDialog model={m} />
    </main>
  );
}
