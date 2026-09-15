import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,existsSync,copyFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {optimizeStoryVideos} from '../scripts/optimize-story-videos.mjs';

function fixture(t) {
 const base=mkdtempSync(path.join(os.tmpdir(),'story-video-test-'));
 t.after(()=>rmSync(base,{recursive:true,force:true}));
 mkdirSync(path.join(base,'config'));
 mkdirSync(path.join(base,'assets/source/story-videos'),{recursive:true});
 const config=path.join(base,'config/story-video.json');
 copyFileSync(new URL('../config/story-video.json',import.meta.url),config);
 const source=path.join(base,'assets/source/story-videos/scene.mp4');
 const target=path.join(base,'public/stories/videos/scene.mp4');
 const manifest=path.join(base,'assets/story-videos.manifest.json');
 writeFileSync(source,'source video');
 let calls=0;
 const encode=(src,dst,p)=>{calls++;writeFileSync(dst,`${readFileSync(src)} crf=${p.crf}`);return {codec:'h264'};};
 const run=options=>optimizeStoryVideos({base,encode,log:()=>{},...options});
 return {base,source,target,manifest,config,run,calls:()=>calls};
}

test('unchanged source/profile/output is skipped, including check without FFmpeg',t=>{
 const f=fixture(t);
 assert.deepEqual(f.run(),{converted:1,skipped:0});
 const firstManifest=readFileSync(f.manifest,'utf8');
 assert.deepEqual(f.run(),{converted:0,skipped:1});
 assert.deepEqual(f.run({check:true,encode:()=>assert.fail('must not encode')}),{converted:0,skipped:1});
 assert.equal(f.calls(),1);
 assert.equal(readFileSync(f.manifest,'utf8'),firstManifest);
 assert.equal(readFileSync(f.source,'utf8'),'source video');
});

test('source, profile, missing output and modified output invalidate the cache',t=>{
 const f=fixture(t);f.run();
 writeFileSync(f.source,'new original');
 assert.throws(()=>f.run({check:true}),/未生成か古い/);f.run();
 const profile=JSON.parse(readFileSync(f.config));profile.crf=24;
 writeFileSync(f.config,JSON.stringify(profile));
 assert.throws(()=>f.run({check:true}),/未生成か古い/);f.run();
 rmSync(f.target);assert.throws(()=>f.run({check:true}),/未生成か古い/);f.run();
 writeFileSync(f.target,'damaged');assert.throws(()=>f.run({check:true}),/未生成か古い/);f.run();
 assert.equal(f.calls(),5);
 assert.equal(readFileSync(f.target,'utf8'),'new original crf=24');
});

test('failed conversion retains previous output/manifest and releases its lock',t=>{
 const f=fixture(t);f.run();
 const before=readFileSync(f.manifest,'utf8'),video=readFileSync(f.target,'utf8');
 writeFileSync(f.source,'new original');
 assert.throws(()=>f.run({encode:(_src,dst)=>{writeFileSync(dst,'partial');throw new Error('failed');}}),/failed/);
 assert.equal(readFileSync(f.target,'utf8'),video);
 assert.equal(readFileSync(f.manifest,'utf8'),before);
 assert.equal(existsSync(path.join(f.base,'assets/.story-videos.lock')),false);
 f.run();assert.equal(f.calls(),2);
});

test('name collisions, untracked outputs and removed sources are explicit errors',t=>{
 const f=fixture(t);
 const duplicate=f.source.replace('.mp4','.mov');writeFileSync(duplicate,'other');
 assert.throws(()=>f.run(),/重複/);rmSync(duplicate);
 writeFileSync(f.target,'user-owned output');assert.throws(()=>f.run(),/管理対象外/);
 assert.equal(readFileSync(f.target,'utf8'),'user-owned output');rmSync(f.target);f.run();
 rmSync(f.source);assert.throws(()=>f.run(),/元動画がありません/);
 assert.ok(existsSync(f.target));
});

test('check catches missing generation and concurrent runs do not steal the lock',t=>{
 const f=fixture(t);
 assert.throws(()=>f.run({check:true}),/未生成か古い/);
 assert.equal(f.calls(),0);
 const lock=path.join(f.base,'assets/.story-videos.lock');writeFileSync(lock,'another job');
 assert.throws(()=>f.run(),/実行中/);assert.equal(readFileSync(lock,'utf8'),'another job');
});

test('source changes during conversion never replace the accepted output',t=>{
 const f=fixture(t);f.run();
 const before=readFileSync(f.target,'utf8');writeFileSync(f.source,'changed');
 assert.throws(()=>f.run({encode:(src,dst)=>{writeFileSync(dst,'result');writeFileSync(src,'changed again');return {};}}),/処理中/);
 assert.equal(readFileSync(f.target,'utf8'),before);
});
