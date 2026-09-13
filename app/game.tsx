'use client';
import {useState} from 'react';
import {useLocalGame} from './use-local-game';
import {PhoneGame} from './phone-game';
import {StartScreen} from './start-screen';
import {useGameViewport} from './use-game-viewport';
export default function Game({testToolsEnabled=false}:{testToolsEnabled?:boolean}){
 const game=useLocalGame(testToolsEnabled),[entered,setEntered]=useState(false);
 useGameViewport();
 return entered?<PhoneGame key={game.profile?.id||'loading'} game={game}/>:<StartScreen ready={game.ready} error={game.error} onStart={()=> { setEntered(true); }}/>;
}
