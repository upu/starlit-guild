# STARLIT-GUILD drainage art

案内：[背景画像](background-images.md)

Mode: built-in image_gen. The two adopted 1536x1024 landscape backgrounds were visually inspected. Stage 1-8 has no ending still; the restored background and dialogue carry that part of the story.

| Asset | Repository path | Usage |
| --- | --- | --- |
| A | `assets/source/scenery/old-waterway.png` | Stage 1-7 and the beginning of 1-8 |
| C | `assets/source/scenery/tower-drainage-open.png` | Stage 1-8 from node 9, and idle after completion |

## Asset A: tower-drainage-route.png

QA: Pass. Readable low blocked drainage outlet with fallen trunk and overgrown stonework. Tower remains modest and local. Broad damp-earth lower third for sprites. No people, text, UI, or catastrophe. Pale moss is natural and subtle; this image includes some water escaping the partially blocked outlet.

Exact prompt:

Use case: stylized-concept.
Asset type: original 1536x1024 landscape battle-stage background for STARLIT-GUILD.
Use the attached tower-road landscape as the visual world and painterly anime-fantasy style reference. Create a different nearby location: an old stone drainage route on the wooded grassy slope immediately below that same modest round local stone tower. A low old stone channel outlet is half obscured by wet grass and storm-fallen branches, with a fallen tree trunk blocking part of the channel. A very faint pale green moss grows naturally within stone recesses; it must be subtle, not magical spectacle. Damp earth, leafy trees, worn gray stones, warm natural daylight after rain.
Composition: wide landscape. The drainage outlet and fallen trunk are readable in the middle third; wooded slope and modest tower in the upper background. Keep the entire lower third broadly open, level and walkable damp earth with a few shallow puddles so animated party sprites can stand clearly in front. Detailed hand-painted Japanese RPG scenery matching the reference, gentle inviting small-town adventure.
Constraints: no people, no animals, no letters, no text, no UI, no watermark. No giant dungeon, no ruined civilization, no magical catastrophe, no glowing portal. This is an ordinary small local maintenance problem.

## Asset C: tower-drainage-open.png

Mode: built-in image_gen edit of Asset A. Output 1536x1024 PNG. Visually inspected generated result: Pass. Same layout, tower, stone outlet and broad open damp-earth foreground preserved. Blocking trunk removed; cut logs stacked on right slope. Stone recess is unlit and natural, modest clear water flows freely. Soft dusk sky and warm tower lamp. No people, text or UI. Minor natural generative redraw of foliage is present; camera and scene geometry visibly match Asset A.

Exact prompt:

Use case: precise-object-edit.
Asset type: restored-state variant of this exact 1536x1024 landscape RPG background.
Edit target: attached tower-drainage-route image.
Primary request: show the same location after ordinary drainage restoration. Remove the fallen trunk and branches that block the stone drainage outlet. Put a few neatly cut log pieces off to the right side on the grassy slope, away from the channel and open foreground. Show modest clear water flowing out of the now fully unblocked low arched outlet and along a small restored shallow channel, with unobstructed flow. Remove excess luminous moss specifically inside the stone recesses; retain ordinary natural plants, flowers, moss and foliage everywhere else.
Lighting: calm soft dusk, gentle blue and muted gold sky, tower lamp softly beginning to warm, not dark night.
Invariants: preserve the exact same camera position, tower identity/size/location, landscape layout, stone arch and stonework identity, trees, distant hills, fence, broad open damp-earth lower third, painterly Japanese fantasy RPG style and landscape dimensions. Make a recognizable before/after pair. Keep the open lower third suitable for animated party sprites. Do not add a bridge, buildings, flood or major construction.
Constraints: no people, no animals, no text, no letters, no UI, no watermark, no glowing portal, no magic spectacle. Only the small local job is complete.

クエスト背景の元PNGは `assets/source/scenery/` へ移動済み。実際の表示には[用途別の生成WebP](scenery-images.md)を使用する。
