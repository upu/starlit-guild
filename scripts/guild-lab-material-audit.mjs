// Shared colour predicates; authored regions distinguish legitimate sleeve bands
// and warm fabric from a neighbouring garment. Run on both characters' frames.
export const materialColours = {
  blue: (r, g, b) => b > r * 1.04 && b > g * 1.03 && b > 35,
  red: (r, g, b) => r > g * 1.8 && r > b * 1.8 && Math.abs(g - b) < 7 && r - Math.max(g, b) > 65,
  green: (r, g, b) => g > r * 1.2 && g > b * 1.12 && g > 45,
};
export function forbiddenMaterialPixels(data, width, rules, offset = [0, 0]) {
  const matches = [];
  for (let p = 0; p < data.length; p += 4) {
    if (data[p + 3] < 180) continue;
    const x = ((p / 4) % width) + offset[0],
      y = Math.floor(p / 4 / width) + offset[1];
    for (const rule of rules) {
      const [left, top, right, bottom] = rule.bounds ?? [-Infinity, -Infinity, Infinity, Infinity];
      if (
        x >= left &&
        x <= right &&
        y >= top &&
        y <= bottom &&
        materialColours[rule.colour](...data.subarray(p, p + 3))
      )
        matches.push({ pixel: p / 4, colour: rule.colour, x, y });
    }
  }
  return matches;
}
