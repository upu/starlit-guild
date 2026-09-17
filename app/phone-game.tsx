"use client";
import { equippedTechnique, techniqueById } from "@/lib/techniques";
import { useState, type Dispatch, type ReactNode, type Ref, type SetStateAction } from "react";
import Image from "next/image";
import { BookOpen, ChevronRight, Heart, House, Lightbulb, Images } from "lucide-react";
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
import { CharacterPanel, InventoryPanel, ShopPanel } from "./equipment-panels";
import { ShopEntry } from "./shop-entry";
import { QuestPicker } from "./quest-picker";
import { QuestCompletion } from "./quest-completion";
import { Toaster } from "@/components/ui/sonner";
import { SavePanel } from "./save-panel";
import { useGameMusic } from "./use-game-music";
import { useJourneyHints } from "./use-journey-hints";
import { MapStage } from "./map-stage";
import { Banter, StoryLibrary, StoryAlbum, ConversationReader, StoryReader } from "./story-scenes";
import { useStoryAdvance, type StoryAdvance } from "./use-story-advance";
import { StoryHeading } from "./story-heading";
import {
  availableStories,
  characterNotes,
  journeyBanter,
  stories,
  storyProgress,
  together,
  type Story,
  type StoryLine,
} from "@/lib/stories";
import { Sprite } from "./sprite";
import { InstallGuide, useInstallPrompt } from "./install-guide";
import { nextGoal, questAdvice, type JourneyGoal } from "@/lib/journey";
import type { Action, State, Squad } from "@/lib/game";
import type { useLocalGame } from "./use-local-game";
import { TRADE_QUEST, isPrologueQuest, stageEndingPending, restingQuest } from "@/lib/prologue";
import {
  heroes,
  availableQuests,
  allQuests,
  heroSkills,
  memberStats,
  activeBonds,
  squadName,
} from "@/lib/game";
type Game = ReturnType<typeof useLocalGame>;
type Sheet =
  | "book"
  | "quests"
  | "party"
  | "bag"
  | "shop"
  | "journal"
  | "build"
  | "upgrade"
  | "gift"
  | "recruit"
  | "help"
  | "goal"
  | "preview"
  | "advice"
  | "install"
  | "stories"
  | "album"
  | "story"
  | "banter"
  | "personality"
  | null;
type ReturnIntent = { squad: string; destination: "adventure" | "companions"; quest?: string };
type SheetView = { title: string; description: string; content: ReactNode };
const fmt = (n: number) => Math.floor(n).toLocaleString("ja-JP");

