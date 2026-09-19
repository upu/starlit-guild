"use client";
import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StoryArtwork } from "./story-artwork";
import { availableStories, storyProgress, type Story } from "@/lib/stories";
import { storyArtAt, storyThumbnail, type StoryArt } from "@/lib/story-art";
import type { State } from "@/lib/game";

export function ArtViewer({
  art,
  title,
  onClose,
}: {
  art: StoryArt | null;
  title: string;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={!!art}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent fullScreen className="art-viewer" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">
            画像や余白をタップすると元の画面に戻ります。
          </DialogDescription>
        </DialogHeader>
        {art && (
          <StoryArtwork
            key={art.src}
            art={art}
            onClick={onClose}
            label="鑑賞を終えて戻る"
            buttonClass="art-canvas"
          />
        )}
        <button type="button" className="art-return" onClick={onClose}>
          戻る
        </button>
      </DialogContent>
    </Dialog>
  );
}

export function storyArtwork(
  art: StoryArt | null,
  viewArt: boolean,
  title: string,
  onOpen: () => void,
) {
  return (
    <div className="story-art-space">
      {art && (
        <figure className="story-still">
          <StoryArtwork
            key={art.src}
            art={art}
            active={!viewArt}
            onClick={onOpen}
            label={"絵を大きく見る：" + title}
            buttonClass="still-expand"
          />
        </figure>
      )}
    </div>
  );
}

export function storyArtViewer(art: StoryArt | null, title: string, onClose: () => void) {
  return <ArtViewer art={art} title={title} onClose={onClose} />;
}

export function storyTapHint(page: number, pages: number, last: boolean, advanceLabel: string) {
  return (
    <div className="story-tap-hint" aria-hidden="true">
      <span>
        {page + 1} / {pages}
      </span>
      <span className={last ? "story-end-action" : "story-continue"}>
        {last ? advanceLabel : "▼"}
      </span>
    </div>
  );
}

export function StoryAlbum({ state: s, onBack }: { state: State; onBack: () => void }) {
  const [viewing, setViewing] = useState<Story | null>(null),
    read = storyProgress(s).read;
  // Preserve reveal rules; only mount gallery images inside the album.
  const gallery = availableStories(s).flatMap((st) => {
    const art = storyArtAt(st.id, read.includes(st.id) ? Infinity : 0);
    return art ? [{ story: st, art }] : [];
  });
  return (
    <section className="story-album">
      <button className="outline" onClick={onBack}>
        旅の手帳へ戻る
      </button>
      {gallery.length ? (
        <div className="still-gallery">
          {gallery.map(({ story: st, art }) => (
            <button
              key={st.id}
              onClick={() => {
                setViewing(st);
              }}
              aria-label={st.title + "の絵を大きく見る"}
            >
              <Image
                src={storyThumbnail(art)}
                alt={art.alt}
                width={320}
                height={320}
                loading="lazy"
                unoptimized
              />
              <span>{st.title}</span>
            </button>
          ))}
        </div>
      ) : (
        <p>物語で出会った絵が、ここに残ります。</p>
      )}
      <ArtViewer
        art={viewing ? storyArtAt(viewing.id, Infinity) || null : null}
        title={viewing?.title || "アルバム"}
        onClose={() => {
          setViewing(null);
        }}
      />
    </section>
  );
}
