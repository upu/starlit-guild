import { env } from "cloudflare:workers";
import { notFound } from "next/navigation";
import GardenStudy from "./study";
import "../tea-study/study.css";
import "./study.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "菜園の見本 | 星灯りの旅団",
  robots: { index: false, follow: false },
};
export default function Page() {
  if (env.ENABLE_TEST_TOOLS !== "true") notFound();
  return <GardenStudy />;
}
