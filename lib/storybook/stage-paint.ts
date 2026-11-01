/** Keep the cover through two rendering opportunities; cancel on a new cut or unmount. */
export function afterStagePaint(
  reveal: () => void,
  schedule: (callback: FrameRequestCallback) => number = requestAnimationFrame,
  cancel: (id: number) => void = cancelAnimationFrame,
) {
  let second: number | undefined;
  const first = schedule(() => {
    second = schedule(() => {
      reveal();
    });
  });
  return () => {
    cancel(first);
    if (second !== undefined) cancel(second);
  };
}
