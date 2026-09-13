# STARLIT-GUILD drainage art

Mode: built-in image_gen. All three images are 1536x1024 landscape PNGs. References and generated outputs were visually inspected. The adopted images are integrated at the repository paths below.

| Asset | Repository path | Usage |
| --- | --- | --- |
| A | `public/stages/old-waterway.png` | Stage 1-7 and the beginning of 1-8 |
| B | `public/stories/tower-drainage-restored.png` | `tower-restoration-return`, reveal at line 5 (zero-based) |
| C | `public/stages/tower-drainage-open.png` | Stage 1-8 from node 9, and idle after completion |

## Asset A: tower-drainage-route.png

QA: Pass. Readable low blocked drainage outlet with fallen trunk and overgrown stonework. Tower remains modest and local. Broad damp-earth lower third for sprites. No people, text, UI, or catastrophe. Pale moss is natural and subtle; this image includes some water escaping the partially blocked outlet.

Exact prompt:

Use case: stylized-concept.
Asset type: original 1536x1024 landscape battle-stage background for STARLIT-GUILD.
Use the attached tower-road landscape as the visual world and painterly anime-fantasy style reference. Create a different nearby location: an old stone drainage route on the wooded grassy slope immediately below that same modest round local stone tower. A low old stone channel outlet is half obscured by wet grass and storm-fallen branches, with a fallen tree trunk blocking part of the channel. A very faint pale green moss grows naturally within stone recesses; it must be subtle, not magical spectacle. Damp earth, leafy trees, worn gray stones, warm natural daylight after rain.
Composition: wide landscape. The drainage outlet and fallen trunk are readable in the middle third; wooded slope and modest tower in the upper background. Keep the entire lower third broadly open, level and walkable damp earth with a few shallow puddles so animated party sprites can stand clearly in front. Detailed hand-painted Japanese RPG scenery matching the reference, gentle inviting small-town adventure.
Constraints: no people, no animals, no letters, no text, no UI, no watermark. No giant dungeon, no ruined civilization, no magical catastrophe, no glowing portal. This is an ordinary small local maintenance problem.

## Asset B: tower-drainage-restored.png

QA: Pass. Aria and Leon stand close beside cleared running channel. Aria points and Leon looks toward water; mud on brown gloves, quiet smiles, cut logs, shovel, bucket, warm tower light at dusk. Blond hair/green eyes/elf ears/green gold-embroidered feathered hood and Leon's brown hair/eyes/red scarf/blue tunic/silver shoulder plate match reference. No text, hearts, UI, victory pose. The village and tower occupy a wider background rather than replicating the first image's exact camera angle.

Exact prompt:

Use case: illustration-story.
Asset type: original landscape 1536x1024 narrative still for STARLIT-GUILD.
Input image 1 (tower-moss-discovery): character identity and high quality painterly anime illustration reference. Input image 2 (tower-road): setting reference for the SAME modest local round stone tower, countryside and village.
Primary request: after ordinary community restoration work, Aria and Leon stand side by side close together beside a restored low stone drainage channel watching a modest clear stream run again. Aria points gently toward the running water; Leon looks in that same direction. Their brown leather gloves/hands have visible damp mud from the work. Relaxed relief and small natural smiles, comfortable childhood friends who like one another, understated warmth.
Identity invariants from image 1: Aria is the blonde long-haired green-eyed elf woman with visibly pointed ears, green hooded cloak with gold vine embroidery and white feather with small gold flower clasp on hood, white puff sleeves, brown leather corset/belt and brown leather gloves and bracers; her long blonde hair flows from the hood. Leon is the tousled short brown-haired brown-eyed young man wearing the same red scarf/cape, blue tunic, white sleeves, brown crossing leather straps with brass buckles, a silver engraved shoulder plate, brown leather gloves/bracers. Faithfully retain their faces, hair, ears, eyes and outfit designs. Do not substitute new characters.
Scene: wooded hillside after the fallen trunk was cut and the old stone outlet cleared. Neatly set aside cut trunk sections and a plain shovel and small bucket show the completed practical work. A small stream now follows the cleared shallow stone channel. The tower is in the middle-distance background with its modest lamp beginning to glow warmly at dusk; gentle evening amber and blue lighting. The two main characters are large enough that faces and muddy gloves read clearly, in three-quarter standing view, with the drainage and tower visible around them.
Style: polished detailed painterly Japanese fantasy RPG still, matching image 1 exactly in character rendering, rich natural fabrics, stones, grass and evening light.
Constraints: no text, no caption, no letters, no UI, no watermark, no heart symbols, no victory pose, no epic rescue, no magical catastrophe, no giant castle, no kissing. Grounded small local job and calm shared satisfaction.


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
