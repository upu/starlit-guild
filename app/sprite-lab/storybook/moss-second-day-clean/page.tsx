import { ChapterFourPhoneStudy } from "../lantern-road-phone/phone-study";

/** The game's own overlay, without the trial controls covering the scenery. */
export default function Page() {
  return <ChapterFourPhoneStudy quest="glowing-moss-trail-next-day" controls={false} />;
}
