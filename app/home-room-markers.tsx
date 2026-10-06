import type { HomeMarker } from "@/lib/home-room-markers";
import { GuildDutyFace } from "./guild-duty-marker";

export function HomeRoomMarkers({
  markers,
  onUse,
}: {
  markers: HomeMarker[];
  onUse?: (id: string) => void;
}) {
  return (
    <div className="home-markers">
      {markers.map((marker) => (
        <button
          key={marker.id}
          className="home-marker"
          data-home-marker={marker.id}
          data-guild-control={marker.control}
          aria-label={marker.label}
          onClick={() => onUse?.(marker.id)}
        >
          <GuildDutyFace id={marker.hero} />
        </button>
      ))}
    </div>
  );
}