function startAction(action: Action) {
  return action.type === "start" ? { ...action, value: !isPrologueQuest(action.id || "") } : action;
}
function departureStory(state: State, action: Action) {
  const actionId = action.id;
  if (action.type !== "start" || !actionId) return null;
  const target = state.squads.find((p) => p.id === action.squad) || state.squads[0];
  if (target.run || !together(target.members) || storyProgress(state).departed.includes(actionId))
    return null;
  return stories.find((st) => st.id === actionId + "-departure") ?? null;
}
function selectedDestination(state: State, squad: Squad, choice?: string) {
  return squad.run?.quest || choice || squad.lastQuest || restingQuest(state, squad);
}
function hasDestination(state: State, squad: Squad, choice?: string) {
  return !!choice || !!squad.lastQuest || !!state.done[restingQuest(state, squad)];
}
type SheetModel = {
  sheet: Sheet;
  reading: Story | null;
  ready: boolean;
  pendingDeparture: Action | null;
  activeQuest: (typeof allQuests)[number] | undefined;
  banterSnapshot: StoryLine[];
  hero: (typeof heroes)[number];
  state: State;
  goal: ReturnType<typeof nextGoal>;
  installStatus: ReturnType<typeof useInstallPrompt>;
  game: Game;
  music: ReturnType<typeof useGameMusic>;
  unread: number;
  hints: ReturnType<typeof useJourneyHints>;
  setSheet: (sheet: Sheet) => void;
  openStory: (story: Story) => void;
  finishStory: () => boolean;
  closeStory: () => void;
  navigate: (view: string) => void;
  followGoal: (goal: JourneyGoal) => void;
  quest: (typeof allQuests)[number];
  squad: Squad;
  run: Squad["run"];
  act: (action: Action, onSuccess?: (state: State) => void) => boolean;
  candidateQuest: string;
  setCandidateQuest: (id: string) => void;
  selectQuest: (id?: string) => void;
  clock: number;
  openQuests: (id?: string) => void;
  readStory: (id: string) => boolean;
  setView: (view: string) => void;
};
type PhoneFrameModel = SheetModel & {
  view: string;
  returnIntent: ReturnIntent | null;
  ending: Story | null;
  banter: StoryLine[];
  quote: string;
  destinationChosen: boolean;
  roster: (typeof heroes)[number][];
  setBanterSnapshot: Dispatch<SetStateAction<StoryLine[]>>;
  setHeroIndex: Dispatch<SetStateAction<number>>;
  requestReturn: (destination: "adventure" | "companions", quest?: string) => void;
  confirmReturn: () => void;
  setReturnIntent: Dispatch<SetStateAction<ReturnIntent | null>>;
};
function storySheet(m: SheetModel, advanceRef: Ref<StoryAdvance>): SheetView | null {
  if (m.sheet === "book")
    return {
      title: "旅の手帳",
      description: "旅の記録と、手助けのヒント。",
      content: (
        <div className="handbook-menu">
          <button
            className="outline"
            onClick={() => {
              m.hints.markRead();
              m.setSheet("goal");
            }}
          >
            <Lightbulb size={20} />
            <span>ヒント</span>
            <ChevronRight size={16} />
          </button>
          <button
            className="outline"
            onClick={() => {
              m.setSheet("stories");
            }}
          >
            <BookOpen size={20} />
            <span>思い出{m.unread > 0 && ` · 未読 ${String(m.unread)}`}</span>
            <ChevronRight size={16} />
          </button>
          <button
            className="outline"
            onClick={() => {
              m.setSheet("album");
            }}
          >
            <Images size={20} />
            <span>アルバム</span>
            <ChevronRight size={16} />
          </button>
          <SavePanel game={m.game} music={m.music} />
        </div>
      ),
    };
  if (m.sheet === "album")
    return {
      title: "アルバム",
      description: "旅で出会った景色を眺める",
      content: (
        <StoryAlbum
          state={m.state}
          onBack={() => {
            m.setSheet("book");
          }}
        />
      ),
    };
  if (m.sheet === "stories")
    return {
      title: "旅の思い出",
      description: "出会いも、冒険も、帰ってきた日のことも。",
      content: (
        <>
          <button
            className="outline"
            onClick={() => {
              m.setSheet("journal");
            }}
          >
            旅の記録
          </button>
          <StoryLibrary state={m.state} onOpen={m.openStory} />
        </>
      ),
    };
  if (m.sheet === "story" && m.reading)
    return {
      title: m.reading.title,
      description: m.reading.place,
      content: (
        <StoryReader
          key={m.reading.id}
          story={m.reading}
          ready={m.ready}
          onRead={m.finishStory}
          departure={!!m.pendingDeparture}
          onClose={m.closeStory}
          advanceRef={advanceRef}
        />
      ),
    };
  if (m.sheet === "banter")
    return {
      title: "仲間との道中",
      description: m.activeQuest?.name || "次の冒険を待ちながら",
      content: (
        <ConversationReader
          advanceRef={advanceRef}
          lines={m.banterSnapshot}
          onClose={() => {
            m.setSheet(null);
          }}
        />
      ),
    };
  return null;
}
function heroSheet(m: SheetModel): SheetView | null {
  if (m.sheet !== "personality") return null;
  const notes = characterNotes[m.hero.id];
  const skill = ["aria", "leon"].includes(m.hero.id)
    ? (techniqueById(equippedTechnique(m.state, m.hero.id, "active") || "") ?? {
        name: "通常行動",
        description: "自動で使う技はセットされていません。",
      })
    : heroSkills[m.hero.id];
  return {
    title: m.hero.name + "のこと",
    description: m.hero.job,
    content: (
      <>
        <Sprite index={m.hero.sprite} size={88} />
        <p>{m.hero.bio}</p>
        {notes && <p>{notes.habit}</p>}
        <div className="phone-stat-row">
          {["採取", "護衛", "討伐"].map((name, i) => (
            <span key={name}>
              {name}
              <b>{memberStats(m.state, m.hero.id)[i]}</b>
            </span>
          ))}
        </div>
        <h3>{skill.name}</h3>
        <p>{skill.description}</p>
        <button
          className="outline"
          onClick={() => {
            m.navigate("memories");
          }}
        >
          旅の思い出を読む
        </button>
      </>
    ),
  };
}
function journeySheet(m: SheetModel): SheetView | null {
  if (m.sheet === "goal")
    return {
      title: m.goal.title,
      description: "冒険の次の一歩",
      content: (
        <>
          <p>{m.goal.detail}</p>
          {m.goal.destination !== "quests" && (
            <button
              className="full"
              onClick={() => {
                m.followGoal(m.goal);
              }}
            >
              {m.goal.action}
            </button>
          )}
          <button
            className="outline full"
            onClick={() => {
              m.setSheet("help");
            }}
          >
            旅の手引き・操作方法
          </button>
        </>
      ),
    };
  if (m.sheet === "install")
    return {
      title: "ホーム画面に追加",
      description: "ランタンから、いつもの冒険へ。",
      content: <InstallGuide onDownload={m.game.download} status={m.installStatus} />,
    };
  if (m.sheet === "advice")
    return {
      title: "この依頼の支度",
      description: m.quest.name,
      content: (
        <>
          <p>{questAdvice(m.state, m.squad, m.quest)}</p>
          <p>
            休憩が多いときは回復役や障壁を持つ仲間も頼りになります。編成の変更は帰還後に行えます。
          </p>
          <button
            onClick={() => {
              m.navigate("companions");
              m.setSheet(null);
            }}
          >
            仲間の編成へ
          </button>
          {m.run && (
            <button
              className="outline"
              onClick={() => {
                m.setSheet("party");
              }}
            >
              隊を選ぶ
            </button>
          )}
        </>
      ),
    };
  return null;
}
function collectionSheet(m: SheetModel): SheetView | null {
  const s = m.state;
  if (m.sheet === "quests")
    return {
      title: "クエスト",
      description: "行き先を選び、もう一度タップで決定。",
      content: (
        <QuestPicker
          state={s}
          selected={m.candidateQuest}
          onSelect={m.setCandidateQuest}
          onConfirm={m.selectQuest}
          ready={m.ready}
          onAutoNextChange={(value) => {
            m.game.dispatch({ type: "autoNextQuest", value });
          }}
        />
      ),
    };
  if (m.sheet === "bag")
    return {
      title: "持ちもの",
      description: "旅の道具と、預かっている品。",
      content: <InventoryPanel state={s} />,
    };
  if (m.sheet === "shop")
    return {
      title: "ショップ",
      description: "旅の支度を整えよう。",
      content: <ShopPanel state={s} ready={m.ready} onAction={m.act} />,
    };
  if (m.sheet === "journal")
    return {
      title: "旅団の足あと",
      description: `${String(s.clears)}件達成`,
      content: (
        <>
          <button
            className="memory-link"
            onClick={() => {
              m.setSheet("stories");
            }}
          >
            <Heart size={18} />
            旅の思い出{m.unread > 0 && <span>未読 {m.unread}</span>}
          </button>
          <div className="phone-journal">
            {s.log.map((entry, i) => (
              <article key={`${String(entry.at)}-${String(i)}`}>
                <time>
                  {new Date(entry.at).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
                <p>{entry.text}</p>
              </article>
            ))}
          </div>
        </>
      ),
    };
  return null;
}
function helpSheet(m: SheetModel): SheetView | null {
  if (m.sheet !== "help") return null;
  return {
    title: "旅の手引き",
    description: "見守るだけでも、手助けしても。",
    content: (
      <>
        <p>
          マップの空いているところや敵・素材をタップすると手助け、仲間やHP表示をタップするとパーティを回復できます。HPはキャラクターごとに持ち、タップした仲間を回復します。休憩中はマップのどこでも回復できます。
          タップでの手助けに回数制限はありません。
        </p>
        <p>1周は15地点。3地点ごとに報酬を確保します。行き先は巻物の「クエスト」から選べます。</p>
        <p>
          進行は端末に保存し、開いている間は約5分ごとにクラウドへバックアップします。画面を閉じた後は、次に開いたときに最大12時間分を集計します。
        </p>
        <button
          className="outline full"
          onClick={() => {
            m.setSheet("install");
          }}
        >
          ホーム画面に追加
        </button>
      </>
    ),
  };
}
function resolveSheet(m: SheetModel, advanceRef: Ref<StoryAdvance>) {
  return (
    storySheet(m, advanceRef) ??
    heroSheet(m) ??
    journeySheet(m) ??
    collectionSheet(m) ??
    helpSheet(m) ?? { title: "", description: "", content: null }
  );
}
export function PhoneGame({ game }: { game: Game }) {
  const installStatus = useInstallPrompt();
  const { s, clock, dispatch } = game;
  const pendingEnding = stageEndingPending(s),
    ending = pendingEnding
      ? (stories.find((st) => st.id === pendingEnding + "-return") ?? null)
      : null;
  const [pendingDeparture, setPendingDeparture] = useState<Action | null>(null);
  const [reading, setReading] = useState<Story | null>(null),
    [banterSnapshot, setBanterSnapshot] = useState<StoryLine[]>([]);
  const [view, setView] = useState("adventure"),
    [sheet, setSheet] = useState<Sheet>(null),
    [questChoices, setQuestChoices] = useState<Record<string, string>>({}),
    [heroIndex, setHeroIndex] = useState(0);
  const sq = s.squads[0],
    run = sq.run,
    ready = game.ready && !game.otherTab;
  const questId = selectedDestination(s, sq, questChoices[sq.id]);
  function setQuest(id: string) {
    setQuestChoices((current) => ({ ...current, [sq.id]: id }));
  }
  const music = useGameMusic(run ? "journey" : "camp", ready);
  const unlocked = availableQuests(s),
    q = unlocked.find((q) => q.id === questId) || unlocked[0];
  const roster = heroes.filter((h) => s.owned.includes(h.id)),
    hi = Math.min(heroIndex, roster.length - 1),
    hero = roster[hi];
  const synergy = activeBonds(sq.members);
  const [candidateQuest, setCandidateQuest] = useState(TRADE_QUEST);
  const [returnIntent, setReturnIntent] = useState<{
    squad: string;
    destination: "adventure" | "companions";
    quest?: string;
  } | null>(null);
  const activeQuest = allQuests.find((q) => q.id === run?.quest);
  const lines = synergy.length
      ? synergy.flatMap((b) => b.lines)
      : sq.members.map(
          (id) => `${heroes.find((h) => h.id === id)?.name ?? "仲間"}「さあ、次の冒険へ！」`,
        ),
    quote = lines[Math.floor(clock / 8000) % lines.length];
  const goal = nextGoal(s, sq);
  const hints = useJourneyHints(game.profile?.id, goal);
  const banter = journeyBanter(s, sq, clock),
    memories = availableStories(s),
    unread = memories.filter((st) => !storyProgress(s).read.includes(st.id)).length;
  function openStory(st: Story) {
    setReading(st);
    setSheet("story");
  }
  function act(input: Action, onSuccess?: (state: State) => void, current: State = s) {
    const action = startAction(input),
      departure = departureStory(current, action);
    if (departure) {
      setPendingDeparture(action);
      openStory(departure);
      return true;
    }
    const ok = dispatch(action, onSuccess);
    if (!ok) return false;
    if (action.type === "start" && action.id?.startsWith("join-")) {
      setView("adventure");
      setSheet(null);
    }
    return true;
  }
  function openQuests(id = q.id) {
    {
      setCandidateQuest(id);
      setView("adventure");
      setSheet("quests");
    }
  }
  function followGoal(g: JourneyGoal) {
    if (g.destination === "quests") {
      game.setReport(null);
      openQuests(g.questId || q.id);
      return;
    }
    {
      game.setReport(null);
      setSheet(null);
      if (g.questId) setQuest(g.questId);
      setView(g.destination === "party" ? "companions" : g.destination);
    }
  }
  function navigate(value: string) {
    if (value === view) {
      setSheet(null);
      return;
    }
    setSheet(null);
    setView(value);
  }
  function requestReturn(destination: "adventure" | "companions", quest?: string) {
    setReturnIntent({ squad: sq.id, destination, quest });
  }
  function confirmReturn() {
    if (!returnIntent) return;
    const target = s.squads.find((p) => p.id === returnIntent.squad);
    if (!target) return;
    if (act({ type: "stop", squad: target.id })) {
      if (returnIntent.quest) setQuest(returnIntent.quest);
      setView(returnIntent.destination);
      setSheet(null);
      setReturnIntent(null);
    }
  }
  function selectQuest(candidate = candidateQuest) {
    if (!ready) return;
    const id = unlocked.find((item) => item.id === candidate)?.id;
    if (!id) return;
    const choose = () => {
      setQuest(id);
      setSheet(null);
      setView("adventure");
    };
    if (run && run.quest !== id) {
      dispatch({ type: "stop", squad: sq.id }, (current) => {
        choose();
        act({ type: "start", squad: sq.id, id }, undefined, current);
      });
      return;
    }
    choose();
  }
  function readStory(id: string) {
    return dispatch({ type: "readStory", id }, (current) => {
      const next = current.squads.find((p) => p.id === sq.id)?.lastQuest;
      if (next && next !== sq.lastQuest) setQuest(next);
    });
  }
  function finishStory() {
    if (!reading) return false;
    const ok = pendingDeparture
      ? dispatch({ ...pendingDeparture, readDeparture: true })
      : readStory(reading.id);
    if (ok) setPendingDeparture(null);
    return ok;
  }
  function closeStory() {
    setPendingDeparture(null);
    setSheet(null);
  }
  const sheetModel: SheetModel = {
    readStory,
    sheet,
    reading,
    ready,
    pendingDeparture,
    activeQuest,
    banterSnapshot,
    hero,
    state: s,
    goal,
    installStatus,
    game,
    music,
    unread,
    hints,
    setSheet,
    openStory,
    finishStory,
    closeStory,
    navigate,
    followGoal,
    quest: q,
    squad: sq,
    run,
    act,
    candidateQuest,
    setCandidateQuest,
    selectQuest,
    clock,
    openQuests,
    setView,
  };
  const frame: PhoneFrameModel = {
    ...sheetModel,
    view,
    returnIntent,
    ending,
    banter,
    quote,
    destinationChosen: hasDestination(s, sq, questChoices[sq.id]),
    roster,
    setBanterSnapshot,
    setHeroIndex,
    requestReturn,
    confirmReturn,
    setReturnIntent,
  };
  return <PhoneFrame model={frame} />;
}
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
    m.game.report ||
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
        disabled={!m.ready}
        onClick={() => {
          m.requestReturn("adventure");
        }}
      >
        <House size={18} />
        帰還
      </button>
    );
  if (!m.destinationChosen) return null;
  return (
    <button
      className={"departure-button" + (guide === "departure" ? " departure-button-guided" : "")}
      aria-describedby={guide === "departure" ? "first-departure-guide" : undefined}
      disabled={!m.ready || !!m.ending || !!m.sheet}
      onClick={() => {
        m.act({ type: "start", id: m.quest.id, squad: m.squad.id });
      }}
    >
      出発
    </button>
  );
}
function AdventureDestination({ model: m }: { model: PhoneFrameModel }) {
  const guide = firstDepartureGuide(m),
    obscured = !!m.sheet || !!m.ending || !!m.game.report;
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
  if (!m.banter.length)
    return (
      <div className="phone-banter">
        <p>{m.quote}</p>
      </div>
    );
  return (
    <Banter
      key={(m.game.profile?.id || "") + ":" + m.squad.id + ":" + (m.run?.quest || "idle")}
      lines={m.banter}
      paused={!!m.sheet || !!m.ending || !!m.game.report || !m.ready}
      onRead={(lines) => {
        m.setBanterSnapshot(lines);
        m.setSheet("banter");
      }}
    />
  );
}
function AdventureTab({ model: m }: { model: PhoneFrameModel }) {
  return (
    <TabsContent value="adventure" className="phone-adventure">
      <MapStage
        state={m.state}
        squad={m.squad}
        now={m.clock}
        ready={m.ready}
        onAction={m.act}
        startQuest={m.quest.id}
        paused={!!m.sheet || !!m.returnIntent || !!m.game.report || !!m.ending}
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
            <button
              className="outline"
              onClick={() => {
                m.setSheet("journal");
              }}
            >
              旅の記録
            </button>
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
function SheetDialog({ model: m }: { model: PhoneFrameModel }) {
  const { readerRef, onPointerDownOutside } = useStoryAdvance(),
    conversation = m.sheet === "story" || m.sheet === "banter";
  const { title, description, content } = resolveSheet(m, readerRef);
  return (
    <Dialog
      open={!!m.sheet && !m.ending}
      onOpenChange={(open) => {
        if (!open && m.sheet !== "story") m.setSheet(null);
      }}
    >
      <DialogContent
        showCloseButton={m.sheet !== "story"}
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
          (m.sheet === "quests" ? " quest-dialog" : "")
        }
      >
        {conversation ? (
          <StoryHeading title={title} description={description} readerRef={readerRef} />
        ) : (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
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
      questName={allQuests.find((q) => q.id === ending.quest)?.name ?? "不明な依頼"}
      ready={m.ready}
      onRead={() => m.readStory(ending.id)}
      onClose={() => {
        m.game.setReport(null);
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
function ReportDialog({ model: m }: { model: PhoneFrameModel }) {
  const report = m.game.report;
  return (
    <Dialog
      open={!!report && !m.sheet && !m.ending}
      onOpenChange={(open) => {
        if (!open) m.game.setReport(null);
      }}
    >
      <DialogContent className="phone-dialog">
        <DialogHeader>
          <DialogTitle>留守の間の交易</DialogTitle>
          <DialogDescription>留守の間の冒険で集めたものです。</DialogDescription>
        </DialogHeader>
        {report && (
          <>
            <p>{report.count}件の依頼を達成</p>
            <div className="offline-loot">
              <span>{fmt(report.gold)} G</span>
              <span>薬草 {report.herbs}</span>
              <span>鉱石 {report.ore}</span>
              <span>木材 {report.wood}</span>
            </div>
            <span>仲間の経験値 +{report.xp}</span>
            {report.capped && <small>最大12時間分を集計しました。</small>}
            <button
              className="outline full"
              onClick={() => {
                m.game.setReport(null);
              }}
            >
              冒険を見守る
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
function PhoneFrame({ model: m }: { model: PhoneFrameModel }) {
  return (
    <main className="phone-game prologue-game">
      <Toaster theme="dark" position="top-center" />
      <GameNotice game={m.game} />
      <GameTabs model={m} />
      <SheetDialog model={m} />
      <EndingDialog model={m} />
      <ReturnDialog model={m} />
      <ReportDialog model={m} />
    </main>
  );
}
