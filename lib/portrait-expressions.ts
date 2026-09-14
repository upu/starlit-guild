// Row-major cells in each character's 4 x 2 expression sheet.
export const portraitExpressions = ['neutral','smile','surprised','worried','serious','shy','tired','mischievous'] as const;
export type PortraitExpression = typeof portraitExpressions[number];

const portraitCharacters:Partial<Record<number,string>> = {0:'aria',1:'leon',2:'mira',13:'pumpety'};

export function expressionPortrait(index:number,expression:PortraitExpression='neutral'){
 const character=portraitCharacters[index];
 if(!character)return null;
 const cell=Math.max(0,portraitExpressions.indexOf(expression));
 // Frame the eyes and mouth, allowing the hair and ornaments to leave the frame.
 // Keep the crop inside its own cell so neighbouring expressions never bleed in.
 const crop=.64,centerY=index===2||index===13?.62:.60;
 const x=(cell%4+.5-crop/2)/(4-crop)*100;
 const y=(Math.floor(cell/4)+centerY-crop/2)/(2-crop)*100;
 return {src:`/portraits/${character}-expressions.webp`,size:`${String(4/crop*100)}% ${String(2/crop*100)}%`,position:`${String(x)}% ${String(y)}%`};
}
