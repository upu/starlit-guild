import { env } from "cloudflare:workers";
import { notFound } from "next/navigation";
import TeaStudy from "./study";
import "./study.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "お茶と会話の見本 | 星灯りの旅団",
  robots: { index: false, follow: false },
};
export default function Page() {
  if (env.ENABLE_TEST_TOOLS !== "true") notFound();
  return <TeaStudy />;
}
