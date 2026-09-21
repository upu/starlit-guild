"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StoryReader } from "@/app/story-scenes";
import type { ChapterThreeSection } from "@/lib/chapter-three-dialogue";
import type { Story } from "@/lib/stories";
import "./preview.css";

export function ChapterThreePreview({ sections }: { sections: ChapterThreeSection[] }) {
  const [reading, setReading] = useState<Story | null>(null);
  return (
    <main className="chapter-three-preview">
      <header>
        <Link href="/">ゲームへ戻る</Link>
        <p className="preview-kicker">会話の試読・第三章</p>
        <h1>石を敷いた街</h1>
        <p>フィンと出会い、間違って売られた石を取り戻す旅。</p>
        <p className="preview-note">
          制作中の会話です。冒険の記録を変えず、好きな場面から読めます。
        </p>
      </header>
      <PreviewSections sections={sections} onSelect={setReading} />
      <Dialog
        open={!!reading}
        onOpenChange={(open) => {
          if (!open) setReading(null);
        }}
      >
        <DialogContent fullScreen className="phone-dialog story-dialog preview-dialog">
          <DialogHeader>
            <DialogTitle>{reading?.title ?? "会話の試読"}</DialogTitle>
            <DialogDescription>{reading?.place}</DialogDescription>
          </DialogHeader>
          {reading && (
            <StoryReader
              key={reading.id}
              story={reading}
              ready
              onRead={() => true}
              onClose={() => {
                setReading(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function PreviewSections({
  sections,
  onSelect,
}: {
  sections: ChapterThreeSection[];
  onSelect: (story: Story) => void;
}) {
  return (
    <div className="preview-sections">
      {sections.map((section) => (
        <section key={section.number} aria-labelledby={`section-${section.number}`}>
          <h2 id={`section-${section.number}`}>
            {section.number} {section.title}
          </h2>
          {section.scenes.map((story) => (
            <button
              className="story-entry"
              key={story.id}
              onClick={() => {
                onSelect(story);
              }}
            >
              <span>
                <small>
                  {section.number === "幕間"
                    ? "幕間"
                    : story.chapter === "departure"
                      ? "出発前"
                      : "達成後"}
                </small>
                <b>{story.title}</b>
              </span>
              <span aria-hidden="true">読む →</span>
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}
