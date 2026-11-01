import { AdventureStudy } from "../adventure";
import "../study.css";
export default function Page() {
  return (
    <main className="storybook-study">
      <h1>2-5 分かれ道の道標</h1>
      <p>人形の背中から道標を取り戻し、元の場所へ運ぶ本編の表示です。</p>
      <AdventureStudy quest="spinning-signpost" />
    </main>
  );
}
