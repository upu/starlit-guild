"use client";
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Dispatch,
  type Ref,
  type ReactNode,
  type SetStateAction,
} from "react";
import { Portrait } from "./portrait";
import { useBanterCompletion } from "./use-banter-completion";
import { storyArtwork, storyArtViewer, storyTapHint } from "./story-viewers";
import { useStoryGestureHandlers, type StoryGesture } from "./story-gesture-handlers";
import { heroes } from "@/lib/game";
import { originalCharacters } from "@/lib/original-characters";
import type { Story, StoryLine } from "@/lib/stories";
import { storyArtAt } from "@/lib/story-art";
import { compactStoryDialogue, storyStageCue, storyStageExitCue } from "@/lib/story-stage";
import { StoryStage } from "./story-stage";
import {
  hasNextBanter,
  nextBanter,
  startBanter,
  retainBanter,
  type BanterExchange,
} from "@/lib/banter-exchange";
import type { StoryAdvance } from "./use-story-advance";
export { ArtViewer, StoryAlbum } from "./story-viewers";
export { StoryLibrary } from "./story-library";
export { memoryGroups } from "./story-memory-groups";
const characters = [
  { id: "masked-pumpety", name: "カボチャ頭の少女", sprite: "masked-pumpety" as const },
  ...heroes,
  ...originalCharacters.filter((c) => !heroes.some((h) => h.id === c.id)),
];

export function StoryLines({ lines, startIndex = 0 }: { lines: StoryLine[]; startIndex?: number }) {
  return (
    <div className="story-lines">
      {lines.map((line, i) => {
        const hero = characters.find((h) => h.id === line.speaker);
        return hero ? (
          <div className={`story-line story-${hero.id}`} key={startIndex + i}>
            <Portrait index={hero.sprite} size={72} expression={line.expression} />
            <div>
              <b>{hero.name}</b>
              <p>{line.text}</p>
            </div>
          </div>
        ) : (
          <p className="story-narration" key={startIndex + i}>
            {line.text}
          </p>
        );
      })}
    </div>
  );
}

function useStoryPageAdvance(
  viewArt: boolean,
  last: boolean,
  ready: boolean,
  page: number,
  setPage: (page: number) => void,
  finishing: { current: boolean },
  onRead: () => boolean,
  onClose: () => void,
) {
  return () => {
    if (viewArt || finishing.current) return;
    if (!last) {
      setPage(page + 1);
      return;
    }
    if (!ready) return;
    finishing.current = true;
    if (onRead()) onClose();
    else finishing.current = false;
  };
}

function storyPageState(story: Story, page: number, departure: boolean) {
  const pages = story.lines.length,
    art = storyArtAt(story.id, page),
    last = page + 1 >= pages;
  return {
    pages,
    art,
    last,
    advanceLabel: last ? (departure ? "冒険を始める" : "閉じる") : "会話を進める",
  };
}

type StoryReaderProps = {
  story: Story;
  ready: boolean;
  onRead: () => boolean;
  onClose: () => void;
  departure?: boolean;
  advanceRef?: Ref<StoryAdvance>;
};
export type StageTitle = { number: string; name: string };
function StageTitleCard({
  stage,
  onStart,
  advanceRef,
}: {
  stage: StageTitle;
  onStart: () => void;
  advanceRef?: Ref<StoryAdvance>;
}) {
  useImperativeHandle(advanceRef, () => ({ advance: onStart }));
  return (
    <div className="story-reader stage-title-reader">
      <button
        type="button"
        className="stage-title-card"
        aria-label={`${stage.number} ${stage.name}：会話を始める`}
        onClick={onStart}
      >
        <span>{stage.number}</span>
        <strong>{stage.name}</strong>
      </button>
    </div>
  );
}
// A stage departure opens on its number and name, then the conversation starts on a tap.
export function StageStoryReader({ stage, ...props }: StoryReaderProps & { stage?: StageTitle }) {
  const [intro, setIntro] = useState(!!stage);
  if (intro && stage)
    return (
      <StageTitleCard
        stage={stage}
        advanceRef={props.advanceRef}
        onStart={() => {
          setIntro(false);
        }}
      />
    );
  return <StoryReader {...props} />;
}

