import { useId } from "react";
type FloorProps = { garden?: boolean; moss?: boolean };
export function GuildStageFloor({ garden = false, moss = false }: FloorProps) {
  const pattern = useId();
  return (
    <svg
      className="guild-stage-floor"
      viewBox="0 0 600 480"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={pattern}
          width={garden ? 84 : 170}
          height={garden ? 64 : 42}
          patternUnits="userSpaceOnUse"
        >
          <rect width="100%" height="100%" fill={garden ? "#688360" : "#94704a"} />
          {garden ? (
            <>
              <path
                d="m4 19 32-10 33 13-8 25-43 9Z"
                fill="#a8a087"
                stroke="#596f54"
                strokeWidth="3"
              />
              <path
                d="m69 5 4 10 6-13M5 51l5-8 4 12"
                stroke="#9cad72"
                fill="none"
                strokeWidth="2"
              />
            </>
          ) : (
            <>
              <path d="M0 1h170M85 1v41" stroke="#5b4733" strokeWidth="2" />
              <path d="M3 5h70m20 28h62" stroke="#b78b59" strokeWidth="2" />
              <circle cx="81" cy="7" r="1.5" fill="#614731" />
            </>
          )}
        </pattern>
      </defs>
      <rect width="600" height="480" fill={garden ? "#355848" : "#342d24"} />
      <rect
        x="10"
        y={garden ? 12 : 85}
        width="580"
        height={garden ? 458 : 385}
        rx="5"
        fill={`url(#${pattern})`}
        stroke={garden ? "#576c48" : "#b28b55"}
        strokeWidth="9"
      />
      {garden ? <GardenEdge moss={moss} /> : <RoomWall />}
    </svg>
  );
}
function RoomWall() {
  return (
    <g>
      <path d="M10 8h580v87H10Z" fill="#c2ab80" stroke="#644c35" strokeWidth="8" />
      <path d="M15 18h570M50 15v80m500-80v80" stroke="#715033" strokeWidth="12" />
      {[115, 375].map((x) => (
        <g key={x}>
          <rect
            x={x}
            y="28"
            width="95"
            height="61"
            fill="#aac1a4"
            stroke="#604932"
            strokeWidth="7"
          />
          <path d={`M${String(x + 7)} 34h35l-35 39Z`} fill="#f2d993" opacity=".7" />
          <path d={`M${String(x + 47)} 28v61m-47-31h95`} stroke="#735d3e" strokeWidth="5" />
        </g>
      ))}
      <path d="M262 18h69v64l-35 23-34-23Z" fill="#294a4b" stroke="#c5a46b" strokeWidth="3" />
      <path
        d="M282 48h27l-4 24h-18Z M288 46v-7a8 8 0 0 1 16 0v7"
        fill="none"
        stroke="#ead59c"
        strokeWidth="3"
      />
      <path d="m296 51 4 10-4 7-4-7Z" fill="#f2de9d" />
      <path d="M60 100 165 100 380 480H180Z" fill="#fce6ad" opacity=".08" />
    </g>
  );
}
function GardenEdge({ moss }: { moss: boolean }) {
  return (
    <g>
      <path d="M18 18h564v58H18Z" fill={moss ? "#3d6154" : "#8d896e"} />
      <path d="M20 62h560M25 33h550" stroke="#48563f" strokeWidth="6" />
      {[35, 120, 205, 290, 375, 460, 550].map((x) => (
        <g key={x}>
          <path d={`M${String(x)} 14v69`} stroke="#987c52" strokeWidth="9" />
          <ellipse cx={x} cy="22" rx="23" ry="18" fill={moss ? "#477c65" : "#719356"} />
        </g>
      ))}
      <ellipse cx="530" cy="126" rx="36" ry="20" fill="#303f34" opacity=".3" />
      <path d="M502 91h57l-5 49q-21 14-47 0Z" fill="#745a3a" stroke="#423e2a" strokeWidth="3" />
      <ellipse cx="530" cy="93" rx="28" ry="11" fill="#739fa0" stroke="#b09466" strokeWidth="4" />
    </g>
  );
}
