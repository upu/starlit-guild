export type StoryArt = {
 src: string;
 alt: string;
 width: number;
 height: number;
 revealAtLine: number;
};

// Reveal illustrations with the scene, rather than previewing later events.
export const storyArt: Record<string, StoryArt> = {
 'herbs-departure': {
  src: '/stories/first-map.png',
  alt: '森の拠点で地図を広げるアリアと、その隣で道を確かめるレオン。',
  width: 1536, height: 1024, revealAtLine: 0,
 },
 'pilgrim-return': {
  src: '/stories/fireside.png',
  alt: '同じ丸太に並んで腰を下ろし、焚き火に照らされるアリアとレオン。ふたりの手の間には小さな隙間がある。',
  width: 1536, height: 1024, revealAtLine: 6,
 },
};

export function storyArtAt(storyId: string, lineIndex: number): StoryArt | undefined {
 const art = storyArt[storyId];
 return art && lineIndex >= art.revealAtLine ? art : undefined;
}
