import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>3-4 庭を照らす買い物</h1>
      <p>屋敷の勝手口と庭で荷運びを手伝います。</p>
      <AdventureStudy quest="riverside-manor" />
    </main>
  );
}
