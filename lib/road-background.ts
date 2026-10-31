// Conversation stages keep their authored compositions. Adventure routes need
// continuous ground for the moving party rather than foreground roofs/fences.
export function roadBackground(background: string, quest?: string) {
  if (quest === "moss-transplant") return "/story-stage/transplant-path.webp";
  return (
    {
      "/scenery/tower-road-background.webp": "/scenery/adventure-farm-road-background.webp",
      "/scenery/berne-background.webp": "/scenery/adventure-berne-background.webp",
    }[background] ?? background
  );
}
