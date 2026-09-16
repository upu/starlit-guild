import type Phaser from 'phaser';

// Pre-filter large illustrations before WebGL minification. A single bilinear
// lookup cannot average the many source pixels covered by a small enemy sprite.
export function enemyTexture(textures:Phaser.Textures.TextureManager,asset:string,displayHeight:number){
 if(!asset.startsWith('/enemies/'))return asset;
 const height=[96,192,384,768].find(height=>height>=displayHeight)??768;
 const key=asset+'#smooth-'+String(height);if(textures.exists(key))return key;
 const source=textures.get(asset).getSourceImage() as HTMLImageElement;
 const canvas=document.createElement('canvas');
 canvas.height=Math.min(height,source.height);canvas.width=Math.round(source.width*canvas.height/source.height);
 const context=canvas.getContext('2d');if(!context)return asset;
 context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
 context.drawImage(source,0,0,canvas.width,canvas.height);
 return textures.addCanvas(key,canvas)?key:asset;
}
