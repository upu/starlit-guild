import { walkStudy, walkStudyPose, type WalkPoint } from "@/lib/home-walk-study";
const points = (...p: WalkPoint[]) => p.map(({ x, y }) => `${String(x)},${String(y)}`).join(" ");
function Limb({ path, color, width }: { path: WalkPoint[]; color: string; width: number }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={points(...path)} stroke="#393b38" strokeWidth={width + 1.4} />
      <polyline points={points(...path)} stroke={color} strokeWidth={width} />
    </g>
  );
}
function Arm({ side, color }: { side: ReturnType<typeof walkStudyPose>["near"]; color: string }) {
  return (
    <g>
      <Limb path={[side.shoulder, side.elbow, side.hand]} color={color} width={6} />
      <circle
        cx={side.hand.x}
        cy={side.hand.y}
        r={3.5}
        fill={color}
        stroke="#393b38"
        strokeWidth={1}
      />
    </g>
  );
}
function Leg({ side, color }: { side: ReturnType<typeof walkStudyPose>["near"]; color: string }) {
  return (
    <g>
      <Limb path={[side.hip, side.knee, side.ankle]} color={color} width={7} />
      <path
        d={`M ${String(side.ankle.x - 3)} ${String(side.ankle.y - 2)} q 6 -2 13 2 v 3 h -13 z`}
        fill={color}
        stroke="#393b38"
        strokeWidth={1.2}
      />
    </g>
  );
}
function Skeleton({ pose }: { pose: ReturnType<typeof walkStudyPose> }) {
  return (
    <g fill="#fff" stroke="#222" strokeWidth={0.65}>
      {[pose.far, pose.near].map((s, i) => (
        <g key={i}>
          <polyline points={points(s.shoulder, s.elbow, s.hand)} fill="none" />
          <polyline points={points(s.hip, s.knee, s.ankle)} fill="none" />
          {[s.shoulder, s.elbow, s.hand, s.hip, s.knee, s.ankle].map((p, j) => (
            <circle key={j} cx={p.x} cy={p.y} r={1.4} />
          ))}
        </g>
      ))}
    </g>
  );
}
function Trails() {
  return (
    <g fill="none" strokeWidth={0.7} strokeDasharray="1.5 1.5">
      {(["near", "far"] as const).map((side) => (
        <polyline
          key={side}
          stroke={walkStudy[side]}
          points={points(...Array.from({ length: 33 }, (_, i) => walkStudyPose(i / 4)[side].hand))}
        />
      ))}
    </g>
  );
}
export function WalkFigure({ frame, guides = false }: { frame: number; guides?: boolean }) {
  const p = walkStudyPose(frame);
  return (
    <svg viewBox="-32 -91 70 99" role="img" aria-label={`歩行 ${String(frame + 1)} コマ目`}>
      <path d="M -30 2 H 36" stroke="#869080" strokeWidth={0.5} />
      <Arm side={p.far} color={walkStudy.far} />
      <Leg side={p.far} color={walkStudy.far} />
      <Leg side={p.near} color={walkStudy.near} />
      <g transform={`translate(0 ${String(p.bob)})`} stroke="#393b38" strokeWidth={1.4}>
        <path d="M -9 -56 Q 0 -60 10 -53 L 11 -32 Q 0 -26 -11 -32 Z" fill="#d2c8af" />
        <ellipse cx={3} cy={-70} rx={16} ry={15} fill="#eee3c9" />
        <path d="M 17 -73 l 4 3 -4 1" fill="#eee3c9" />
        <circle cx={11} cy={-72} r={1.3} fill="#393b38" />
      </g>
      <Arm side={p.near} color={walkStudy.near} />
      {guides && (
        <>
          <Trails />
          <Skeleton pose={p} />
        </>
      )}
    </svg>
  );
}
