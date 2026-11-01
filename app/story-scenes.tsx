"use client";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type Ref,
  type ReactNode,
  type SetStateAction,
} from "react";
import { Portrait } from "./portrait";
import { useBanterCompletion } from "./use-banter-completion";
import { useBanterLineFilter, useCurrentBanterLine, useLatestBanter } from "./use-banter-line";
import { useBanterExchange } from "./use-banter-exchange";
import { BanterTail } from "./banter-tail";
import { storyArtwork, storyArtViewer, storyTapHint } from "./story-viewers";
import { useStoryGestureHandlers, type StoryGesture } from "./story-gesture-handlers";
import { heroes } from "@/lib/game";
import { originalCharacters } from "@/lib/original-characters";
import type { Story, StoryLine } from "@/lib/stories";
import { storyArtAt } from "@/lib/story-art";
import { compactStoryDialogue } from "@/lib/story-stage";
import { storybookExitCue } from "@/lib/storybook/travel-packing";
import { studyCue } from "@/lib/storybook/carry-cue";
import { afterAdventureCue } from "@/lib/storybook/adventure-entry";
import { StoryReaderStage } from "./storybook/story-reader-stage";
import { useStoryStageImages } from "./use-story-stage-images";
import { useStoryScroll } from "./use-story-scroll";
import { useStoryMotionAdvance } from "./use-story-motion-advance";
import { stageCompletion, useStageExit } from "./use-stage-exit";
import { hasNextBanter, nextBanter, type BanterExchange } from "@/lib/banter-exchange";
import type { StoryAdvance } from "./use-story-advance";
import { StageTitleCard, type StageTitle } from "./story-stage-title";
export type { StageTitle } from "./story-stage-title";
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
  /** Sprite-lab replay entry point; normal game readers always start at zero. */
  reviewStartPage?: number;
  /** Ephemeral visual handoff; never inferred from a completed save or used for library replays. */
  completedAdventure?: string;
};
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

