# クエストアイコン

- 使用先: 冒険画面下部の「クエスト」。
- 素材: `public/ui/quest-scroll.png`、64×64pxの透過PNG。画面内では32pxで表示。
- 制作: Codex組み込み画像生成、2026-09-13。既存素材を参考に、小さな表示用に形・輪郭・色面を簡略化。
- 生成ツールの原寸出力から64pxへ書き出し。32pxと64pxで外観を確認し、PNGの寸法・アルファを検証。

## 再制作プロンプト

Use case: style-transfer. Edit target: attached game UI icon. Redesign this as an extremely simple, bold small game icon conceived on a 64 by 64 pixel canvas and displayed at 32 by 32 pixels. Keep warm cream, gold, russet, and dark brown colors matching a woodland fantasy game. Actual 64x64 PNG output if supported. Large simple shapes with thick clean dark-brown contours equivalent to 2 pixels at final 64px, 3 flat shading values maximum per material. Clean friendly illustrated icon, NOT detailed painting, NOT elaborate realistic miniature, NOT textural art. No tiny decorations, no grain, no thin highlights. Centered square composition, occupy 90 percent, 3px final transparent margins. True transparent alpha background, no checkerboard, no backdrop, no ground shadow. No words or letters. Keep the identity of a cream parchment quest scroll with rolled top and bottom and a red wax seal. Use a simple nearly frontal silhouette, one large plain gold star centered on the parchment, and one plain red seal in the lower right. Remove corner filigree, ribbons, tiny stars, metallic end caps, parchment tears, and surface texture. Only scroll, central star and seal. Strong separation between cream paper, brown outline, and red seal.

## 透過修正プロンプト

Use case: background-extraction. Edit target: supplied icon. Preserve the icon's EXACT bold simplified design, silhouette, colors and composition. Remove the entire gray-and-white checkerboard pattern from outside the icon (and any negative-space hole inside it). The checkerboard is currently baked into the RGB image and must be removed, NOT reproduced. Deliver actual RGBA PNG with a real transparent alpha channel (alpha zero in all removed background areas). No visible checkerboard, no replacement background, no shadow, no new texture, no gray fringe. The isolated icon only. Preserve all brown outlines. This is a production UI cutout, not a transparency preview.
