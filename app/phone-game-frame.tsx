import { consumableNotice } from "@/lib/consumable-effects";
import Image from "next/image";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { CharacterPanel } from "./equipment-panels";
import { ShopEntry } from "./shop-entry";
import { QuestCompletion } from "./quest-completion";
import { Toaster } from "@/components/ui/sonner";
import { MapStage } from "./map-stage";
import { Banter, StoryLibrary } from "./story-scenes";
import { pumpetyBattleBanter } from "@/lib/pumpety-battle-banter";
import { chapterFourBattleBanter } from "@/lib/chapter-four-battle-banter";
import { useStoryAdvance } from "./use-story-advance";
import { StoryHeading } from "./story-heading";
import { storyProgress } from "@/lib/stories";
import { TRADE_QUEST } from "@/lib/prologue";
import { allQuests, squadName } from "@/lib/game";
import { resolveSheet } from "./phone-game-sheets";
import type { Game, PhoneFrameModel } from "./phone-game-types";

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
export function AdventureDestination({ model: m }: { model: PhoneFrameModel }) {
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
      {adventurePrimaryAction(m, guide)}
      {firstDepartureBubble(guide)}
    </div>
  );
}
function AdventureBanter({ model: m }: { model: PhoneFrameModel }) {
  const notice = consumableNotice(m.state, m.clock);
  if (!m.banter.length)
    return (
      <div className="phone-banter">
        <p role={notice ? "status" : undefined}>{notice || m.quote}</p>
      </div>
    );
  return (
    <Banter
      key={(m.game.profile?.id || "") + ":" + m.squad.id + ":" + (m.run?.quest || "idle")}
      lines={m.banter}
      notice={notice}
      retain={!!m.run && !!(chapterFourBattleBanter(m.run) || pumpetyBattleBanter(m.run))}
      paused={!!m.sheet || !!m.ending || !m.ready}
    />
  );
}
function AdventureTab({ model: m }: { model: PhoneFrameModel }) {
  return (
    <TabsContent
      value="adventure"
      className={"phone-adventure" + (m.run ? " phone-adventure-running" : "")}
    >
      <MapStage
        state={m.state}
        squad={m.squad}
        now={m.clock}
        ready={m.ready}
        onAction={m.act}
        startQuest={m.quest.id}
        paused={!!m.sheet || !!m.returnIntent || !!m.ending}
      />
      <AdventureBanter model={m} />
      <AdventureDestination model={m} />
    </TabsContent>
  );
}
function CompanionsTab({ model: m }: { model: PhoneFrameModel }) {
  return (
    <TabsContent value="companions" className="phone-characters">
      <CharacterPanel state={m.state} ready={m.ready} onAction={m.act} />
    </TabsContent>
  );
}
function GameTabs({ model: m }: { model: PhoneFrameModel }) {
  return (
    <Tabs className="phone-tabs" value={m.view} onValueChange={m.navigate}>
      <PhoneHeader model={m} />
      <div className="phone-screen">
        <AdventureTab model={m} />
        <CompanionsTab model={m} />
        <TabsContent value="memories" className="phone-memories">
          <div className="screen-heading">
            <h2>旅の思い出</h2>
          </div>
          <StoryLibrary state={m.state} onOpen={m.openStory} />
        </TabsContent>
      </div>
      <TabsList className="phone-navigation">
        <TabsTrigger value="adventure">
          <Image src="/ui/adventure-compass.png" width={32} height={32} alt="" unoptimized />
          <span>冒険</span>
        </TabsTrigger>
        <TabsTrigger value="companions">
          <Image src="/ui/characters-silhouette.png" width={32} height={32} alt="" unoptimized />
          <span>キャラクター</span>
        </TabsTrigger>
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
function EndingDialog({ model: m }: { model: PhoneFrameModel }) {
  if (!m.ending) return null;
  const ending = m.ending;
  return (
    <QuestCompletion
      key={(m.game.profile?.id ?? "unassigned") + ":" + ending.id}
      story={ending}
      questName={allQuests.find((q) => q.id === ending.quest)?.name ?? ending.title}
      ready={m.ready}
      onRead={() => m.readStory(ending.id)}
      onClose={() => {
        m.setSheet(null);
      }}
    />
  );
}
function ReturnDialog({ model: m }: { model: PhoneFrameModel }) {
  const intent = m.returnIntent;
  const title =
    intent?.destination === "companions"
      ? "帰還して編成しますか？"
      : intent?.quest
        ? "帰還して行き先を変えますか？"
        : "帰還しますか？";
  const target = m.state.squads.find((p) => p.id === intent?.squad);
  return (
    <AlertDialog
      open={!!intent}
      onOpenChange={(open) => {
        if (!open) m.setReturnIntent(null);
      }}
    >
      <AlertDialogContent className="game-confirm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {target && squadName(target)}
            の確保済みの区間報酬は残ります。途中の依頼は最初からになります。
            {intent?.quest && "帰還後に行き先を選び直します。自動では出発しません。"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>冒険を続ける</AlertDialogCancel>
          <AlertDialogAction
            disabled={!m.ready}
            onClick={(e) => {
              e.preventDefault();
              m.confirmReturn();
            }}
          >
            {intent?.destination === "companions" ? "帰還して編成する" : "帰還する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
export function PhoneFrame({ model: m }: { model: PhoneFrameModel }) {
  return (
    <main className="phone-game prologue-game">
      <Toaster theme="dark" position="top-center" />
      <GameNotice game={m.game} />
      <GameTabs model={m} />
      <SheetDialog model={m} />
      <EndingDialog model={m} />
      <ReturnDialog model={m} />
    </main>
  );
}
