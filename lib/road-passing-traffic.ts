/** A passer crosses the road, stops to raise/lower a hat, then leaves completely. */
export function passingTrafficStep(anchor: number, span: number, age: number) {
  const movingAge = age < 8000 ? Math.max(0, age) : Math.max(8000, age - 1000);
  const progress = Math.min(1, movingAge / 20000),
    distance = span * 1.8 * progress;
  const greeting = age >= 8000 && age < 9000;
  return {
    x: anchor + span * 0.9 - distance,
    frame: greeting ? (age < 8500 ? 5 : 6) : Math.floor(distance / 10) % 4,
    visible: age >= 0 && age < 21000,
  };
}
