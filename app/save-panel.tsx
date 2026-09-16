'use client';
import {useRef,useState} from 'react';
import {CloudCheck,Download,Upload,Settings,RefreshCw,Plus,Volume2,FlaskConical,Trash2} from 'lucide-react';
import {Dialog,DialogTrigger,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle,AlertDialogTrigger} from '@/components/ui/alert-dialog';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {Input} from '@/components/ui/input';
import {Switch} from '@/components/ui/switch';
import {toast} from 'sonner';
import {QuestProgressionSetting} from './quest-progression-setting';
import {MusicSettings} from './music-settings';
import type {useGameMusic} from './use-game-music';
import type {useLocalGame} from './use-local-game';
import {errorMessage} from '@/lib/external-input';
type Game=ReturnType<typeof useLocalGame>;
export function SavePanel({game,music}:{game:Game;music:ReturnType<typeof useGameMusic>}){
 const [open,setOpen]=useState(false),[showCloud,setShowCloud]=useState(false);const file=useRef<HTMLInputElement>(null);
 const {bundle,profile}=game;
 return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><button className="save-status"><Settings size={20}/><span>{game.error?'保存を確認':game.ready?'セーブ・設定':'読み込み中…'}</span></button></DialogTrigger><DialogContent className="save-dialog"><DialogHeader><DialogTitle>冒険のセーブと設定</DialogTitle><DialogDescription>端末に自動保存。開いている間は約5分ごとにクラウドへバックアップします。</DialogDescription></DialogHeader>
 {bundle&&<Tabs defaultValue="records"><TabsList className="save-pagination"><TabsTrigger value="records">記録</TabsTrigger><TabsTrigger value="cloud">クラウド</TabsTrigger><TabsTrigger value="files">ファイル</TabsTrigger><TabsTrigger value="settings">設定</TabsTrigger></TabsList><TabsContent value="records"><RecordsSection game={game} onSelect={()=>{setOpen(false)}}/>
 </TabsContent><TabsContent value="cloud"><section className="save-section"><h3>バックアップ</h3><p>端末への保存：{game.saved?new Date(game.saved).toLocaleTimeString('ja-JP'):'準備中'}<br/>クラウド：{bundle.cloudAt?new Date(bundle.cloudAt).toLocaleString('ja-JP'):'次の自動バックアップを待っています'}</p>{game.cloudError&&<p role="status">{game.cloudError}</p>}<div className="save-buttons"><button onClick={()=>void game.backup()} disabled={game.cloudBusy||game.otherTab}><CloudCheck size={15}/>{game.cloudBusy?'バックアップ中…':'今すぐバックアップ'}</button><button className="outline" onClick={()=>{setShowCloud(!showCloud);void game.refreshCopies()}}><RefreshCw size={15}/>クラウドから復元</button></div>{showCloud&&<div className="cloud-copies">{game.copies.length===0?<p>バックアップがまだありません。</p>:game.copies.flatMap(copy=>copy.bundle.profiles.map(p=><button className="outline" key={copy.bundle.deviceId+p.id} disabled={game.otherTab} onClick={()=>{try{game.restoreCopy(p);setOpen(false)}catch(e){toast.error((e as Error).message)}}}><span>{p.name}<small>{p.state.clears} 件 · {new Date(copy.at).toLocaleString('ja-JP')}</small></span><span>復元</span></button>))}</div>}<small>バックアップはサイトを開いているあなたの認証情報に紐づきます。ゲーム側の追加ログインはありません。閉じている間のクラウド保存は行いません。</small></section>
 </TabsContent><TabsContent value="files"><section className="save-section"><h3>ファイルにも保管</h3><p>ブラウザーのデータを消す前や、別の端末へ移すときに。読み込みは別の記録として追加します。</p><div className="save-buttons"><button className="outline" onClick={game.download}><Download size={15}/>この記録を保存</button><button className="outline" disabled={game.otherTab} onClick={()=>file.current?.click()}><Upload size={15}/>ファイルを読み込む</button></div><SaveCapacityNote count={bundle.profiles.length}/><small>保存する記録：{profile?.name}。ファイルには、この記録の進行が入ります。</small></section>
 </TabsContent><TabsContent value="settings"><QuestProgressionSetting checked={game.s.autoNextQuest===true} onChange={value=>{game.dispatch({type:'autoNextQuest',value});}} disabled={game.otherTab}/><MusicSettings music={music} disabled={game.otherTab}/><label className="switch-row"><span><Volume2 size={15}/> 効果音</span><Switch checked={bundle.sound} onCheckedChange={game.toggleSound} disabled={game.otherTab} aria-label="効果音"/></label><small>{bundle.sound?'手助けや報酬の効果音が鳴ります。':'効果音はオフです。'}</small><TestControls game={game} onAdjust={()=> { setOpen(false); }}/></TabsContent></Tabs>}
 {!bundle&&<button onClick={()=>file.current?.click()}><Upload size={15}/>保存ファイルから復元</button>}
 <input type="file" accept="application/json,.json" hidden ref={file} onChange={e=>{const f=e.target.files?.[0];if(f)void game.importFile(f).then(()=> { setOpen(false); }).catch((error:unknown)=>toast.error(errorMessage(error,'保存ファイルを読み込めませんでした。')));e.target.value=''}}/>
 </DialogContent></Dialog>
}
function SaveCapacityNote({count}:{count:number}){
 if(count<12)return null;
 return <p className="save-capacity-note" role="status">記録が12個あります。「記録」で不要なものを削除すると読み込めます。</p>;
}
function RecordsSection({game,onSelect}:{game:Game;onSelect:()=>void}){
 const bundle=game.bundle;if(!bundle)return null;
 return <section className="save-section"><div className="save-section-heading"><h3>遊ぶ記録</h3><span>{bundle.profiles.length} / 12</span></div><Select value={bundle.active} onValueChange={id=>{game.switchProfile(id);onSelect()}} disabled={game.otherTab}><SelectTrigger aria-label="遊ぶ記録を選ぶ" className="full"><SelectValue/></SelectTrigger><SelectContent>{bundle.profiles.map(p=><SelectItem key={p.id} value={p.id}>{p.test?'🧪 ':''}{p.name} · {p.state.clears} 件達成</SelectItem>)}</SelectContent></Select><div className="save-buttons"><button className="outline" disabled={game.otherTab} onClick={()=>{game.createProfile();onSelect()}}><Plus size={15}/>最初から遊ぶ</button><TestProfileButton game={game} onCreate={onSelect}/></div><small>今の記録は残ります。別の記録で冒険しても、獲得したものは混ざりません。</small><div className="save-records" aria-label="記録を整理">{bundle.profiles.map(p=><div className="save-record" key={p.id}><span><b>{p.test?'🧪 ':''}{p.name}</b><small>{p.state.clears} 件達成{p.id===bundle.active?' · 遊んでいます':''}</small></span><DeleteProfileButton profile={p} disabled={game.otherTab||bundle.profiles.length<=1} onDelete={()=>game.deleteProfile(p.id)}/></div>)}</div>{bundle.profiles.length<=1&&<small>最後の1件は削除できません。</small>}</section>;
}
function DeleteProfileButton({profile,disabled,onDelete}:{profile:NonNullable<Game['profile']>;disabled:boolean;onDelete:()=>boolean}){
 return <AlertDialog><AlertDialogTrigger asChild><button className="outline save-record-delete" disabled={disabled} aria-label={`「${profile.name}」を削除`}><Trash2 size={15}/>削除</button></AlertDialogTrigger><AlertDialogContent className="game-confirm"><AlertDialogHeader><AlertDialogTitle>この記録を削除しますか？</AlertDialogTitle><AlertDialogDescription>「{profile.name}」をこの端末から削除します。元に戻せません。残したい場合は、先にファイルへ保存してください。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>やめる</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={onDelete}>削除する</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
function TestProfileButton({game,onCreate}:{game:Game;onCreate:()=>void}){
 if(!game.testToolsEnabled)return null;
 return <button className="outline" disabled={game.otherTab} onClick={()=>{game.createProfile(true);onCreate()}}><FlaskConical size={15}/>テスト用を作る</button>;
}
export function TestControls({game,onAdjust}:{game:Game;onAdjust:()=>void}){
 const [clears,setClears]=useState(15),[lv,setLv]=useState(5),[gold,setGold]=useState(3000);
 if(!game.testToolsEnabled||!game.profile?.test)return null;
 const adjust=(clears:number,lv:number,gold:number)=>{game.adjust(clears,lv,gold);onAdjust();};
 return <section className="test-controls"><div><FlaskConical size={18}/><b>テスト用の冒険</b><small>変更するのはこの記録だけです。適用すると、隊はキャンプへ戻ります。</small></div><div className="test-presets"><button className="outline" disabled={game.otherTab} onClick={()=> { adjust(0,1,60); }}>序盤</button><button className="outline" disabled={game.otherTab} onClick={()=> { adjust(20,8,5000); }}>中盤</button><button className="outline" disabled={game.otherTab} onClick={()=> { adjust(60,20,20000); }}>全解放</button></div><div className="test-fields"><label>達成数<Input type="number" min={0} max={1000} value={clears} onChange={e=> { setClears(Number(e.target.value)); }}/></label><label>仲間のLv.<Input type="number" min={1} max={50} value={lv} onChange={e=> { setLv(Number(e.target.value)); }}/></label><label>所持金<Input type="number" min={0} max={10000000} value={gold} onChange={e=> { setGold(Number(e.target.value)); }}/></label><button disabled={game.otherTab||![clears,lv,gold].every(Number.isFinite)} onClick={()=> { adjust(clears,lv,gold); }}>適用する</button></div></section>
}
