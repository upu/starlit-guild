import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setSound,unlockSound,sound,soundEvents} from '../lib/sound.ts';

test('audio requires interaction, prioritizes one burst, bounds rapid taps and mutes immediately',()=>{
 let created=0,started=0;const contexts=[];
 const param=()=>({value:0,setValueAtTime(value){this.value=value;},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}});
 const node=()=>({gain:param(),frequency:param(),Q:{value:0},connect(){},disconnect(){},start(){started++;},stop(){}});
 class AudioContext{
  currentTime=0;sampleRate=44100;state='running';destination={};gains=[];
  constructor(){created++;contexts.push(this);}
  createGain(){const gain=node();this.gains.push(gain);return gain;}
  createBuffer(){return {getChannelData:()=>new Float32Array(17640)};}
  createBufferSource(){return node();}createBiquadFilter(){return node();}createOscillator(){return node();}resume(){return Promise.resolve();}
 }
 globalThis.AudioContext=AudioContext;
 try{
  sound('hit');assert.equal(created,0);
  setSound(false);unlockSound();assert.equal(created,0);
  setSound(true);unlockSound();assert.equal(created,1);
  const context=contexts[0];
  soundEvents([{kind:'hit',hero:'leon'},{kind:'burst',hero:'aria'},{kind:'burst',hero:'leon'}]);
  assert.equal(started,14,'one six-note layered fanfare and its impact');
  for(let i=0;i<100;i++)sound('assist',true);
  assert.equal(started,14,'ordinary taps cannot drown out a finisher');
  context.currentTime=1;sound('hit',false,'aria');const bow=started;
  sound('hit',false,'aria');assert.equal(started,bow);
  setSound(false);assert.equal(context.gains[0].gain.value,0);
  context.currentTime=2;sound('burst');assert.equal(started,bow);
 }finally{delete globalThis.AudioContext;setSound(false);}
});
