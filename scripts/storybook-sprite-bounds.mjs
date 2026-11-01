export function spriteBounds(data, width, height, { count = 8, columns = 4, rows = 2 } = {}) {
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const components = [];
  for (let seed = 0; seed < visited.length; seed++) {
    if (visited[seed] || data[seed * 4 + 3] <= 16) continue;
    let read = 0,
      write = 1,
      left = width,
      right = 0,
      top = height,
      bottom = 0;
    queue[0] = seed;
    visited[seed] = 1;
    while (read < write) {
      const pixel = queue[read++],
        x = pixel % width,
        y = Math.floor(pixel / width);
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      for (const [dx, dy] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        const nx = x + dx,
          ny = y + dy,
          next = ny * width + nx;
        if (
          nx < 0 ||
          ny < 0 ||
          nx >= width ||
          ny >= height ||
          visited[next] ||
          data[next * 4 + 3] <= 16
        )
          continue;
        visited[next] = 1;
        queue[write++] = next;
      }
    }
    components.push({ left, top, width: right - left + 1, height: bottom - top + 1, area: write });
  }
  return components
    .sort((a, b) => b.area - a.area)
    .slice(0, count)
    .sort((a, b) => {
      const cell = (c) =>
        Math.floor((c.top + c.height / 2) / (height / rows)) * columns +
        Math.floor((c.left + c.width / 2) / (width / columns));
      return cell(a) - cell(b);
    });
}
