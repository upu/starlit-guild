import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>山道の冒険見本</h1>
      <AdventureStudy quest="mountain-entrance" />
    </main>
  );
}
