import {gameDb} from '@/db/game-store';
import {act,settle,initialState,migrate,type Action} from '@/lib/game-v2';
import {player,sameOrigin} from '@/lib/player';
import {isStoredGameState,parseGameRequest} from '@/lib/api-input';
import {errorMessage,parseJson} from '@/lib/external-input';
export const dynamic='force-dynamic';
async function handle(request:Request,write:boolean){
 let cookie:string|null=null;
 const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store, private',...(cookie?{'Set-Cookie':cookie}:{})}});
 try{
  if(!sameOrigin(request))return json({error:'このページから操作してください。'},403);
  if(write&&request.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'操作形式を確認してください。'},400);
  let body:{action:Action;operationId:string}|undefined;
  if(write){try{const raw=await request.text();if(raw.length>2048)return json({error:'操作が大きすぎます。'},400);const parsed=parseGameRequest(parseJson(raw));if(!parsed)return json({error:'操作を確認してください。'},400);body=parsed;}catch{return json({error:'操作を読み取れませんでした。'},400);}}
  const identity=await player(request);cookie=identity.cookie;const db=gameDb(),uid=identity.id;
  await db.prepare('INSERT OR IGNORE INTO game_saves (user_id, data, revision) VALUES (?, ?, 0)').bind(uid,JSON.stringify(initialState(Date.now()))).run();
  for(let attempt=0;attempt<6;attempt++){
   const row=await db.prepare('SELECT data, revision FROM game_saves WHERE user_id = ?').bind(uid).first<{data:string;revision:number}>();if(!row)throw Error('Save missing');
   const now=Date.now();const raw=parseJson(row.data);if(!isStoredGameState(raw))throw Error('Invalid save');const upgrading=raw.version!==2;
   if(upgrading)await db.prepare('INSERT OR IGNORE INTO game_save_backups (user_id, data, created_at) VALUES (?, ?, ?)').bind(uid,row.data,now).run();
   const result=settle(migrate(raw,now),now);let state=result.state;const duplicate=body&&state.receipts.includes(body.operationId);
   if(body&&!duplicate){try{state=act(state,body.action,now);state.receipts=[...state.receipts,body.operationId].slice(-64);}catch(error){return json({error:errorMessage(error,'操作を確認してください。')},400);}}
   const changed=await db.prepare('UPDATE game_saves SET data = ?, revision = revision + 1 WHERE user_id = ? AND revision = ?').bind(JSON.stringify(state),uid,row.revision).run();
   if(changed.meta.changes===1)return json({state,revision:row.revision+1,serverNow:now,rewards:result.rewards,mode:identity.mode,duplicate:!!duplicate});
  }
  return json({error:'保存が重なりました。もう一度お試しください。'},409);
 }catch(e){console.error('Game save error',e);return json({error:'セーブに接続できません。最後の保存は残っています。通信を確認して再接続してください。'},503);}
}
export async function GET(request:Request){return handle(request,false);}
export async function POST(request:Request){return handle(request,true);}
