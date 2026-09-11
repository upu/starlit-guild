// User-authorized cleanup of the baked checkerboard in the generated sheets.
// Keep sources in outputs/hero-animation; write separate, reproducible RGBA assets.
import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const destination=new URL('../outputs/hero-animation/clean/',import.meta.url);
await mkdir(destination,{recursive:true});
const reports=[];
for(const name of ['aria','leon']){
 const source=new URL(`../outputs/hero-animation/${name}-generated.png`,import.meta.url);
 const {data,info}=await sharp(fileURLToPath(source)).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const {width,height}=info,total=width*height;
 const background=new Uint8Array(total),visited=new Uint8Array(total),queue=new Int32Array(total);
 // Border samples tell us the checker polarity at each coordinate. We only use
 // this to recognize enclosed background (e.g. inside the bow), never silver metal.
 const threshold=name==='aria'?220:235;
 const column=Array.from({length:width},(_,x)=>data[x*3]>threshold);
 const row=Array.from({length:height},(_,y)=>data[y*width*3]>threshold);
 const origin=column[0];
 const neutral=(p)=>{
  const r=data[p*3],g=data[p*3+1],b=data[p*3+2];
  return Math.min(r,g,b)>=145&&Math.max(r,g,b)-Math.min(r,g,b)<=22;
 };
 const components=[];
 for(let start=0;start<total;start++){
  if(visited[start]||!neutral(start))continue;
  let head=0,tail=1,edge=false,match=0,dark=0,light=0,minX=width,minY=height,maxX=0,maxY=0;
  queue[0]=start;visited[start]=1;
  while(head<tail){
   const p=queue[head++],x=p%width,y=Math.floor(p/width),v=data[p*3];
   minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
   if(x===0||x===width-1||y===0||y===height-1)edge=true;
   const expected=(column[x]===row[y])===origin;
   if((v>threshold)===expected)match++;
   if(v>threshold+8)light++;else if(v<threshold-8)dark++;
   for(const n of [x>0?p-1:-1,x<width-1?p+1:-1,y>0?p-width:-1,y<height-1?p+width:-1]){
    if(n>=0&&!visited[n]&&neutral(n)){visited[n]=1;queue[tail++]=n;}
   }
  }
  const patterned=tail>80&&match/tail>.79&&dark/tail>.12&&light/tail>.12;
  if(edge||patterned)for(let i=0;i<tail;i++)background[queue[i]]=1;
  if(tail>80)components.push({size:tail,box:[minX,minY,maxX,maxY],match:Math.round(match/tail*100),removed:edge||patterned});
 }
 const rgba=Buffer.alloc(total*4);
 for(let p=0;p<total;p++){
  rgba[p*4]=data[p*3];rgba[p*4+1]=data[p*3+1];rgba[p*4+2]=data[p*3+2];rgba[p*4+3]=background[p]?0:255;
 }
 await sharp(rgba,{raw:{width,height,channels:4}}).png().toFile(fileURLToPath(new URL(`${name}-segmented.png`,destination)));
 // Segment whole figures before packing: generated limbs cross the nominal
 // 362px grid. Cutting that grid directly would chop feet and Leon's sword.
 visited.fill(0);
 const figures=[];
 for(let start=0;start<total;start++){
  if(visited[start]||background[start])continue;
  let head=0,tail=1,minX=width,minY=height,maxX=0,maxY=0;
  queue[0]=start;visited[start]=1;
  while(head<tail){
   const p=queue[head++],x=p%width,y=Math.floor(p/width);
   minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const nx=x+dx,ny=y+dy,n=ny*width+nx;
    if(nx>=0&&nx<width&&ny>=0&&ny<height&&!visited[n]&&!background[n]){visited[n]=1;queue[tail++]=n;}
   }
  }
  // Detached release arrow is omitted; Phaser already renders the projectile.
  if(tail<10000)continue;
  const pixels=queue.slice(0,tail),rowIndex=Math.floor(minY/(height/3)),columnIndex=Math.floor((minX+maxX)/2/(width/4));
  figures.push({pixels,minX,minY,maxX,maxY,index:rowIndex*4+columnIndex});
 }
 if(figures.length!==12||new Set(figures.map(f=>f.index)).size!==12)throw new Error(`${name}: expected 12 isolated poses`);
 const cell=384,scale=.92,baseline=346,overlays=[],frames=[];
 for(const f of figures.sort((a,b)=>a.index-b.index)){
  const w=f.maxX-f.minX+1,h=f.maxY-f.minY+1,cutout=Buffer.alloc(w*h*4);
  let footLeft=width,footRight=0;
  for(const p of f.pixels){
   const x=p%width,y=Math.floor(p/width),out=((y-f.minY)*w+x-f.minX)*4;
   rgba.copy(cutout,out,p*4,p*4+4);
   const boot=name==='aria'||data[p*3]>data[p*3+1]+10&&data[p*3+1]>data[p*3+2]+3;
   if(y>f.maxY-(name==='leon'?36:60)&&boot){footLeft=Math.min(footLeft,x);footRight=Math.max(footRight,x);}
  }
  const resizedWidth=Math.round(w*scale),resizedHeight=Math.round(h*scale);
  const left=Math.round(cell/2-((footLeft+footRight)/2-f.minX)*scale),top=baseline-resizedHeight;
  if(left<4||top<4||left+resizedWidth>cell-4)throw new Error(`${name} pose ${f.index}: insufficient gutter ${JSON.stringify({left,top,resizedWidth,footLeft,footRight})}`);
  const input=await sharp(cutout,{raw:{width:w,height:h,channels:4}}).resize(resizedWidth,resizedHeight).png().toBuffer();
  overlays.push({input,left:f.index%4*cell+left,top:Math.floor(f.index/4)*cell+top});
  frames.push({index:f.index,sourceBounds:[f.minX,f.minY,f.maxX,f.maxY],bounds:[left,top,left+resizedWidth,baseline]});
 }
 const sheet=await sharp({create:{width:cell*4,height:cell*3,channels:4,background:'#00000000'}}).composite(overlays).png().toBuffer();
 await writeFile(new URL(`${name}-v1.png`,destination),sheet);
 await sharp(sheet).flatten({background:'#224d3e'}).png().toFile(fileURLToPath(new URL(`${name}-green.png`,destination)));
 reports.push({name,width:cell*4,height:cell*3,sourceWidth:width,sourceHeight:height,components,frames});
}
await writeFile(new URL('segmentation.json',destination),JSON.stringify(reports,null,2));
console.log(reports.map(r=>({name:r.name,kept:r.components.filter(c=>!c.removed),removed:r.components.filter(c=>c.removed).length})));
