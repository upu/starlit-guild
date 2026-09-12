import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyVersionChange,parseVersion,validatePackageLock,validateVersionChange} from '../scripts/check-pr-version.mjs';

test('PR body must select exactly one version classification',()=>{
 assert.equal(classifyVersionChange('- [x] `game-change` — ゲーム本体が変わる\n- [ ] `no-game-change` — 据え置き'),'game-change');
 assert.equal(classifyVersionChange('- [ ] `game-change` — ゲーム本体が変わる\n- [X] `no-game-change` — 据え置き'),'no-game-change');
 assert.throws(()=>classifyVersionChange('- [ ] `game-change`\n- [ ] `no-game-change`'),/どちらか一方/);
 assert.throws(()=>classifyVersionChange('- [x] `game-change`\n- [x] `no-game-change`'),/どちらか一方/);
});

test('game changes increment only the patch version once',()=>{
 assert.equal(validateVersionChange('1.4.9','1.4.10','game-change'),'1.4.10');
 assert.throws(()=>validateVersionChange('1.4.9','1.4.9','game-change'),/期待値: 1\.4\.10/);
 assert.throws(()=>validateVersionChange('1.4.9','1.5.0','game-change'),/期待値: 1\.4\.10/);
});

test('non-game changes keep the version unchanged',()=>{
 assert.equal(validateVersionChange('0.1.2','0.1.2','no-game-change'),'0.1.2');
 assert.throws(()=>validateVersionChange('0.1.2','0.1.3','no-game-change'),/期待値: 0\.1\.2/);
});

test('versions and lockfile copies stay valid and synchronized',()=>{
 assert.deepEqual(parseVersion('12.3.45'),{major:12,minor:3,patch:45});
 assert.throws(()=>parseVersion('1.2'),/x\.y\.z/);
 assert.doesNotThrow(()=>validatePackageLock('0.1.2',{version:'0.1.2',packages:{'':{version:'0.1.2'}}}));
 assert.throws(()=>validatePackageLock('0.1.2',{version:'0.1.3',packages:{'':{version:'0.1.2'}}}),/一致していません/);
});
