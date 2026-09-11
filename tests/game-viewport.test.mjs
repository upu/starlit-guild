import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gameViewportHeight} from '../app/use-game-viewport.ts';

const navigationCss=readFileSync(new URL('../app/navigation.css',import.meta.url),'utf8');

test('normal view keeps the bottom safe area inside the game frame',()=>{
 assert.equal(gameViewportHeight(844,810,false),844);
});

test('software keyboard uses the reduced visual viewport',()=>{
 assert.equal(gameViewportHeight(844,510,true),510);
});

test('keyboard fallback uses the window height without Visual Viewport API',()=>{
 assert.equal(gameViewportHeight(844,undefined,true),844);
});

test('bottom safe area is painted inside the navigation background',()=>{
 assert.match(navigationCss,/--game-nav-height:calc\(56px \+ var\(--game-safe-bottom\)\)/);
 assert.match(navigationCss,/\.phone-game \.phone-navigation\{height:var\(--game-nav-height\)!important;[^}]*padding:[^}]*calc\(2px \+ var\(--game-safe-bottom\)\)/);
});
