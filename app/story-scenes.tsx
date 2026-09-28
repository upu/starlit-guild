"use client";
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Dispatch,
  type Ref,
  type SetStateAction,
} from "react";
import { Portrait } from "./portrait";
import { storyArtwork, storyArtViewer, storyTapHint } from "./story-viewers";
import { useStoryGestureHandlers, type StoryGesture } from "./story-gesture-handlers";
import { heroes } from "@/lib/game";
import { originalCharacters } from "@/lib/original-characters";
import type { Story, StoryLine } from "@/lib/stories";
import { storyArtAt } from "@/lib/story-art";
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

export function StoryReader({
  story,
  ready,
  onRead,
  onClose,
  departure = false,
  advanceRef,
}: StoryReaderProps) {
  const [page, setPage] = useState(0),
    [viewArt, setViewArt] = useState(false);
  const dialogue = useRef<HTMLDivElement>(null);
  const gesture = useRef<StoryGesture | null>(null),
    finishing = useRef(false);
  useEffect(() => {
    if (dialogue.current) dialogue.current.scrollTop = dialogue.current.scrollHeight;
  }, [page]);
  const { pages, art, last, advanceLabel } = storyPageState(story, page, departure);
  const advance = useStoryPageAdvance(
    viewArt,
    last,
    ready,
    page,
    setPage,
    finishing,
    onRead,
    onClose,
  );
  useImperativeHandle(advanceRef, () => ({ advance }));
  return (
    <div className={"story-reader" + (art ? " story-reader-art" : "")}>
      {storyArtwork(art ?? null, viewArt, story.title, () => {
        setViewArt(true);
      })}
      <div
        className="story-conversation"
        role="button"
        tabIndex={0}
        aria-label={advanceLabel}
        aria-disabled={last && !ready}
        {...useStoryGestureHandlers(dialogue, gesture, advance)}
      >
        <div ref={dialogue} className="dialogue-page dialogue-history">
          <StoryLines lines={story.lines.slice(0, page + 1)} />
        </div>
        {storyTapHint(page, pages, last, advanceLabel)}
      </div>
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
}: {
  lines: StoryLine[];
  paused?: boolean;
  retain?: boolean;
  notice?: string;
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
        const el = event.currentTarget;
        followLatest.current = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
      }}
      role="region"
      tabIndex={0}
      aria-label="道中の掛け合い"
    >
      <span className="banter-copy">
        {exchange.history.map((entry, i) =>
          banterLine(entry, exchange.turn - exchange.history.length + 1 + i),
        )}
      </span>
      {notice && (
        <span className="banter-line consumable-notice" role="status">
          {notice}
        </span>
      )}
    </div>
  );
}
