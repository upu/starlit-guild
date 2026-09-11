// Keep the destination cards and their playable map on the same illustration.
export function questScenery(quest?:{id:string;background?:string}){
 if(quest?.background)return quest.background;
 if(quest?.id==='crystal')return '/cave.png';
 if(quest?.id==='dragon')return '/ruins.png';
 return ['pilgrim','wolf','royal'].includes(quest?.id||'')?'/valley.png':'/forest.png';
}
