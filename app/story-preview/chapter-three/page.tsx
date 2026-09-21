import { env } from "cloudflare:workers";
import { notFound } from "next/navigation";
import { chapterThreeSections } from "@/lib/chapter-three-stories";
import { ChapterThreePreview } from "./preview";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "第三章の試読 | 星灯りの旅団",
  robots: { index: false, follow: false },
};

export default function ChapterThreePreviewPage() {
  if (env.ENABLE_TEST_TOOLS !== "true") notFound();
  return <ChapterThreePreview sections={chapterThreeSections} />;
}
