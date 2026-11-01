import { AdventureStudy } from "../../adventure";
import "../../study.css";
export default function Page() {
  return (
    <main className="storybook-study">
      <h1>1-7 古い水路をたどる</h1>
      <p>管理図と湿った斜面を見比べ、草に隠れた出口を探す二人を確認します。</p>
      <AdventureStudy quest="old-waterway" />
    </main>
  );
}
