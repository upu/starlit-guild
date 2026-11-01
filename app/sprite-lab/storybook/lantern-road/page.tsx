import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>村はずれへの道</h1>
      <AdventureStudy quest="lantern-detour" />
    </main>
  );
}
