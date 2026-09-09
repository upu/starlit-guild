import {getChatGPTUser} from '@/app/chatgpt-auth';
import {gameDb} from '@/db/game-store';
import {act,settle,initialState,type State,type Action} from '@/lib/game';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store, private'}});
async function handle(request:Request,write:boolean){
 try{
  const user=await getChatGPTUser();if(!user)return json({error:'続きの冒険を保存するにはログインしてください。',signIn:true},401);
  if(write){const origin=request.headers.get('origin');if(origin && origin!==new URL(request.url).origin)return json({error:'別のページからの操作は受け付けられません。'},403);if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'操作形式を確認してください。'},400);}
  let body:{action:Action;revision:number}|undefined;
  if(write){try{const raw=await request.text();if(raw.length>2048)return json({error:'操作が大きすぎます。'},400);body=JSON.parse(raw);if(!body||!body.action||!Number.isInteger(body.revision))return json({error:'操作を確認してください。'},400);}catch{return json({error:'操作を読み取れませんでした。'},400);}}
  const db=gameDb();const uid=user.userId;
  await db.prepare('INSERT OR IGNORE INTO game_saves (user_id, data, revision) VALUES (?, ?, 0)').bind(uid,JSON.stringify(initialState(Date.now()))).run();
  for(let attempt=0;attempt<4;attempt++){
   const row=await db.prepare('SELECT data, revision FROM game_saves WHERE user_id = ?').bind(uid).first<{data:string;revision:number}>();if(!row)throw Error('Save missing');
   const now=Date.now();const result=settle(JSON.parse(row.data) as State,now);
   if(body && row.revision!==body.revision)return json({error:'別の画面で冒険が進みました。更新してから、もう一度操作してください。',conflict:true},409);
   let state=result.state;if(body){try{state=act(state,body.action,now);}catch(e){return json({error:(e as Error).message},400);}}
   const changed=await db.prepare('UPDATE game_saves SET data = ?, revision = revision + 1 WHERE user_id = ? AND revision = ?').bind(JSON.stringify(state),uid,row.revision).run();
   if(changed.meta.changes===1)return json({state,revision:row.revision+1,serverNow:now,rewards:result.rewards});
  }
  return json({error:'保存が重なりました。少し待って再読み込みしてください。'},409);
 }catch(e){console.error('Game save error',e);return json({error:'セーブに接続できません。通信を確認して再接続してください。冒険は最後の保存から再開できます。'},503);}
}
export async function GET(request:Request){return handle(request,false);}
export async function POST(request:Request){return handle(request,true);}
