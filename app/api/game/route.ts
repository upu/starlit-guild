import {gameDb} from '@/db/game-store';
import {act,settle,initialState,migrate,type Action} from '@/lib/game-v2';
import {player,sameOrigin} from '@/lib/player';
import {isStoredGameState,parseGameRequest} from '@/lib/api-input';
import {errorMessage,parseJson} from '@/lib/external-input';
export const dynamic='force-dynamic';
type GameRequest={action:Action;operationId:string};
type JsonResponse=(data:unknown,status?:number)=>Response;

async function requestBody(request:Request,json:JsonResponse):Promise<GameRequest|Response|undefined>{
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'操作形式を確認してください。'},400);
 try{
  const raw=await request.text();
  if(raw.length>2048)return json({error:'操作が大きすぎます。'},400);
  const parsed=parseGameRequest(parseJson(raw));
  return parsed??json({error:'操作を確認してください。'},400);
 }catch{return json({error:'操作を読み取れませんでした。'},400);}
}
function applyRequest(state:ReturnType<typeof migrate>,body:GameRequest|undefined,now:number,json:JsonResponse){
 const duplicate=body&&state.receipts.includes(body.operationId);
 if(!body||duplicate)return {state,duplicate:!!duplicate};
 try{
  const next=act(state,body.action,now);
  next.receipts=[...next.receipts,body.operationId].slice(-64);
  return {state:next,duplicate:false};
 }catch(error){return json({error:errorMessage(error,'操作を確認してください。')},400);}
}
async function saveAttempt(db:ReturnType<typeof gameDb>,uid:string,mode:string,body:GameRequest|undefined,json:JsonResponse){
 const row=await db.prepare('SELECT data, revision FROM game_saves WHERE user_id = ?').bind(uid).first<{data:string;revision:number}>();if(!row)throw Error('Save missing');
 const now=Date.now(),raw=parseJson(row.data);if(!isStoredGameState(raw))throw Error('Invalid save');
 if(raw.version!==2)await db.prepare('INSERT OR IGNORE INTO game_save_backups (user_id, data, created_at) VALUES (?, ?, ?)').bind(uid,row.data,now).run();
 const result=settle(migrate(raw,now),now),applied=applyRequest(result.state,body,now,json);
 if(applied instanceof Response)return applied;
 const changed=await db.prepare('UPDATE game_saves SET data = ?, revision = revision + 1 WHERE user_id = ? AND revision = ?').bind(JSON.stringify(applied.state),uid,row.revision).run();
 if(changed.meta.changes!==1)return null;
 return json({state:applied.state,revision:row.revision+1,serverNow:now,rewards:result.rewards,mode,duplicate:applied.duplicate});
}
async function saveGame(request:Request,body:GameRequest|undefined,json:JsonResponse,setCookie:(value:string|null)=>void){
 const identity=await player(request);setCookie(identity.cookie);const db=gameDb(),uid=identity.id;
 await db.prepare('INSERT OR IGNORE INTO game_saves (user_id, data, revision) VALUES (?, ?, 0)').bind(uid,JSON.stringify(initialState(Date.now()))).run();
 for(let attempt=0;attempt<6;attempt++){
  const response=await saveAttempt(db,uid,identity.mode,body,json);
  if(response)return response;
 }
 return json({error:'保存が重なりました。もう一度お試しください。'},409);
}
async function handle(request:Request,write:boolean){
 let cookie:string|null=null;
 const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store, private',...(cookie?{'Set-Cookie':cookie}:{})}});
 try{
  if(!sameOrigin(request))return json({error:'このページから操作してください。'},403);
  const parsed=write?await requestBody(request,json):undefined;
  if(parsed instanceof Response)return parsed;
  return await saveGame(request,parsed,json,value=>{cookie=value;});
 }catch(e){console.error('Game save error',e);return json({error:'セーブに接続できません。最後の保存は残っています。通信を確認して再接続してください。'},503);}
}
export async function GET(request:Request){return handle(request,false);}
export async function POST(request:Request){return handle(request,true);}
