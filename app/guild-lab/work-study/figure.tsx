import { workStudyPose, type WorkPoint } from "@/lib/home-work-study";
type Pose = ReturnType<typeof workStudyPose>;
const ink = "#493e32";
function Limb({
  points,
  color,
  width = 8,
}: {
  points: WorkPoint[];
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
function Bench() {
  return (
    <g stroke={ink} strokeWidth="1.5" strokeLinejoin="round">
      <path d="M120 103 V133 L125 136 V105 M198 99 V127 L203 130 V100" fill="#81603d" />
      <path d="M115 96 L205 93 V109 L115 112 Z" fill="#956b40" />
      <path d="M107 80 L185 62 L214 86 L130 106 Z" fill="#c49a62" />
      <path d="M130 106 V112 L214 92 V86 Z" fill="#a87b48" />
      <path d="M119 91 L147 82 L161 90 L132 100 Z" fill="#d5bb89" stroke="#9d8056" />
    </g>
  );
}
function Body({ p }: { p: Pose }) {
  return (
    <>
      <Limb
        points={[{ x: 98, y: 112 }, { x: 102, y: 129 }, p.feet[1]]}
        color="#58aabd"
        width={10}
      />
      <path d="M97 142 L109 138 L114 144 L102 149 L96 148 Z" fill="#58aabd" stroke={ink} />
      <Limb points={[{ x: 84, y: 115 }, { x: 81, y: 132 }, p.feet[0]]} color="#ec9551" width={11} />
      <path d="M75 147 L88 143 L94 149 L80 155 L74 153 Z" fill="#ec9551" stroke={ink} />
      <path
        d={`M${String(76 + p.lean)} 78 Q89 73 ${String(104 + p.lean)} 81 L107 113 Q94 122 79 116 Z`}
        fill="#c7b48f"
        stroke={ink}
        strokeWidth="1.6"
      />
      <path d="M80 109 Q93 114 106 106" fill="none" stroke="#8d7a5f" />
      <g
        transform={`translate(${String(p.lean)} ${String(p.lean * 0.4)})`}
        stroke={ink}
        strokeWidth="1.5"
      >
        <path d="M70 63 Q59 43 77 31 Q97 23 110 41 Q118 57 106 69 Q98 81 83 76 Z" fill="#e4c89b" />
        <path
          d="M74 34 Q57 48 70 65 Q75 73 84 74 L90 65 Q105 57 108 42 Q94 24 74 34 Z"
          fill="#c8ae82"
        />
        <path d="M107 58 Q117 54 114 64 Q112 68 108 66" fill="#e4c89b" />
        <path d="M73 45 Q78 35 85 35" fill="none" stroke="#af946c" />
      </g>
    </>
  );
}
function Hands({ p, guides }: { p: Pose; guides: boolean }) {
  return (
    <>
      <Limb points={[{ x: 81 + p.lean, y: 82 }, { x: 108, y: 94 }, p.support]} color="#58aabd" />
      <circle cx={p.support.x} cy={p.support.y} r="4" fill="#58aabd" stroke={ink} />
      <Limb points={[p.shoulder, p.elbow, p.hand]} color="#ec9551" />
      <circle cx={p.hand.x} cy={p.hand.y} r="4" fill="#ec9551" stroke={ink} />
      {guides && (
        <g fill="#fff9da" stroke="#316f70" strokeWidth="0.8">
          {[p.shoulder, p.elbow, p.hand, p.support, ...p.feet].map((v, i) => (
            <circle key={i} cx={v.x} cy={v.y} r="2" />
          ))}
          <path d="M68 156 L116 142" fill="none" strokeDasharray="2 2" />
        </g>
      )}
    </>
  );
}
export default function WorkFigure({
  time,
  guides = false,
  left = false,
  smooth = false,
}: {
  time: number;
  guides?: boolean;
  left?: boolean;
  smooth?: boolean;
}) {
  const p = workStudyPose(time, smooth);
  return (
    <svg
      viewBox="0 0 240 168"
      role="img"
      aria-label={`${left ? "左" : "右"}利きの人が斜め後ろ姿で台の上へ手を伸ばして作業する見本`}
    >
      <path d="M20 155 H224" stroke="#bbaa88" />
      <g transform={left ? "translate(240 0) scale(-1 1)" : undefined}>
        <Bench />
        <Body p={p} />
        <Hands p={p} guides={guides} />
      </g>
    </svg>
  );
}
