import test from 'node:test';
import assert from 'node:assert/strict';
import {gameViewportHeight} from '../app/use-game-viewport.ts';

test('normal view keeps the bottom safe area inside the game frame',()=>{
 assert.equal(gameViewportHeight(844,810,false),844);
});

test('software keyboard uses the reduced visual viewport',()=>{
 assert.equal(gameViewportHeight(844,510,true),510);
});

test('keyboard fallback uses the window height without Visual Viewport API',()=>{
 assert.equal(gameViewportHeight(844,undefined,true),844);
});
