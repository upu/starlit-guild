'use client';
import {useLocalGame} from './use-local-game';
import {PhoneGame} from './phone-game';
export default function Game(){const game=useLocalGame();return <PhoneGame key={game.profile?.id||'loading'} game={game}/>;}
