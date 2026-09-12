import {parseBundle as parseV3} from '@/lib/save-format-v3';
import {gameDb} from '@/db/game-store';
import {player,sameOrigin} from '@/lib/player';
import {parseBundle} from '@/lib/save-format';
import {isRecord,parseJson} from '@/lib/external-input';
export const dynamic='force-dynamic';
function readBundle(value:unknown){return isRecord(value)&&value.format===3?parseV3(value):parseBundle(value);}
function storedBundle(data:string){try{return readBundle(parseJson(data));}catch{return null;}}
function storedJson(data:string){try{return parseJson(data);}catch{return null;}}
async function handle(request:Request,write:boolean){
 let cookie:string|null=null;const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store, private',...(cookie?{'Set-Cookie':cookie}:{})}});
 try{
  if(!sameOrigin(request))return json({error:'このページから操作してください。'},403);
  const identity=await player(request);cookie=identity.cookie;const db=gameDb();
  if(!write){
   const rows=await db.prepare('SELECT data, updated_at FROM game_device_backups WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20').bind(identity.id).all<{data:string;updated_at:number}>();
   const legacy=await db.prepare('SELECT data FROM game_saves WHERE user_id = ?').bind(identity.id).first<{data:string}>();
   const backups=rows.results.flatMap(row=>{const bundle=storedBundle(row.data);return bundle?[{bundle,at:row.updated_at}]:[];});
   return json({backups,legacy:legacy?storedJson(legacy.data):null});
  }
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'形式を確認してください。'},400);
  const raw=await request.text();if(raw.length>524288)return json({error:'記録が大きすぎます。'},413);
  let bundle;try{bundle=readBundle(parseJson(raw));}catch{return json({error:'記録の形式を確認してください。'},400);}
  const at=Date.now();
  const result=await db.prepare("INSERT INTO game_device_backups (id, user_id, device_id, data, updated_at, revision) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, revision = excluded.revision WHERE excluded.revision > game_device_backups.revision AND json_extract(excluded.data, '$.format') >= json_extract(game_device_backups.data, '$.format')").bind(identity.id+':'+bundle.deviceId,identity.id,bundle.deviceId,JSON.stringify(bundle),at,bundle.serial).run();
  const saved=await db.prepare('SELECT data, updated_at FROM game_device_backups WHERE id = ?').bind(identity.id+':'+bundle.deviceId).first<{data:string;updated_at:number}>();
  if(saved&&readBundle(parseJson(saved.data)).format>bundle.format)return json({error:'新しい版の記録が保存されています。ページを更新してください。'},409);
  return json({at:saved?.updated_at||at,changed:result.meta.changes===1});
 }catch(e){console.error('Backup unavailable',e);return json({error:'クラウドに接続できません。端末の記録でそのまま遊べます。'},503);}
}
export async function GET(request:Request){return handle(request,false);}
export async function POST(request:Request){return handle(request,true);}
