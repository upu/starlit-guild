import { gardenPose, type GardenAction, type GardenPoint } from "@/lib/home-garden-study";
type Pose = ReturnType<typeof gardenPose>;
const ink = "#493e32";
function Limb({
  points,
  color,
  width = 8,
}: {
  points: GardenPoint[];
  color: string;
  width?: number;
}) {
  const line = points.map((p) => `${String(p.x)},${String(p.y)}`).join(" ");
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={line} stroke={ink} strokeWidth={width + 2} />
      <polyline points={line} stroke={color} strokeWidth={width} />
    </g>
  );
}
function Plants() {
  return (
    <g stroke={ink} strokeWidth="1.5" strokeLinejoin="round">
      <path d="M129 139 L185 150 L225 127 L166 117 Z" fill="#765337" />
      <path d="M129 139 V155 L185 167 V150 Z" fill="#bc8c56" />
      <path d="M185 150 L225 127 V145 L185 167 Z" fill="#9d7447" />
      {[
        { x: 159, y: 136 },
        { x: 184, y: 139 },
        { x: 204, y: 128 },
      ].map((p, i) => (
        <g key={i} transform={`translate(${String(p.x)} ${String(p.y)})`}>
          <path d="M0 0 Q-3 -7 0 -18" fill="none" stroke="#546841" />
          <path
            d="M0 -6 Q-14 -6 -12 -16 Q-1 -16 0 -6 M0 -11 Q3 -22 12 -20 Q12 -11 0 -11"
            fill="#83a65b"
          />
        </g>
      ))}
    </g>
  );
}
function Body({ p }: { p: Pose }) {
  return (
    <>
      <Limb
        points={[{ x: 96, y: 115 + p.crouch }, { x: 94 - p.crouch, y: 134 }, p.feet[1]]}
        color="#58aabd"
        width={10}
      />
      <path d="M94 148 L106 144 L113 150 L99 155 L92 153 Z" fill="#58aabd" stroke={ink} />
      <Limb
        points={[{ x: 83, y: 118 + p.crouch }, { x: 78 - p.crouch, y: 138 }, p.feet[0]]}
        color="#ec9551"
        width={11}
      />
      <path d="M72 153 L84 150 L94 156 L78 161 L71 159 Z" fill="#ec9551" stroke={ink} />
      <g transform={`translate(0 ${String(p.crouch)})`} stroke={ink} strokeWidth="1.6">
        <path
          d={`M${String(76 + p.lean)} ${String(78 + p.lean * 0.6)} Q${String(89 + p.lean)} ${String(73 + p.lean * 0.6)} ${String(103 + p.lean)} ${String(82 + p.lean * 0.6)} L105 115 Q94 123 79 119 Z`}
          fill="#c7b48f"
        />
        <path d="M80 111 Q94 116 105 110" fill="none" stroke="#8d7a5f" />
        <g
          transform={`translate(${String(p.lean)} ${String(p.lean * 0.6)}) rotate(${String(p.lean * 0.35)} 90 70)`}
        >
          <path
            d="M70 63 Q59 43 77 31 Q97 23 110 41 Q118 57 106 69 Q98 81 83 76 Z"
            fill="#e4c89b"
          />
          <path
            d="M74 34 Q57 48 70 65 Q75 73 84 74 L90 65 Q105 57 108 42 Q94 24 74 34 Z"
            fill="#c8ae82"
          />
          <path d="M107 58 Q117 54 114 64 Q112 68 108 66" fill="#e4c89b" />
        </g>
      </g>
    </>
  );
}
function Can({ p, still }: { p: Pose; still: boolean }) {
  return (
    <>
      <g
        transform={`translate(${String(p.hand.x)} ${String(p.hand.y)}) rotate(${String(p.tilt)})`}
        stroke={ink}
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <path d="M-2 7 C-16 -10 12 -17 17 3" fill="none" strokeWidth="3" />
        <path d="M15 9 L32 0 L38 6 L20 19 Z" fill="#739889" />
        <path d="M33 -1 L41 3 L38 10 L31 5 Z" fill="#c6bb8c" />
        <path d="M-7 3 Q5 0 17 4 L20 23 Q7 30 -7 23 Z" fill="#8bac96" />
        <path d="M-3 7 L-3 20" stroke="#b9cbb0" />
      </g>
      {p.pouring && !still && (
        <g data-water="true" stroke="#529bad" strokeWidth="1.2" strokeLinecap="round" fill="none">
          {[0, 3, 6].map((d) => (
            <path
              key={d}
              d={`M${String(p.spout.x + d * 0.3)} ${String(p.spout.y + 2)} Q${String(p.spout.x + 3 + d)} 128 ${String(159 + d)} 135`}
            />
          ))}
        </g>
      )}
    </>
  );
}
export default function GardenFigure({
  action,
  time,
  left = false,
  smooth = false,
  guides = false,
  still = false,
}: {
  action: GardenAction;
  time: number;
  left?: boolean;
  smooth?: boolean;
  guides?: boolean;
  still?: boolean;
}) {
  const p = gardenPose(action, time, smooth);
  return (
    <svg
      viewBox="0 0 240 180"
      role="img"
      aria-label={`${left ? "左" : "右"}利きの菜園の${action === "water" ? "水やり" : "植物を見る"}見本`}
    >
      <path d="M22 163 H120" stroke="#bbaa88" />
      <g transform={left ? "translate(240 0) scale(-1 1)" : undefined}>
        <Plants />
        <g data-layer="far-arm">
          <Limb
            points={[
              { x: 81 + p.lean, y: 83 + p.crouch + p.lean * 0.6 },
              { x: 106, y: 101 + p.crouch },
              { x: 110, y: 113 + p.crouch },
            ]}
            color="#58aabd"
          />
        </g>
        <g data-layer="body">
          <Body p={p} />
        </g>
        {action === "water" && <Can p={p} still={still} />}
        <g data-layer="near-arm">
          <Limb points={[p.shoulder, p.elbow, p.hand]} color="#ec9551" />
          <circle cx={p.hand.x} cy={p.hand.y} r="4" fill="#ec9551" stroke={ink} />
        </g>
        {guides && (
          <g fill="#fff9da" stroke="#316f70" strokeWidth=".8">
            {[p.shoulder, p.elbow, p.hand, ...p.feet].map((v, i) => (
              <circle key={i} cx={v.x} cy={v.y} r="2" />
            ))}
          </g>
        )}
      </g>
    </svg>
  );
}
