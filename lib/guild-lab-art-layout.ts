type Art = { frames: readonly (readonly number[])[]; framePadding: number };
export function labArtHeight(art: Art, frame: number, height: number) {
  const h = art.frames[frame][3];
  return (height * h) / (h - art.framePadding * 2);
}
export function labArtOrigin(art: Art, frame: number, axis: 2 | 3, origin: number) {
  const size = art.frames[frame][axis];
  return (art.framePadding + (size - art.framePadding * 2) * origin) / size;
}
