import { AdventureStudy } from "../adventure";
import "../study.css";
export default function Page() {
  return (
    <main className="storybook-study">
      <h1>3-3 抜けた石の行き先</h1>
      <p>塔の足元で石工や管理人と石組みをたどります。</p>
      <AdventureStudy quest="missing-keystone" />
    </main>
  );
}
