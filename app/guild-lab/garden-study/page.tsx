import { env } from "cloudflare:workers";
import { notFound, redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default function Page() {
  if (env.ENABLE_TEST_TOOLS !== "true") notFound();
  redirect("/sprite-lab/garden");
}
