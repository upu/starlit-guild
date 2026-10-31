import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>3-6 四人で下見</h1>
      <p>屋敷の裏庭で手伝いながら道を確かめます。</p>
      <AdventureStudy quest="manor-survey" />
    </main>
  );
}
