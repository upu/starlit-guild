import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>2-7 お菓子の通せんぼ</h1>
      <p>作業場の台に残された蜜と、大小の人形・操り手の動きを確認できます。</p>
      <AdventureStudy quest="sweet-blockade" />
    </main>
  );
}
