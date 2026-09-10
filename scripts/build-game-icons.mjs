import sharp from 'sharp';
import {copyFile} from 'node:fs/promises';
for(const [name,size] of [['icon-192',192],['icon-512',512],['apple-touch-icon',180]]){
 await sharp('public/icons/lantern.svg').resize(size,size).png().toFile(`public/icons/${name}.png`);
}
await copyFile('public/icons/lantern.svg','public/favicon.svg');
