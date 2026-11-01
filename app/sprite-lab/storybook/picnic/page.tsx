import { AdventureStudy } from "../adventure";
import "../study.css";

export default function Page() {
  return (
    <main className="storybook-study">
      <h1>2-1 お昼を持って、あの坂へ</h1>
      <AdventureStudy quest="hilltop-picnic" />
    </main>
  );
}