function reviewPage(story: Story, requested = 0) {
  return Math.max(0, Math.min(story.lines.length - 1, Math.trunc(requested)));
}
function useStageCues(id: string, page: number, hasArt: boolean, completedAdventure?: string) {
  const stage = useMemo(() => {
    const cue = !hasArt && studyCue(id, page, true);
    return page === 0 ? afterAdventureCue(id, completedAdventure, cue) : cue;
  }, [id, page, hasArt, completedAdventure]);
  const exitCue = useMemo(() => stage && storybookExitCue(id), [stage, id]);
  return { stage, exitCue };
}
function useReaderState(props: StoryReaderProps) {
  const { story, ready, onRead, onClose, departure = false } = props;
  const [page, setPage] = useState(() => reviewPage(story, props.reviewStartPage)),
    [viewArt, setViewArt] = useState(false),
    [viewHistory, setViewHistory] = useState(false);
  const gesture = useRef<StoryGesture | null>(null),
    finishing = useRef(false);
  const { pages, art, last, advanceLabel } = storyPageState(story, page, departure);
  const { stage, exitCue } = useStageCues(story.id, page, !!art, props.completedAdventure);
  const compact = compactStoryDialogue(story.id);
  const dialogue = useStoryScroll(page, compact, viewHistory);
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
  const fade = departure && story.id === "starlit-guild-founding-departure";
  const playback = useStageExit(advancePage, finishing, !!(last && exitCue && ready), fade);
  const stageImages = useStoryStageImages(story, page, playback.exiting ? exitCue || stage : stage);
  const motion = useStoryMotionAdvance(
    page,
    !!(stage && stage.finishBeforeAdvance),
    playback.advance,
  );
  const advance = () => {
    if (!viewHistory && stageImages.status !== "loading") motion.advance();
  };
  return {
    page,
    pages,
    art,
    last,
    advanceLabel,
    stage,
    stageImages,
    compact,
    exitCue,
    viewArt,
    setViewArt,
    viewHistory,
    setViewHistory,
    dialogue,
    handlers: useStoryGestureHandlers(dialogue, gesture, advance),
    ...playback,
    ...motion,
    finishStage: stageCompletion(
      playback,
      !!(stage && stage.finishBeforeAdvance),
      motion.finishMotion,
    ),
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
      aria-disabled={exiting || reader.stageImages.status === "loading" || (last && !ready)}
      aria-busy={reader.hasten || reader.stageImages.status === "loading"}
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
  const {
    page,
    art,
    stage,
    stageImages,
    compact,
    exiting,
    fading,
    exitCue,
    viewArt,
    setViewArt,
    advance,
  } = reader;
  useImperativeHandle(advanceRef, () => ({ advance }));
  const conversation = storyConversation(story, ready, reader);
  const openArt = () => {
    setViewArt(true);
  };
  return (
    <div
      className={
        "story-reader" +
        (art ? " story-reader-art" : "") +
        (compact ? " story-reader-compact" : "") +
        (fading ? " story-reader-fading" : "")
      }
    >
      {stage ? (
        <StoryReaderStage
          key={story.id}
          storyId={story.id}
          line={page}
          status={stageImages.status}
          castFallback={stageImages.castFallback}
          cue={exiting && exitCue ? exitCue : stage}
          speaker={story.lines[page]?.speaker}
          hasten={reader.hasten}
          onComplete={reader.finishStage}
        />
      ) : (
        storyArtwork(art ?? null, viewArt, story.title, openArt, stageImages.status)
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
  minimum: number,
  canShow: { current?: (line: StoryLine, history: StoryLine[]) => boolean },
) {
  if (paused || !hasNext) return;
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    clearTimeout(timer);
    if (document.hidden) return;
    timer = setTimeout(
      () => {
        setExchange((current) => nextBanter(current, latest.current, canShow.current));
      },
      Math.max(3500, (line?.text.length || 0) * 100, minimum),
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

type BanterProps = {
  lines: StoryLine[];
  paused?: boolean;
  retain?: boolean;
  notice?: string;
  label?: string;
  onComplete?: () => void;
  onCurrentLine?: (line: StoryLine | undefined) => void;
  context?: string;
  concealed?: boolean;
  minimumDuration?: (line?: StoryLine) => number;
  preserveInterrupted?: boolean;
  canShowLine?: (line: StoryLine, history: StoryLine[]) => boolean;
};
export function Banter({
  lines,
  paused = false,
  retain = false,
  notice = "",
  label = "道中の掛け合い",
  onComplete,
  onCurrentLine,
  context,
  concealed = false,
  minimumDuration,
  preserveInterrupted = false,
  canShowLine,
}: BanterProps) {
  const [exchange, setExchange] = useBanterExchange(lines, retain, context, preserveInterrupted);
  const dialogue = useRef<HTMLDivElement>(null);
  const canShow = useBanterLineFilter(canShowLine);
  const followLatest = useRef(true);
  useEffect(() => {
    if (dialogue.current && followLatest.current)
      dialogue.current.scrollTop = dialogue.current.scrollHeight;
  }, [exchange, notice]);
  const latest = useLatestBanter(lines),
    line = useCurrentBanterLine(exchange, onCurrentLine);
  // Compare content, not the new array journeyBanter returns on every clock tick.
  // Exchanges already shown in this quest stay in the history instead of being appended again.
  const hasNext = hasNextBanter(exchange, lines),
    minimum = minimumDuration?.(line) ?? 0;
  useBanterCompletion(exchange, paused, hasNext, minimum, onComplete);
  useEffect(
    () => scheduleBanter(paused, hasNext, line, latest, setExchange, minimum, canShow),
    [exchange, paused, line, hasNext, latest, setExchange, minimum, canShow],
  );
  if (!line && !exchange.history.length) return null;
  return (
    <div
      ref={dialogue}
      className="journey-banter journey-banter-history"
      style={{ visibility: concealed ? "hidden" : undefined }}
      onScroll={(event) => {
        followBanterScroll(event.currentTarget, followLatest);
      }}
      role="region"
      tabIndex={0}
      aria-label={label}
      data-current-line={line?.text}
    >
      <span className="banter-copy">
        {exchange.history.map((entry, i) =>
          banterLine(entry, exchange.turn - exchange.history.length + 1 + i),
        )}
        <BanterTail waiting={!line} notice={notice} />
      </span>
    </div>
  );
}

function followBanterScroll(el: HTMLDivElement, followLatest: { current: boolean }) {
  followLatest.current = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
}
