import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>4-1 塔を直した人たちへ</h1>
      <AdventureStudy quest="linde-requests" />
    </main>
  );
}
