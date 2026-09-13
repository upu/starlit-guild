'use client';
import Image from 'next/image';
import {useJourneyHints} from './use-journey-hints';
import {shopTier} from '@/lib/equipment';
import type {State} from '@/lib/game';
import type {JourneyGoal} from '@/lib/journey';

const shopHint:JourneyGoal={hintId:'shop-unlocked-v1',title:'お店が開きました',detail:'装備を見てみよう',action:'お店を開く',destination:'adventure'};
export function ShopEntry({state,profileId,obscured,onOpen}:{state:State;profileId?:string;obscured:boolean;onOpen:()=>void}){
 const hint=useJourneyHints(profileId,shopHint);
 if(shopTier(state)===0)return null;
 const announce=hint.unread&&!obscured;
 function open(){hint.markRead();onOpen();}
 return <div className="shop-entry-anchor"><button className={'outline shop-entry'+(announce?' shop-entry-new':'')} onClick={open} aria-label="お店を開く" aria-describedby={announce?'shop-unlock-tip':undefined}><Image src="/ui/shop-stall.png" width={32} height={32} alt="" unoptimized/><span>お店</span></button>{announce&&<div id="shop-unlock-tip" className="shop-unlock-tip" role="status"><b>お店が開きました！</b><span>装備を見てみよう</span></div>}</div>;
}
