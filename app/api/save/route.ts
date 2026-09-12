import {getChatGPTUser} from '@/app/chatgpt-auth';
import {readGuest,guestId,guestCookie,sameOrigin} from '@/lib/player';
import {gameDb} from '@/db/game-store';
import {parseRecoveryKey} from '@/lib/api-input';
import {parseJson} from '@/lib/external-input';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store, private'}});
export async function GET(request:Request){if(!sameOrigin(request))return json({error:'このページから操作してください。'},403);const key=readGuest(request);if(await getChatGPTUser())return json({error:'このセーブはログインしたアカウントで復元できます。'},400);if(!key)return json({error:'まだゲストセーブがありません。'},404);return new Response(JSON.stringify({game:'starlit-guild',recoveryKey:key},null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="starlit-guild-recovery.json"','Cache-Control':'no-store, private'}});}
export async function POST(request:Request){try{if(!sameOrigin(request))return json({error:'このページから操作してください。'},403);if(await getChatGPTUser())return json({error:'ゲストの冒険を復元するには、ログアウトしてください。'},400);const raw=await request.text();if(raw.length>1024)return json({error:'復元ファイルを確認してください。'},400);const recoveryKey=parseRecoveryKey(parseJson(raw));if(!recoveryKey)return json({error:'復元ファイルを確認してください。'},400);const exists=await gameDb().prepare('SELECT user_id FROM game_saves WHERE user_id = ?').bind(await guestId(recoveryKey)).first();if(!exists)return json({error:'このセーブが見つかりません。'},404);return Response.json({ok:true},{headers:{'Set-Cookie':guestCookie(recoveryKey,request),'Cache-Control':'no-store, private'}});}catch{return json({error:'復元できませんでした。ファイルと通信を確認してください。'},400);}}
