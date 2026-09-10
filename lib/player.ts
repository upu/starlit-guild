import {getChatGPTUser} from '@/app/chatgpt-auth';
const COOKIE='starlit_guest';
export function readGuest(request:Request){const key=request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);return key&&/^[a-f0-9]{64}$/.test(key)?key:null;}
export async function guestId(key:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));return 'guest:'+Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');}
export function guestCookie(key:string,request:Request){return `${COOKIE}=${key}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(request.url).protocol==='https:'?'; Secure':''}`;}
export async function player(request:Request){const account=await getChatGPTUser();if(account)return {id:account.userId,mode:'account' as const,cookie:null};let key=readGuest(request),cookie:string|null=null;if(!key){key=Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');cookie=guestCookie(key,request);}return {id:await guestId(key),mode:'guest' as const,cookie};}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return (!origin||origin===new URL(request.url).origin)&&request.headers.get('sec-fetch-site')!=='cross-site';}
