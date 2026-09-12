import {originalArt} from '@/lib/original-characters';

const faces:Record<number,string>={0:'/portraits/aria.png',1:'/portraits/leon.png'};
// Existing characters retain their own artwork, framed around the face in the UI.
const centers:Partial<Record<number,[number,number]>>={2:[.51,.30],3:[.61,.30],4:[.41,.29],5:[.53,.40],6:[.56,.29],7:[.57,.28],12:[.52,.20],13:[.53,.25],14:[.52,.20]};
export function Portrait({index,size=56}:{index:number;size?:number}){
 const face=faces[index],original=originalArt(index);
 const [cx,cy]=centers[index]||[.5,.3],crop=original?.42:.54;
 const cols=original?1:4,rows=original?1:3;
 const x=((original?0:index%4)+cx-crop/2)/cols,y=((original?0:Math.floor(index/4))+Math.max(0,cy-crop/2))/rows;
 return <span className="face-portrait" aria-hidden="true" style={{width:size,height:size,backgroundImage:`url(${face||original||'/sprites.png'})`,backgroundSize:face?'cover':`${cols/crop*100}% ${rows/crop*100}%`,backgroundPosition:face?'center':`${x/(1-crop/cols)*100}% ${y/(1-crop/rows)*100}%`}}/>;
}
