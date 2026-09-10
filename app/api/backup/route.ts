import {gameDb} from '@/db/game-store';
import {player,sameOrigin} from '@/lib/player';
import {parseBundle} from '@/lib/save-format';
export const dynamic='force-dynamic';
async function handle(request:Request,write:boolean){
 let cookie:string|null=null;const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store, private',...(cookie?{'Set-Cookie':cookie}:{})}});
 try{
  if(!sameOrigin(request))return json({error:'このページから操作してください。'},403);
  const identity=await player(request);cookie=identity.cookie;const db=gameDb();
  if(!write){
   const rows=await db.prepare('SELECT data, updated_at FROM game_device_backups WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20').bind(identity.id).all<{data:string;updated_at:number}>();
   const legacy=await db.prepare('SELECT data FROM game_saves WHERE user_id = ?').bind(identity.id).first<{data:string}>();
   return json({backups:rows.results.map(r=>({bundle:JSON.parse(r.data),at:r.updated_at})),legacy:legacy?JSON.parse(legacy.data):null});
  }
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'形式を確認してください。'},400);
  const raw=await request.text();if(raw.length>524288)return json({error:'記録が大きすぎます。'},413);
  let bundle;try{bundle=parseBundle(JSON.parse(raw));}catch{return json({error:'記録の形式を確認してください。'},400);}
  const at=Date.now();
  const result=await db.prepare('INSERT INTO game_device_backups (id, user_id, device_id, data, updated_at, revision) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, revision = excluded.revision WHERE excluded.revision > game_device_backups.revision').bind(identity.id+':'+bundle.deviceId,identity.id,bundle.deviceId,JSON.stringify(bundle),at,bundle.serial).run();
  const saved=await db.prepare('SELECT updated_at FROM game_device_backups WHERE id = ?').bind(identity.id+':'+bundle.deviceId).first<{updated_at:number}>();
  return json({at:saved?.updated_at||at,changed:result.meta.changes===1});
 }catch(e){console.error('Backup unavailable',e);return json({error:'クラウドに接続できません。端末の記録でそのまま遊べます。'},503);}
}
export async function GET(request:Request){return handle(request,false);}
export async function POST(request:Request){return handle(request,true);}
