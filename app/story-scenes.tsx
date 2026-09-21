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
import { BookOpen, ChevronRight } from "lucide-react";
import { Portrait } from "./portrait";
import { storyArtwork, storyArtViewer, storyTapHint } from "./story-viewers";
import { memoryGroups } from "./story-memory-groups";
import { useStoryGestureHandlers, type StoryGesture } from "./story-gesture-handlers";
import { heroes, type State } from "@/lib/game";
import { originalCharacters } from "@/lib/original-characters";
import {
  availableStories,
  stories,
  storyProgress,
  type Story,
  type StoryLine,
} from "@/lib/stories";
import { storyArtAt } from "@/lib/story-art";
import type { StoryAdvance } from "./use-story-advance";
export { ArtViewer, StoryAlbum } from "./story-viewers";
export { memoryGroups } from "./story-memory-groups";
const characters = [
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

export function StoryReader({
  story,
  ready,
  onRead,
  onClose,
  departure = false,
  advanceRef,
}: {
  story: Story;
  ready: boolean;
  onRead: () => boolean;
  onClose: () => void;
  departure?: boolean;
  advanceRef?: Ref<StoryAdvance>;
}) {
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

function storyMemoryFilters(
  onlyUnread: boolean,
  setOnlyUnread: (value: boolean) => void,
  available: Story[],
  read: string[],
) {
  return (
    <div className="memory-filters" aria-label="物語の表示">
      <button
        aria-pressed={!onlyUnread}
        onClick={() => {
          setOnlyUnread(false);
        }}
      >
        すべて
      </button>
      <button
        aria-pressed={onlyUnread}
        onClick={() => {
          setOnlyUnread(true);
        }}
      >
        未読 {available.filter((st) => !read.includes(st.id)).length}
      </button>
    </div>
  );
}

export function StoryLibrary({
  state: s,
  onOpen,
}: {
  state: State;
  onOpen: (story: Story) => void;
}) {
  const available = availableStories(s),
    read = storyProgress(s).read;
  const [onlyUnread, setOnlyUnread] = useState(false);
  const itemsToShow = available.filter((st) => !onlyUnread || !read.includes(st.id));
  return (
    <div className="story-library">
      {storyMemoryFilters(onlyUnread, setOnlyUnread, available, read)}
      {available.length === 0 ? (
        <div className="story-empty">
          <BookOpen />
          <p>最初の思い出は、ふたりで「街への交易」へ出発すると開きます。</p>
        </div>
      ) : (
        itemsToShow.length === 0 && <p>すべての思い出を読み終えました。</p>
      )}
      {memoryGroups(itemsToShow).map((group) => (
        <section key={group.id}>
          <h3>{group.title}</h3>
          {group.items.map((st) => (
            <button
              key={st.id}
              className="story-entry"
              onClick={() => {
                onOpen(st);
              }}
            >
              <span>
                <small>
                  {st.chapter === "departure" ? "出発前" : "達成後"}
                  {!read.includes(st.id) && " · 未読"}
                </small>
                <b>{st.title}</b>
              </span>
              <ChevronRight size={18} />
            </button>
          ))}
        </section>
      ))}
      <small>
        {available.length} / {stories.length} の思い出。留守中に開いた話も、ここに残ります。
      </small>
    </div>
  );
}

function sameBanter(left: StoryLine[], right: StoryLine[]) {
  return (
    left.length === right.length &&
    left.every(
      (entry, i) =>
        entry.speaker === right[i].speaker &&
        entry.text === right[i].text &&
        entry.expression === right[i].expression,
    )
  );
}

function hasNextBanter(exchange: BanterExchange, lines: StoryLine[]) {
  return (
    exchange.index + 1 < exchange.lines.length ||
    (lines.length > 0 && !sameBanter(exchange.lines, lines))
  );
}

type BanterExchange = { lines: StoryLine[]; index: number; history: StoryLine[]; turn: number };
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
        setExchange((current) => {
          const continuing = current.index + 1 < current.lines.length,
            index = continuing ? current.index + 1 : 0,
            nextLines = continuing ? current.lines : latest.current,
            nextLine = nextLines.at(index);
          if (!nextLine || (!continuing && sameBanter(current.lines, nextLines))) return current;
          // Keep completed exchanges visible, but only append when there is new dialogue.
          return {
            lines: nextLines,
            index,
            history: [...current.history, nextLine].slice(-100),
            turn: current.turn + 1,
          };
        });
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

export function Banter({ lines, paused = false }: { lines: StoryLine[]; paused?: boolean }) {
  const [exchange, setExchange] = useState({
    lines,
    index: 0,
    history: lines.slice(0, 1),
    turn: 0,
  });
  const dialogue = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  useEffect(() => {
    if (dialogue.current && followLatest.current)
      dialogue.current.scrollTop = dialogue.current.scrollHeight;
  }, [exchange]);
  const latest = useRef(lines);
  useEffect(() => {
    latest.current = lines;
  }, [lines]);
  const line = exchange.lines.at(exchange.index);
  // Compare content, not the new array journeyBanter returns on every clock tick.
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
    </div>
  );
}
