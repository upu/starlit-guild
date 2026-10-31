import { WalkReview } from "./walk-review";
import { WalkTravel } from "./walk-travel";

export function ContactStudy() {
  return (
    <section className="storybook-contacts">
      <h2>レオンの足運び比較（調整中）</h2>
      <p>
        踏み出しと、手前の脚を前へ運ぶ姿勢です。同じ縮尺で足元を揃えています。連続歩行は調整中です。
      </p>
      <div>
        {(
          [
            ["contact-a-v1", "踏み出しA"],
            ["contact-b-v2", "踏み出しB"],
            ["pass-b-v3", "手前の脚を運ぶ"],
          ] as const
        ).map(([pose, label]) => (
          <figure key={pose}>
            {/* Fixed-size calibration images, not responsive content illustrations. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/storybook-study/leon-${pose}.webp`}
              width="192"
              height="192"
              alt={`レオン：${label}`}
            />
            <figcaption>{label}</figcaption>
          </figure>
        ))}
      </div>
      <WalkReview />
      <WalkTravel />
    </section>
  );
}
