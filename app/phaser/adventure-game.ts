import type Phaser from 'phaser';
import {heroes,type GameEvent} from '@/lib/game';
import {adventureFrame,adventureAssets,adventureAction,adventureHit,eventColor,spriteAsset,spriteSize,type AdventureFrame} from '@/lib/adventure-presentation';
import type {AdventureBridge,AdventureRenderer} from './renderer-session';
import {heroSheets,heroAnimation} from '@/lib/hero-animation';

type Figure={image:Phaser.GameObjects.Image;shadow:Phaser.GameObjects.Ellipse;label:Phaser.GameObjects.Text};
const font='"Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif';

// This module is imported only after mounting in the browser. It never runs on the server.
export function createAdventureGame(parent:HTMLElement,bridge:AdventureBridge,engine:typeof Phaser):AdventureRenderer{
 const Phaser=engine;
 let disposed=false,paused=false,created=false;
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let reduced=motion.matches;
 const onMotion=()=>{reduced=motion.matches;if(reduced&&created)scene.stopMotion();};
 motion.addEventListener('change',onMotion);

 class AdventureScene extends Phaser.Scene{
  private background!:Phaser.GameObjects.Image;
  private shade!:Phaser.GameObjects.Graphics;
  private meters!:Phaser.GameObjects.Graphics;
  private ambient!:Phaser.GameObjects.Graphics;
  private figures=new Map<string,Figure>();
  private opponent:Figure|null=null;
  private guest:Figure|null=null;
  private discovery!:Phaser.GameObjects.Image;
  private discoveryLabel!:Phaser.GameObjects.Text;
  private effects=new Set<Phaser.GameObjects.GameObject>();
  private seen=new Map<string,number>();
  private sceneKey='';
  private cutinKey='';
  private backgroundKey='';
  private loading=false;
  private failed=false;

  constructor(){super('adventure');}
  preload(){
   this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR,()=>{this.failed=true;bridge.status('error');});
   for(const asset of adventureAssets(adventureFrame(bridge.read())))this.load.image(asset,asset);
  }
  create(){
   try{this.initialize();}catch(error){this.failed=true;console.error('Adventure setup failed',error);bridge.status('error');}
  }
  private initialize(){
   if(disposed)return;
   if(this.failed){bridge.status('error');return;}
   const atlas=this.textures.get('/sprites.png'),source=atlas.getSourceImage() as HTMLImageElement;
   for(let i=0;i<12;i++)atlas.add(String(i),0,Math.round(i%4*source.width/4),Math.round(Math.floor(i/4)*source.height/3),Math.floor(source.width/4),Math.floor(source.height/3));
   this.background=this.add.image(0,0,adventureFrame(bridge.read()).background).setDepth(0);
   this.shade=this.add.graphics().setDepth(1);
   this.ambient=this.add.graphics().setDepth(2);
   this.meters=this.add.graphics().setDepth(30);
   this.discovery=this.add.image(0,0,'/items/chest.png').setDepth(25).setOrigin(.5,.9).setVisible(false);
   this.discoveryLabel=this.add.text(0,0,'',{fontFamily:font,fontSize:'12px',color:'#fff0bd',stroke:'#17352a',strokeThickness:4}).setOrigin(.5,0).setDepth(26);
   // A single pointer handler resolves one intent, avoiding bubbling double-assists.
   this.input.on(Phaser.Input.Events.POINTER_UP,(pointer:Phaser.Input.Pointer)=>{
    if(disposed||paused||this.loading||this.failed||pointer.button!==0||pointer.getDistance()>14)return;
    const input=bridge.read(),frame=adventureFrame(input);
    const intent=adventureHit(frame,{x:pointer.x,y:pointer.y},this.scale.width,this.scale.height);
    const action=adventureAction(input,intent);
    if(action)bridge.act(action);
   });
   this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=> { this.clearEffects(); });
   created=true;
   bridge.status('ready');
   // Render once even when an open menu has suspended the animation loop.
   this.paint();
   queueMicrotask(syncPause);
  }
  private makeFigure(index:number,name:string):Figure{
   const asset=spriteAsset(index);
   return {
    image:this.add.image(0,0,asset,asset==='/sprites.png'?String(index):undefined).setOrigin(.5,.9),
    shadow:this.add.ellipse(0,0,60,12,0x092821,.28).setDepth(4),
    label:this.add.text(0,0,name,{fontFamily:font,fontSize:'12px',color:'#fff1cf',stroke:'#132e27',strokeThickness:4}).setOrigin(.5,0).setDepth(31),
   };
  }
  private registerSheets(){
   for(const sheet of Object.values(heroSheets)){
    if(!sheet)continue;
    const {asset,columns,rows}=sheet;
    if(!this.textures.exists(asset))continue;
    const texture=this.textures.get(asset);
    if(texture.has('0'))continue;
    const source=texture.getSourceImage() as HTMLImageElement;
    const w=source.width/columns,h=source.height/rows;
    for(let i=0;i<columns*rows;i++)texture.add(String(i),0,Math.round(i%columns*w),Math.round(Math.floor(i/columns)*h),Math.floor(w),Math.floor(h));
   }
  }
  private removeFigure(figure:Figure){figure.image.destroy();figure.shadow.destroy();figure.label.destroy();}
  private ensureAssets(frame:AdventureFrame){
   const missing=adventureAssets(frame).filter(asset=>!this.textures.exists(asset));
   if(!missing.length)return true;
   if(!this.loading){
    this.loading=true;bridge.status('loading');
    for(const asset of missing)this.load.image(asset,asset);
    this.load.once(Phaser.Loader.Events.COMPLETE,()=>{
     this.loading=false;
     if(!disposed&&!this.failed)bridge.status('ready');
    });
    this.load.start();
   }
   return false;
  }
  private clearEffects(){
   for(const effect of this.effects){this.tweens.killTweensOf(effect);effect.destroy();}
   this.effects.clear();this.seen.clear();
  }
  stopMotion(){this.clearEffects();this.cameras.main.resetFX();}
  private transient(object:Phaser.GameObjects.GameObject,properties:Record<string,unknown>,duration:number){
   // Rapid assistance cannot grow the scene indefinitely.
   if(this.effects.size>=64){object.destroy();return;}
   this.effects.add(object);
   this.tweens.add({targets:object,...properties,duration:Math.max(60,duration),ease:'Cubic.Out',onComplete:()=>{this.effects.delete(object);object.destroy();}});
  }
  private eventEffect(event:GameEvent,frame:AdventureFrame,now:number){
   const width=this.scale.width,height=this.scale.height,age=now-event.at;
   const actor=frame.members.find(m=>m.id===event.hero)||frame.members[0];
   const support=event.kind==='heal'||event.kind==='hurt'||event.kind==='skill'&&!event.amount;
   const dest=support?actor:frame.target;
   if(!dest)return;
   const x=dest.x*width,y=dest.y*height-spriteSize(width,height)*.45,color=eventColor(event);
   if(event.amount){
    const positive=event.kind==='heal'||event.kind==='gather'||event.kind==='assist'&&!frame.target?.battle;
    const text=this.add.text(x+(this.seen.size%3-1)*15,y-18,(positive?'+':'−')+String(event.amount),{fontFamily:font,fontSize:event.kind==='burst'?'30px':'23px',fontStyle:'bold',color:'#'+color.toString(16).padStart(6,'0'),stroke:'#123229',strokeThickness:5}).setOrigin(.5).setDepth(55);
    this.transient(text,{y:y-(reduced?18:58),alpha:0},1000-age);
   }
   if(reduced||age>650)return;
   const size=event.kind==='burst'?38:event.kind==='skill'?27:17;
   const ring=this.add.circle(x,y,size).setStrokeStyle(2,color,.95).setDepth(48);
   this.transient(ring,{scale:2.2,alpha:0},550-age);
   const ranged=['ranged','mage','bard','healer'].includes(actor.role)&&!support&&frame.target?.battle;
   if(ranged){
    const bolt=this.add.circle(actor.x*width,actor.y*height-40,actor.role==='mage'?7:3,color).setDepth(46);
    this.transient(bolt,{x,y,alpha:.1},Math.max(100,350-age));
   }else if(!support&&frame.target?.battle){
    const slash=this.add.graphics().setPosition(x,y).setDepth(49);
    slash.lineStyle(event.kind==='skill'?6:3,0xfff9e4,.95).lineBetween(-25,20,25,-20);
    this.transient(slash,{scaleX:1.6,scaleY:1.4,alpha:0},350-age);
   }
   for(let i=0;i<5;i++){
    const angle=i*Math.PI*2/5;
    const mote=this.add.circle(x,y,2+(i%2),color).setDepth(47);
    this.transient(mote,{x:x+Math.cos(angle)*45,y:y+Math.sin(angle)*35-(support?20:0),alpha:0},650-age);
   }
  }
  private paint(){
   const input=bridge.read(),now=input.now,frame=adventureFrame(input),width=this.scale.width,height=this.scale.height;
   if(!this.ensureAssets(frame))return;
   this.registerSheets();
   if(frame.key!==this.sceneKey){this.clearEffects();this.sceneKey=frame.key;}
   if(frame.background!==this.backgroundKey){this.background.setTexture(frame.background);this.backgroundKey=frame.background;}
   const source=this.background.texture.getSourceImage() as HTMLImageElement;
   const cover=Math.max(width/source.width,height/source.height)*1.055;
   this.background.setScale(cover).setPosition(width/2+(reduced?0:Math.sin(now/11000)*width*.009),height/2);
   this.shade.clear();
   for(let i=0;i<10;i++)this.shade.fillStyle(0x092c25,.35*(1-i/10)).fillRect(0,i*12,width,12);
   this.shade.fillStyle(0x0b3028,.15).fillRect(0,height-45,width,45);
   this.ambient.clear();
   if(!reduced)for(let i=0;i<12;i++){
    const t=(now/1000+i*2.3)%14/14;
    this.ambient.fillStyle(0xffefae,Math.sin(t*Math.PI)*.6).fillCircle((.06+(i*29%88)/100)*width+Math.sin(t*5+i)*12,height*(.92-t*.82),i%3===0?2:1);
   }
   const size=spriteSize(width,height,frame.phase==='idle');
   for(const [id,figure] of this.figures)if(!frame.members.some(m=>m.id===id)){this.removeFigure(figure);this.figures.delete(id);}
   this.meters.clear();
   frame.members.forEach((member,i)=>{
    let figure=this.figures.get(member.id);
    if(!figure){figure=this.makeFigure(member.sprite,member.name);this.figures.set(member.id,figure);}
    const pose=heroSheets[member.id]?.ready?heroAnimation(member,frame,now,reduced):null;
    if(pose)figure.image.setTexture(pose.asset,pose.frame);
    const artSize=pose?size*1.12:size;
    const bob=reduced||pose?0:Math.sin(now/(member.walking?85:550)+i*2)*(member.walking?4:1.7);
    const front=['melee','rogue','tank'].includes(member.role);
    const attacking=!pose||Number(pose.frame)>=4&&Number(pose.frame)<=7;
    const lunge=!reduced&&front&&attacking?member.attack*size*.18:0;
    const x=member.x*width+lunge,y=member.y*height+bob;
    figure.image.setPosition(x,y).setDisplaySize(artSize,artSize).setAngle(reduced||pose?0:member.walking?Math.sin(now/100+i)*3:front?member.attack*-7:0).setDepth(10+member.y*10).setAlpha(frame.phase==='rest'?.65:1);
    figure.shadow.setPosition(member.x*width,member.y*height+3).setDisplaySize(size*.55,size*.10);
    figure.label.setPosition(member.x*width,member.y*height+size*.13).setText(member.exploring?'寄り道中':member.name);
    const hurt=frame.events.some(e=>e.kind==='hurt'&&now-e.at<130);
    if(hurt&&!reduced)figure.image.setTint(0xffb2a2);else figure.image.clearTint();
    if(input.squad.run&&i===0){
     const barWidth=Math.min(76,size*.78),barY=member.y*height+size*.12;
     this.meters.fillStyle(0x09271f,.85).fillRoundedRect(member.x*width-barWidth/2,barY,barWidth,5,2);
     this.meters.fillStyle(frame.hp<.3?0xf2aa89:0xa8deb0,1).fillRoundedRect(member.x*width-barWidth/2,barY,barWidth*frame.hp,5,2);
     figure.label.setY(barY+9);
     if(frame.ward){this.meters.lineStyle(2,0xb2def5,.65).strokeEllipse(member.x*width,member.y*height-size*.35,size*.82,size*1.02);}
    }
   });
   if(frame.target){
    const target=frame.target,asset=target.asset;
    if(!this.opponent)this.opponent=this.makeFigure(target.sprite,target.name);
    this.opponent.image.setTexture(asset,asset==='/sprites.png'?String(target.sprite):undefined);
    const enemySize=size*1.08,pulse=reduced?1:1+Math.sin(now/420)*.015;
    const hurt=frame.events.some(e=>['hit','assist','burst','skill'].includes(e.kind)&&now-e.at<140);
    const striking=frame.events.find(e=>e.kind==='hurt'&&now-e.at<320);
    const offset=striking&&!reduced?-Math.sin((now-striking.at)/320*Math.PI)*12:0;
    this.opponent.image.setPosition(target.x*width+offset,target.y*height).setDisplaySize(enemySize*pulse,enemySize/pulse).setFlipX(target.battle).setDepth(16);
    if(hurt&&!reduced)this.opponent.image.setTint(0xffedb1);else this.opponent.image.clearTint();
    this.opponent.shadow.setPosition(target.x*width,target.y*height+3).setDisplaySize(enemySize*.6,enemySize*.12);
    this.opponent.label.setText(target.name).setFontSize(width<500?11:13).setWordWrapWidth(Math.min(180,width*.32),true).setPosition(target.x*width,target.y*height+enemySize*.13+10);
    const bar=Math.min(92,enemySize*.8),y=target.y*height+enemySize*.12;
    this.meters.fillStyle(0x17352e,.9).fillRoundedRect(target.x*width-bar/2,y,bar,5,2);
    this.meters.fillStyle(target.battle?0xf1b38e:0xe9d89a).fillRoundedRect(target.x*width-bar/2,y,bar*target.value,5,2);
   }else if(this.opponent){this.removeFigure(this.opponent);this.opponent=null;}
   const guest=frame.quest.companion&&input.squad.run?heroes.find(h=>h.id===frame.quest.companion):null;
   if(guest){
    if(!this.guest)this.guest=this.makeFigure(guest.sprite,guest.name);
    const asset=spriteAsset(guest.sprite);
    this.guest.image.setTexture(asset,asset==='/sprites.png'?String(guest.sprite):undefined).setPosition(width*.12,height*.82).setDisplaySize(size*.65,size*.65).setDepth(19);
    this.guest.shadow.setPosition(width*.12,height*.82).setDisplaySize(size*.4,size*.07);
    this.guest.label.setText(guest.name+' · 同行中').setPosition(width*.12,height*.82+size*.1);
   }else if(this.guest){this.removeFigure(this.guest);this.guest=null;}
   const d=frame.discovery;
   this.discovery.setVisible(!!d);this.discoveryLabel.setVisible(!!d);
   if(d){
    const float=reduced?0:Math.sin(now/380)*3;
    this.discovery.setTexture(`/items/${d.kind}.png`).setPosition(d.x*width,d.y*height+float).setDisplaySize(64,64).setAlpha(d.claimed?.55:1);
    this.discoveryLabel.setText(d.claimed?'見つけた！':d.kind==='chest'?'隠し宝箱':d.kind==='herb'?'光る薬草':'迷子の精霊').setPosition(d.x*width,d.y*height+10);
   }
   for(const [id,at] of this.seen)if(now-at>2000)this.seen.delete(id);
   for(const event of frame.events){
    if(this.seen.has(event.id))continue;
    this.seen.set(event.id,event.at);
    if(['hit','skill','heal','hurt','burst','combo','assist','gather'].includes(event.kind))this.eventEffect(event,frame,now);
   }
   if(frame.cutin){
    const key=input.squad.id+':'+frame.cutin.kind+':'+String(frame.cutin.at);
    if(key!==this.cutinKey){
     this.cutinKey=key;
     if(!reduced){
      if(frame.cutin.kind==='burst')this.cameras.main.shake(160,.003);
      const wave=this.add.circle(width*.65,height*.55,30).setStrokeStyle(4,0xffe3a0,.9).setDepth(45);
      this.transient(wave,{scale:Math.max(width,height)/40,alpha:0},700);
     }
    }
   }
  }
  update(){
   if(!created||disposed||paused||this.failed)return;
   try{this.paint();}catch(error){this.failed=true;console.error('Adventure scene failed',error);bridge.status('error');}
  }
 }

 const scene=new AdventureScene();
 const width=Math.max(1,parent.clientWidth),height=Math.max(1,parent.clientHeight);
 let game:Phaser.Game;
 try{
  game=new Phaser.Game({type:Phaser.AUTO,parent,width,height,backgroundColor:'#193d30',banner:false,
   antialias:true,roundPixels:false,audio:{noAudio:true},input:{keyboard:false},
   scale:{mode:Phaser.Scale.NONE,expandParent:false},fps:{target:60},scene,
  });
 }catch(error){motion.removeEventListener('change',onMotion);throw error;}
 function syncPause(){
  if(disposed||!created)return;
  if(paused)game.loop.sleep();else game.loop.wake();
 }
 const contextLost=()=>{if(!disposed)bridge.status('error');};
 game.canvas.addEventListener('webglcontextlost',contextLost);
 return {
  resize(w,h){if(!disposed&&w>0&&h>0&&(game.scale.width!==w||game.scale.height!==h)){game.scale.resize(w,h);if(created&&!paused)game.scale.updateBounds();}},
  setPaused(value){if(paused===value)return;paused=value;syncPause();},
  destroy(){
   if(disposed)return;disposed=true;motion.removeEventListener('change',onMotion);
   game.canvas.removeEventListener('webglcontextlost',contextLost);
   // Phaser schedules destruction on its next frame, including while a menu has slept it.
   game.destroy(true,false);if(game.isRunning)game.loop.wake();
  },
 };
}
