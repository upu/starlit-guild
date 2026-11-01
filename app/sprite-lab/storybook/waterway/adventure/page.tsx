import { AdventureStudy } from "../../adventure";
import "../../study.css";
export default function Page() {
  return (
    <main className="storybook-study">
      <h1>水路を直す仕事：動作の調整中</h1>
      <p>固定した作業場の足場、道具の荷車、作業者と排水の順序を確認します。</p>
      <AdventureStudy quest="tower-restoration" />
    </main>
  );
}
