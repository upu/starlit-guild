# お店アイコン

- 使用先: 冒険画面下部の「ショップ」。1-3の達成話読了後に表示。
- 素材: `public/ui/shop-stall.png`、64×64pxの透過PNG。画面内では32pxで表示。
- 制作: Codex組み込み画像生成、2026-09-13。既存素材を参考に、小さな表示用に形・輪郭・色面を簡略化。
- 生成ツールの原寸出力から64pxへ書き出し。32pxと64pxで外観を確認し、PNGの寸法・アルファを検証。

## 再制作プロンプト

Use case: style-transfer. Edit target: attached game UI icon. Redesign this as an extremely simple, bold small game icon conceived on a 64 by 64 pixel canvas and displayed at 32 by 32 pixels. Keep warm cream, gold, russet, and dark brown colors matching a woodland fantasy game. Actual 64x64 PNG output if supported. Large simple shapes with thick clean dark-brown contours equivalent to 2 pixels at final 64px, 3 flat shading values maximum per material. Clean friendly illustrated icon, NOT detailed painting, NOT elaborate realistic miniature, NOT textural art. No tiny decorations, no grain, no thin highlights. Centered square composition, occupy 90 percent, 3px final transparent margins. True transparent alpha background, no checkerboard, no backdrop, no ground shadow. No words or letters. Keep the identity of a little shop with a red-and-cream striped awning, two dark wooden posts and a chunky wood counter. Frontal silhouette, squat proportions. Awning should occupy the entire upper half with only 3 broad red sections and 2 cream sections, counter the lower third with one large plain gold coin circle. Simplify posts to solid shapes. Remove all wood grain, ropes, plank seams, folded cloth details, hanging banner, star engraving, side wall, perspective and tiny highlights. Only awning, two posts and coin-marked counter, with a transparent gap between awning and counter.

## 透過修正プロンプト

Use case: background-extraction. Edit target: supplied icon. Preserve the icon's EXACT bold simplified design, silhouette, colors and composition. Remove the entire gray-and-white checkerboard pattern from outside the icon (and any negative-space hole inside it). The checkerboard is currently baked into the RGB image and must be removed, NOT reproduced. Deliver actual RGBA PNG with a real transparent alpha channel (alpha zero in all removed background areas). No visible checkerboard, no replacement background, no shadow, no new texture, no gray fringe. The isolated icon only. Preserve all brown outlines. This is a production UI cutout, not a transparency preview.
