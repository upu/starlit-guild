import { teaPair, type teaStudyPose, type TeaPoint } from "@/lib/home-tea-study";
type Pose = ReturnType<typeof teaStudyPose>;
const outline = "#453b31";
function Limb({ points, color, width = 7 }: { points: TeaPoint[]; color: string; width?: number }) {
  const path = points.map((p) => `${String(p.x)},${String(p.y)}`).join(" ");
  return (
    <g fill="none" strokeLinejoin="round" strokeLinecap="round">
      <polyline points={path} stroke={outline} strokeWidth={width + 2} />
      <polyline points={path} stroke={color} strokeWidth={width} />
    </g>
  );
}
function Chair() {
  return (
    <g fill="#967348" stroke={outline} strokeWidth="1.5">
      <path d="M-20-49 H-15 V-25 H22 V-21 H-20 Z" />
      <path d="M-17-21 V0 M19-21 V0" fill="none" strokeWidth="3" />
      <path d="M-14-27 H21 V-24 H-14 Z" fill="#617660" />
    </g>
  );
}
function Head({ pose: p }: { pose: Pose }) {
  return (
    <g
      transform={`rotate(${String(p.nod)} 0 -52)`}
      fill="#e4c89b"
      stroke={outline}
      strokeWidth="1.5"
    >
      <path d="M-12-77 Q0-87 13-77 Q18-71 15-66 L18-63 L14-61 Q13-52 1-53 Q-13-54-14-66 Z" />
      <path d="M-10-62 Q-17-66-12-69" fill="none" />
      {p.smile ? (
        <path d="M7-67 Q10-70 13-67 M10-60 Q13-57 15-60" fill="none" />
      ) : (
        <>
          <ellipse cx={10 + p.look} cy="-67" rx="1.2" ry="2" fill={outline} stroke="none" />
          <path d="M11-60 H15" fill="none" />
        </>
      )}
    </g>
  );
}
function Cup({ point }: { point: TeaPoint }) {
  return (
    <g
      transform={`translate(${String(point.x)} ${String(point.y)})`}
      stroke={outline}
      strokeWidth="1.3"
    >
      <ellipse cx="-7" cy="1" rx="3" ry="3.5" fill="none" />
      <path d="M-6-3 H6 L5 4 Q0 8-5 4 Z" fill="#fcf1d3" />
      <ellipse cy="-3" rx="6" ry="1.5" fill="#9d6134" />
    </g>
  );
}
function Person({ pose: p, guides }: { pose: Pose; guides: boolean }) {
  return (
    <>
      <Chair />
      <Limb points={[{ x: -7, y: -44 }, { x: -7, y: -31 }, p.restingHand]} color="#58aabd" />
      <Limb
        points={[
          { x: -6, y: -28 },
          { x: 12, y: -28 },
          { x: 12, y: -3 },
        ]}
        color="#58aabd"
      />
      <path d="M8-5 H15 L20-1 V1 H8 Z" fill="#58aabd" stroke={outline} strokeWidth="1.5" />
      <Limb points={[p.hip, p.knee, p.ankle]} color="#ec9551" width={9} />
      <path d="M13-5 H20 L26-1 V1 H13 Z" fill="#ec9551" stroke={outline} strokeWidth="1.5" />
      <path
        d="M-10-51 Q-1-54 6-49 L10-28 Q-1-23-10-28 Z"
        fill="#cfb589"
        stroke={outline}
        strokeWidth="1.5"
      />
      <Head pose={p} />
      <Limb points={[p.shoulder, p.elbow, p.hand]} color="#ec9551" />
      <Cup point={p.cup} />
      <circle cx={p.hand.x} cy={p.hand.y} r="2.6" fill="#ec9551" stroke={outline} />
      {guides && (
        <g fill="#fff9da" stroke="#316f70" strokeWidth="0.8">
          {[p.shoulder, p.elbow, p.hand, p.hip, p.knee, p.ankle].map((v, i) => (
            <circle key={i} cx={v.x} cy={v.y} r="2" />
          ))}
          <path d="M-20-27 H27 M-20 1 H27" fill="none" strokeDasharray="2 2" />
        </g>
      )}
    </>
  );
}
export default function TeaFigure({ time, guides = false }: { time: number; guides?: boolean }) {
  const [a, b] = teaPair(time);
  return (
    <svg
      viewBox="0 0 260 116"
      role="img"
      aria-label="椅子に座った2人が、片手でお茶を飲み、順番に笑顔でうなずく見本"
    >
      <path d="M10 100 H250" stroke="#bbaa88" strokeWidth="1" />
      <g transform="translate(0 99)" fill="#ac8252" stroke={outline} strokeWidth="1.5">
        <path d="M103-33 L101 0 M157-33 L159 0" strokeWidth="4" />
        <ellipse cx="130" cy="-34" rx="38" ry="9" />
        <path d="M123-40 Q120-54 130-54 Q140-54 137-40 Z M137-48 L147-52 L141-42" fill="#f1e7cc" />
        <path d="M123-51 Q113-52 118-42 H123" fill="none" />
        <path d="M124-54 H136 M129-57 H132" />
      </g>
      <g transform="translate(62 99)">
        <Person pose={a} guides={guides} />
      </g>
      <g transform="translate(198 99) scale(-1 1)">
        <Person pose={b} guides={guides} />
      </g>
    </svg>
  );
}