function useStageExit(advancePage: () => void, finishing: { current: boolean }, enabled: boolean) {
  const [exiting, setExiting] = useState(false);
  const exitRequested = useRef(false);
  return {
    exiting,
    advance: () => {
      if (exitRequested.current) return;
      if (enabled) {
        exitRequested.current = true;
        setExiting(true);
      } else advancePage();
    },
    finishExit: () => {
      advancePage();
      // A rejected departure remains readable and can be retried.
      if (!finishing.current) {
        exitRequested.current = false;
        setExiting(false);
      }
    },
  };
}

function useReaderState({ story, ready, onRead, onClose, departure = false }: StoryReaderProps) {
  const [page, setPage] = useState(0),
    [viewArt, setViewArt] = useState(false),
    [viewHistory, setViewHistory] = useState(false);
  const dialogue = useRef<HTMLDivElement>(null);
  const gesture = useRef<StoryGesture | null>(null),
    finishing = useRef(false);
  const { pages, art, last, advanceLabel } = storyPageState(story, page, departure);
  const stage = !art && storyStageCue(story.id, page);
  const compact = compactStoryDialogue(story.id);
  const exitCue = stage && storyStageExitCue(story.id);
  useEffect(() => {
    if (dialogue.current)
      dialogue.current.scrollTop = compact && !viewHistory ? 0 : dialogue.current.scrollHeight;
  }, [page, compact, viewHistory]);
  const advancePage = useStoryPageAdvance(
    viewArt,
    last,
    ready,
    page,
    setPage,
    finishing,
    onRead,
    onClose,
  );
  const playback = useStageExit(advancePage, finishing, !!(last && exitCue && ready));
  const advance = () => {
    if (!viewHistory) playback.advance();
  };
  const handlers = useStoryGestureHandlers(dialogue, gesture, advance);
  return {
    page,
    pages,
    art,
    last,
    advanceLabel,
    stage,
    compact,
    exitCue,
    viewArt,
    setViewArt,
    viewHistory,
    setViewHistory,
    dialogue,
    handlers,
    ...playback,
    advance,
  };
}

function storyConversation(
  story: Story,
  ready: boolean,
  reader: ReturnType<typeof useReaderState>,
) {
  const { page, pages, last, compact, viewHistory, exiting, advanceLabel, dialogue, handlers } =
    reader;
  const startIndex = compact && !viewHistory ? page : 0;
  const label = exiting ? "出発中" : advanceLabel;
  return (
    <div
      className="story-conversation"
      role={viewHistory ? "region" : "button"}
      tabIndex={0}
      aria-label={viewHistory ? "会話履歴" : label}
      aria-disabled={exiting || (last && !ready)}
      {...handlers}
    >
      <div ref={dialogue} className="dialogue-page dialogue-history">
        <StoryLines lines={story.lines.slice(startIndex, page + 1)} startIndex={startIndex} />
      </div>
      {!viewHistory && storyTapHint(page, pages, last, exiting ? "出発中…" : advanceLabel)}
    </div>
  );
}

function compactDialogue(conversation: ReactNode, reader: ReturnType<typeof useReaderState>) {
  const { viewHistory, setViewHistory, exiting } = reader;
  return (
    <div className="story-stage-dialogue">
      {conversation}
      <button
        type="button"
        className="story-history-toggle"
        aria-expanded={viewHistory}
        disabled={exiting}
        onClick={() => {
          setViewHistory(!viewHistory);
        }}
      >
        {viewHistory ? "会話に戻る" : "会話履歴"}
      </button>
    </div>
  );
}

