import { env } from "cloudflare:workers";
import Game from "./game";

// Read the deployed site's runtime setting on each page request, not at build time.
export const dynamic = "force-dynamic";
export default function Home() {
  return <Game testToolsEnabled={env.ENABLE_TEST_TOOLS === "true"} />;
}
