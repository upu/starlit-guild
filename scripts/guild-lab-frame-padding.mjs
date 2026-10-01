// Expand atlas frame rectangles into the transparent gutter, preserving paint.
// Landmarks remain relative to the expanded frames. No source pixels are edited.
export function addFramePadding(art, padding = 4) {
  const original = art.frames.map((f) => [...f]);
  art.framePadding = padding;
  const masks = new Set([
    art.head.blink.frame,
    ...Object.values(art.head.expressions).flatMap((e) => e.patches.map((p) => p.frame)),
  ]);
  art.frames = original.map(([x, y, w, h], i) =>
    masks.has(i) ? [x, y, w, h] : [x - padding, y - padding, w + padding * 2, h + padding * 2],
  );
  const point = (p) => [p[0] + padding, p[1] + padding];
  const rect = (r) => [r[0] + padding, r[1] + padding, ...r.slice(2)];
  for (const group of [art.armJoints, art.legJoints])
    for (const joint of Object.values(group))
      for (const key of Object.keys(joint)) joint[key] = point(joint[key]);
  if (art.variants)
    for (const variant of art.variants)
      for (const key of ["root", "hinge", "end"]) variant[key] = point(variant[key]);
  for (const key of ["center", "earUnder", "chinUnder"])
    if (art.head.neck[key]) art.head.neck[key] = point(art.head.neck[key]);
  art.head.displayHeight *= art.frames[0][3] / original[0][3];
  art.head.mouth.x += padding;
  art.head.mouth.y += padding;
  art.head.mouth.bounds = rect(art.head.mouth.bounds);
  art.head.blink.rect = rect(art.head.blink.rect);
  if (Array.isArray(art.head.blink.roi)) art.head.blink.roi = rect(art.head.blink.roi);
  for (const expression of Object.values(art.head.expressions))
    for (const patch of expression.patches) {
      patch.rect = rect(patch.rect);
      patch.roi = rect(patch.roi);
    }
  if (art.head.faceRegions)
    for (const [key, boxes] of Object.entries(art.head.faceRegions))
      art.head.faceRegions[key] = boxes.map(rect);
  art.torso.neck.center = point(art.torso.neck.center);
  if (art.torso.neck.collarBounds)
    art.torso.neck.collarBounds = art.torso.neck.collarBounds.map((v) => v + padding);
  if (art.torso.neck.scanRows)
    art.torso.neck.scanRows = art.torso.neck.scanRows.map((v) => v + padding);
  if (art.hairLock) art.hairLock.root = point(art.hairLock.root);
  if (art.hairLocks) for (const lock of art.hairLocks) lock.root = point(lock.root);
  if (art.nearGlove)
    for (const key of ["thumb", "outerEdge"]) art.nearGlove[key] = point(art.nearGlove[key]);
  for (const seam of Object.values(art.armSeams ?? {})) {
    seam.proximal = point(seam.proximal);
    seam.maxY += padding;
    seam.fadeStartY += padding;
  }
  for (const seam of Object.values(art.seams ?? {})) seam.band = seam.band.map((v) => v + padding);
  return art;
}
