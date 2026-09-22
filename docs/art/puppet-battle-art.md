# 覆面の操り手の戦闘画像

案内：[人物画像](character-images.md)

採用画像：public/enemies/masked-pumpety.png。2-7最後の戦闘のみで使用する。1024×1536、RGBA PNG。背景の透明画素と実際のPhaser描画を確認済み。

既存の public/characters/pumpety.png を参照し、imagegenで制作。黒い身頃、緑の袖、黄色のスカート、茶色の髪とブーツを保ち、頭全体をカボチャで覆う。穴の中は黒く、目元と素顔を見せない。木製の操り棒を掲げ、本人以外の人形は画像に含めない。ゲーム側で左右反転し、味方へ向ける。

制作プロンプトの要点：Single full-body doll master in black bodice, green sleeves, yellow skirt and brown boots. Entire head hidden inside a carved orange pumpkin helmet; fully black holes, no visible face or eyes. Raise a marionette cross in a commanding pose. Hand-painted fantasy JRPG sprite. No other characters, text, floor or backdrop. Portrait 2:3, isolated transparent PNG.

背景除去の編集：Remove ALL background from this exact character image. Keep character unchanged. Output actual RGBA transparency with zero alpha outside the character; no backdrop no glow no gradient no shadow no simulated checkerboard. Game sprite isolated transparent PNG. Preserve pumpkin helmet with fully black holes, clothing, full body and raised hand.

敵の大きな原画は、表示サイズに近い96・192・384・768px高の描画用テクスチャへCanvas 2Dの高品質縮小で一度だけ変換し、Phaser内で再利用する。元のRGBA画像をそのまま大幅縮小した場合に出る、輪郭や細部のざらつきを防ぐ。原画とセーブは変更しない。プティ・小型人形・ゴーレムを320px・390px・1000px幅の実描画で確認する。
