import { AdventureStudy } from "../adventure";
import "../study.css";
export default function Page() {
  return (
    <main className="storybook-study">
      <h1>3-2 石を敷いた街</h1>
      <p>青い戸のある家々へ往診し、抜けた石畳を確かめます。</p>
      <AdventureStudy quest="berne-house-calls" />
    </main>
  );
}