export function StoryReader(props: StoryReaderProps) {
  const reader = useReaderState(props);
  const { story, ready, advanceRef } = props;
  const { page, art, stage, compact, exiting, exitCue, finishExit, viewArt, setViewArt, advance } =
    reader;
  useImperativeHandle(advanceRef, () => ({ advance }));
  const conversation = storyConversation(story, ready, reader);
  return (
    <div
      className={
        "story-reader" + (art ? " story-reader-art" : "") + (compact ? " story-reader-compact" : "")
      }
    >
      {stage ? (
        <StoryStage
          key={story.id}
          cue={exiting && exitCue ? exitCue : stage}
          speaker={story.lines[page]?.speaker}
          onComplete={exiting ? finishExit : undefined}
        />
      ) : (
        storyArtwork(art ?? null, viewArt, story.title, () => {
          setViewArt(true);
        })
      )}
      {compact ? compactDialogue(conversation, reader) : conversation}
      {storyArtViewer(viewArt ? (art ?? null) : null, story.title, () => {
        setViewArt(false);
      })}
    </div>
  );
}

function scheduleBanter(
  paused: boolean,
  hasNext: boolean,
  line: StoryLine | undefined,
  latest: { current: StoryLine[] },
  setExchange: Dispatch<SetStateAction<BanterExchange>>,
) {
  if (paused || !hasNext) return;
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    clearTimeout(timer);
    if (document.hidden) return;
    timer = setTimeout(
      () => {
        setExchange((current) => nextBanter(current, latest.current));
      },
      Math.max(3500, (line?.text.length || 0) * 100),
    );
  };
  schedule();
  document.addEventListener("visibilitychange", schedule);
  return () => {
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", schedule);
  };
}

function banterLine(entry: StoryLine, key: number) {
  const speaker = characters.find((h) => h.id === entry.speaker);
  return (
    <span className="banter-line" key={key}>
      {speaker && <Portrait index={speaker.sprite} size={40} expression={entry.expression} />}
      <span className="banter-message">
        {speaker && <b>{speaker.name}：</b>}
        {entry.text}
      </span>
    </span>
  );
}

export function Banter({
  lines,
  paused = false,
  retain = false,
  notice = "",
  label = "道中の掛け合い",
  onComplete,
}: {
  lines: StoryLine[];
  paused?: boolean;
  retain?: boolean;
  notice?: string;
  label?: string;
  onComplete?: () => void;
}) {
  const [exchange, setExchange] = useState(() => startBanter(lines));
  const retained = retain ? retainBanter(exchange, lines) : exchange;
  if (retained !== exchange) setExchange(retained);
  const dialogue = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  useEffect(() => {
    if (dialogue.current && followLatest.current)
      dialogue.current.scrollTop = dialogue.current.scrollHeight;
  }, [exchange, notice]);
  const latest = useRef(lines);
  useEffect(() => {
    latest.current = lines;
  }, [lines]);
  const line = exchange.lines.at(exchange.index);
  // Compare content, not the new array journeyBanter returns on every clock tick.
  // Exchanges already shown in this quest stay in the history instead of being appended again.
  const hasNext = hasNextBanter(exchange, lines);
  useBanterCompletion(exchange, paused, onComplete);
  useEffect(
    () => scheduleBanter(paused, hasNext, line, latest, setExchange),
    [exchange, paused, line, hasNext],
  );
  if (!line) return null;
  return (
    <div
      ref={dialogue}
      className="journey-banter journey-banter-history"
      onScroll={(event) => {
        followBanterScroll(event.currentTarget, followLatest);
      }}
      role="region"
      tabIndex={0}
      aria-label={label}
    >
      <span className="banter-copy">
        {exchange.history.map((entry, i) =>
          banterLine(entry, exchange.turn - exchange.history.length + 1 + i),
        )}
        {notice && (
          <span className="banter-line consumable-notice" role="status">
            {notice}
          </span>
        )}
      </span>
    </div>
  );
}

function followBanterScroll(el: HTMLDivElement, followLatest: { current: boolean }) {
  followLatest.current = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
}
