'use client';
import {useEffect} from 'react';

// Installed iOS apps can report dvh without the bottom safe area. Use the
// window's layout height there, keeping the safe area inside the game frame.
export function useGameViewport(){
 useEffect(()=>{
  const root=document.documentElement,viewport=window.visualViewport;
  const standalone=window.matchMedia('(display-mode: standalone)');
  let frame=0;
  const update=()=>{
   if(viewport&&Math.abs(viewport.scale-1)>.01)return; // Preserve pinch zoom.
   const installed=standalone.matches||!!(navigator as Navigator&{standalone?:boolean}).standalone;
   const editable=document.activeElement?.matches('input,textarea,[contenteditable="true"]');
   const keyboard=!!editable&&!!viewport&&viewport.height<window.innerHeight-100;
   const height=installed&&!keyboard?window.innerHeight:viewport?.height||window.innerHeight;
   root.style.setProperty('--game-height',`${Math.round(height)}px`);
   root.style.setProperty('--game-top',`${keyboard?viewport?.offsetTop||0:0}px`);
   root.classList.toggle('game-keyboard-open',keyboard);
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);};
  update();schedule();
  window.addEventListener('resize',schedule);window.addEventListener('pageshow',schedule);
  document.addEventListener('visibilitychange',schedule);document.addEventListener('focusin',schedule);document.addEventListener('focusout',schedule);
  viewport?.addEventListener('resize',schedule);viewport?.addEventListener('scroll',schedule);standalone.addEventListener('change',schedule);
  return ()=>{
   cancelAnimationFrame(frame);window.removeEventListener('resize',schedule);window.removeEventListener('pageshow',schedule);
   document.removeEventListener('visibilitychange',schedule);document.removeEventListener('focusin',schedule);document.removeEventListener('focusout',schedule);
   viewport?.removeEventListener('resize',schedule);viewport?.removeEventListener('scroll',schedule);standalone.removeEventListener('change',schedule);
   root.style.removeProperty('--game-height');root.style.removeProperty('--game-top');root.classList.remove('game-keyboard-open');
  };
 },[]);
}
