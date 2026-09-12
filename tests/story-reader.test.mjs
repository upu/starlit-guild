import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsxRuntime from 'react/jsx-runtime';
import * as game from '../lib/game.ts';
import * as stories from '../lib/stories.ts';
import * as prologue from '../lib/prologue.ts';
import * as art from '../lib/story-art.ts';
import * as originals from '../lib/original-characters.ts';

const code=ts.transpileModule(readFileSync(new URL('../app/story-scenes.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
function harness(name,initialProps){
 const slots=[],timers=new Map(),listeners=new Set(),exports={};let cursor=0,effects=[],tree,props=initialProps,serial=0;
 const document={hidden:false,addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)};
 const react={
  useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},
  useRef(initial){const i=cursor++;return slots[i]??=( {current:initial} );},
  useEffect(fn,deps){const i=cursor++,old=slots[i];if(!old||deps.some((v,j)=>!Object.is(v,old.deps[j]))){effects.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:fn()};});}},
 };
 const modules={react,'react/jsx-runtime':jsxRuntime,'lucide-react':{BookOpen:'icon',ChevronRight:'arrow',Images:'icon'},'./portrait':{Portrait:'portrait'},'@/lib/game':game,'@/lib/stories':stories,'@/lib/prologue':prologue,'@/lib/story-art':art,'@/lib/original-characters':originals,'@/components/ui/dialog':Object.fromEntries(['Dialog','DialogContent','DialogHeader','DialogTitle','DialogDescription'].map(key=>[key,key]))};
 vm.runInNewContext(code,{exports,require:id=>{if(!(id in modules))throw Error(id);return modules[id];},document,setTimeout:fn=>{const id=++serial;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)});
 function render(next=props){props=next;cursor=0;effects=[];tree=exports[name](props);for(const effect of effects)effect();return tree;}
 function nodes(node){if(!node||typeof node!=='object')return [];return [node,...[node.props?.children].flat(Infinity).flatMap(child=>nodes(child))];}
 const find=type=>nodes(tree).find(n=>n.type===type||n.type?.name===type);
 const text=node=>typeof node==='string'?node:!node||typeof node!=='object'?'':[node.props?.children].flat(Infinity).map(text).join('');
 function click(label){const button=nodes(tree).find(n=>n.type==='button'&&text(n)===label);assert.ok(button,label);assert.ok(!button.props.disabled);button.props.onClick();render();}
 render();
 return {render,find,click,text:()=>text(tree),exports,tick(){const [id,fn]=timers.entries().next().value||[];assert.ok(fn,'scheduled dialogue');timers.delete(id);fn();render();},timerCount:()=>timers.size,visibility(hidden){document.hidden=hidden;for(const fn of listeners)fn();}};
}

test('story reader retains all revealed lines for scrolling, reveals art at its action, and only finishes on the final line',()=>{
 const story=stories.stories.find(st=>st.id==='pilgrim-return');let read=0,closed=0;
 const h=harness('StoryReader',{story,ready:true,onRead:()=>{read++;return true;},onClose:()=>closed++});
 for(let i=0;i<story.lines.length;i++){
  assert.deepEqual(h.find('StoryLines').props.lines,story.lines.slice(0,i+1));
  assert.equal(h.find('ArtViewer').props.art,null);
  const hasFigure=!!h.find('figure');assert.equal(hasFigure,!!art.storyArtAt(story.id,i));
  assert.equal(read,0);assert.equal(closed,0);
  if(i+1<story.lines.length)h.click('次へ');
 }
 h.click('前へ');assert.deepEqual(h.find('StoryLines').props.lines,story.lines.slice(0,-1));assert.equal(read,0);h.click('次へ');h.click('閉じる');assert.equal(read,1);assert.equal(closed,1);
});

test('banter keeps a complete exchange while the route changes and pauses under dialogs or hidden tabs',()=>{
 const lines=[{speaker:'aria',text:'最初の発言'},{speaker:'leon',text:'その返事'}],next=[{speaker:'leon',text:'次の場所'}];let opened;
 const props={lines,onRead:lines=>{opened=lines;}};
 const h=harness('Banter',props);assert.ok(h.text().includes(lines[0].text));assert.ok(!h.text().includes(lines[1].text));
 h.render({...props,lines:next});h.tick();assert.ok(h.text().includes(lines[0].text));assert.ok(h.text().includes(lines[1].text));assert.ok(!h.text().includes(next[0].text));
 h.find('button').props.onClick();assert.deepEqual(opened,lines);
 h.render({...props,lines:next,paused:true});assert.equal(h.timerCount(),0);
 h.render({...props,lines:next,paused:false});h.visibility(true);assert.equal(h.timerCount(),0);
 h.visibility(false);h.tick();assert.ok(h.text().includes(next[0].text));assert.ok(h.text().includes(lines[0].text));assert.ok(h.text().includes(lines[1].text));
 const later=[{speaker:'aria',text:'さらに次の発言'}];h.render({...props,lines:later});h.tick();
 assert.ok(h.text().includes(lines[0].text));assert.ok(h.text().includes(lines[1].text));assert.ok(h.text().includes(next[0].text));assert.ok(h.text().includes(later[0].text));
 const viewport={scrollHeight:900,clientHeight:220,scrollTop:100};h.find('button').props.ref.current=viewport;
 h.find('button').props.onScroll({currentTarget:viewport});h.tick();assert.equal(viewport.scrollTop,100,'reading history is not interrupted');
 viewport.scrollTop=680;h.find('button').props.onScroll({currentTarget:viewport});viewport.scrollHeight=1000;h.tick();assert.equal(viewport.scrollTop,1000,'following resumes from the bottom');
});

test('memories interleave departure and ending by stage; album stays separate and returns to the handbook',()=>{
 let state=game.initialPrologueState(1000);
 for(const stage of prologue.prologueStages){state=game.act(state,{type:'start',id:stage.quest,readDeparture:true},state.updatedAt);state=game.settle(state,state.updatedAt+3600000).state;state=game.act(state,{type:'readStory',id:stage.quest+'-return'},state.updatedAt);}
 const h=harness('StoryLibrary',{state,onOpen:()=>{}});
 const ordered=h.exports.memoryGroups(stories.availableStories(state)).flatMap(group=>group.items.map(st=>st.id));
 assert.deepEqual(Array.from(ordered),prologue.prologueStages.flatMap(stage=>[stage.quest+'-departure',stage.quest+'-return']));
 assert.equal(h.find('img'),undefined);assert.equal(h.find('StoryAlbum'),undefined);
 assert.ok(!h.text().includes('アルバム'));
 let returned=false;const album=harness('StoryAlbum',{state,onBack:()=>{returned=true;}});
 assert.ok(album.find('img'));album.click('旅の手帳へ戻る');assert.ok(returned);
});
