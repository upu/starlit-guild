import type { Ref } from "react";
import { BookOpen, ChevronRight, Heart, Lightbulb, Images } from "lucide-react";
import { equippedTechnique, techniqueById } from "@/lib/techniques";
import { InventoryPanel } from "./equipment-panels";
import { ShopPanel } from "./shop-panel";
import { QuestPicker } from "./quest-picker";
import { SavePanel } from "./save-panel";
import { StoryLibrary, StoryAlbum, StageStoryReader } from "./story-scenes";
import { Sprite } from "./sprite";
import { InstallGuide } from "./install-guide";
import { questAdvice } from "@/lib/journey";
import { characterNotes } from "@/lib/stories";
import { allQuests, heroSkills, memberStats } from "@/lib/game";
import { storyStages } from "@/lib/prologue";
import type { StoryAdvance } from "./use-story-advance";
import type { SheetModel, SheetView } from "./phone-game-types";

function bookSheet(m: SheetModel): SheetView | null {
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
  return null;
}
function memorySheet(m: SheetModel): SheetView | null {
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
  return null;
}
function departureStage(id?: string) {
  const stage = storyStages.find((item) => item.quest === id),
    quest = allQuests.find((item) => item.id === id);
  return stage && quest ? { number: stage.number, name: quest.name } : undefined;
}
function readingSheet(m: SheetModel, advanceRef: Ref<StoryAdvance>): SheetView | null {
  if (m.sheet === "story" && m.reading)
    return {
      title: m.reading.title,
      description: m.reading.place,
      content: (
        <StageStoryReader
          key={m.reading.id}
          story={m.reading}
          ready={m.ready}
          onRead={m.finishStory}
          departure={!!m.pendingDeparture}
          stage={departureStage(m.pendingDeparture?.id)}
          onClose={m.closeStory}
          advanceRef={advanceRef}
        />
      ),
    };
  return null;
}
function storySheet(m: SheetModel, advanceRef: Ref<StoryAdvance>) {
  return bookSheet(m) ?? memorySheet(m) ?? readingSheet(m, advanceRef);
}
function heroSheet(m: SheetModel): SheetView | null {
  if (m.sheet !== "personality") return null;
  const notes = characterNotes[m.hero.id];
  const skill = ["aria", "leon"].includes(m.hero.id)
    ? (techniqueById(equippedTechnique(m.state, m.hero.id, "active") || "") ?? {
        name: "通常行動",
        description: "自動で使うスキルはセットされていません。",
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
function goalSheet(m: SheetModel): SheetView | null {
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
  return null;
}
function adviceSheet(m: SheetModel): SheetView | null {
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
        </>
      ),
    };
  return null;
}
function journeySheet(m: SheetModel) {
  return goalSheet(m) ?? adviceSheet(m);
}
function collectionItemsSheet(m: SheetModel): SheetView | null {
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
  return null;
}
function journalSheet(m: SheetModel): SheetView | null {
  const s = m.state;
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
export function collectionSheet(m: SheetModel) {
  return collectionItemsSheet(m) ?? journalSheet(m);
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
          進行は端末に保存し、開いている間は約5分ごとにクラウドへバックアップします。冒険は画面を開いている間だけ進みます。閉じている間は止まり、次に開くと続きから進みます。
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
export function resolveSheet(m: SheetModel, advanceRef: Ref<StoryAdvance>) {
  return (
    storySheet(m, advanceRef) ??
    heroSheet(m) ??
    journeySheet(m) ??
    collectionSheet(m) ??
    helpSheet(m) ?? { title: "", description: "", content: null }
  );
}
