import type { HomeMarker } from "@/lib/home-room-markers";
import { GuildDutyFace } from "./guild-duty-marker";
import { TriangleAlert } from "lucide-react";

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
        <div key={marker.id} className="home-marker" data-home-marker={marker.id}>
          <button
            className="home-marker-button"
            data-guild-control={marker.control}
            aria-label={marker.label}
            aria-describedby={marker.status ? `home-status-${marker.id}` : undefined}
            onClick={() => onUse?.(marker.id)}
          >
            <GuildDutyFace id={marker.hero} />
            {marker.status?.warning && (
              <TriangleAlert className="home-marker-alert" aria-hidden="true" />
            )}
          </button>
          {marker.status && (
            <span id={`home-status-${marker.id}`} className="sr-only">
              {marker.status.text}
            </span>
          )}
          {marker.status?.progress !== undefined && (
            <div className="home-marker-status">
              {!marker.status.warning && <span aria-hidden="true">{marker.status.text}</span>}
              <progress aria-label="作業台の進み具合" value={marker.status.progress} max={1} />
              <small>{Math.floor(marker.status.progress * 100)}%</small>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
