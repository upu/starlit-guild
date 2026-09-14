import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const readJson=path=>JSON.parse(readFileSync(path,'utf8').replace(/^\uFEFF/,''));
export const targets=readJson(new URL('../config/site-targets.json',import.meta.url));

export function checkTargets(config,canonical){
 for(const target of ['preview','production']){
  assert.ok(config[target]?.projectId,`${target}: projectId is required`);
  const url=new URL(config[target].url);
  assert.equal(url.protocol,'https:');
  assert.equal(url.origin,config[target].url,'Use an exact origin without a path');
 }
 assert.notEqual(config.preview.projectId,config.production.projectId,'Sites must be separate projects');
 assert.notEqual(new URL(config.preview.url).hostname,new URL(config.production.url).hostname,'Sites must use separate hosts');
 assert.equal(canonical.project_id,config.production.projectId,'The canonical manifest must remain production');
}

export function checkManifest(manifest,canonical,projectId){
 assert.deepEqual(manifest,{...canonical,project_id:projectId},'Only the selected project_id may differ from the source manifest');
}

function passed(check,label){
 assert.equal(check?.status,'passed',`${label}: verification is incomplete`);
 assert.ok(check.deploymentId,`${label}: deploymentId is required`);
 assert.ok(Number.isInteger(check.environmentRevision)&&check.environmentRevision>=0,`${label}: environment revision is required`);
}

export function checkObservation(target,sourceCommit,observation,config=targets){
 assert.ok(['preview','production'].includes(target),'Choose preview or production explicitly');
 assert.match(sourceCommit,/^[a-f0-9]{40}$/,'Use a full source commit SHA');
 const selected=config[target],{site,environment}=observation;
 assert.equal(site?.projectId,selected.projectId,'Observed site does not match target');
 assert.equal(site.url,selected.url,'Observed URL does not match target');
 assert.equal(environment?.projectId,selected.projectId,'Environment belongs to a different site');
 assert.ok(Number.isInteger(environment.revision)&&environment.revision>=0,'Environment revision is required');
 const mode=observation.mode;
 assert.ok(['test','normal'].includes(mode),'Choose test or normal mode explicitly');
 if(target==='production')assert.equal(mode,'normal','Production cannot enable test tools');
 assert.equal(environment.testTools,mode==='test'?'true':null,'Use true for test mode, or an unset/false setting normalized to null for normal mode');
 if(target==='preview'){
  assert.ok(['custom','admins_only'].includes(site.accessMode),'Preview must have restricted access');
  return;
 }
 const evidence=observation.previewVerification;
 assert.equal(evidence?.sourceCommit,sourceCommit,'Preview verified a different source commit');
 assert.equal(evidence.projectId,config.preview.projectId,'Evidence belongs to a different preview site');
 assert.ok(Number.isFinite(Date.parse(evidence.checkedAt)),'Verification time is required');
 for(const mode of ['testMode','normalMode'])passed(evidence[mode],mode);
 assert.equal(evidence.testMode.testTools,true,'Test-mode evidence is required');
 assert.equal(evidence.normalMode.testTools,false,'Normal-mode evidence is required');
 for(const key of ['chapterOne','saveRestore','changedAreas']){
  assert.equal(evidence[key],'passed',`${key}: verification is incomplete`);
 }
 assert.ok(['passed','not-run','failed'].includes(evidence.realDevice),'Record real device verification separately');
 assert.notEqual(evidence.realDevice,'failed','Resolve real device failures before production');
 if(evidence.realDevice==='not-run'){
  assert.ok(evidence.realDeviceOmissionReason?.trim(),'Record the reason for any omitted real-device check');
 }
}

export function checkSource(sourceCommit,cwd=process.cwd()){
 assert.match(sourceCommit,/^[a-f0-9]{40}$/,'Use a full source commit SHA');
 const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim();
 assert.equal(git('rev-parse',`${sourceCommit}^{commit}`),sourceCommit);
 assert.equal(git('status','--porcelain','--untracked-files=normal'),'','Delivery checkout must be clean');
 const changed=git('diff','--name-only',sourceCommit,'HEAD').split('\n').filter(Boolean);
 assert.ok(changed.every(path=>path==='.openai/hosting.json'),'Delivery source differs beyond the target manifest');
 return JSON.parse(git('show',`${sourceCommit}:.openai/hosting.json`));
}

function main(){
 const [target,sourceCommit,observationPath]=process.argv.slice(2);
 const canonical=readJson(resolve(root,'.openai/hosting.json'));
 // This command is run from the canonical source checkout for config validation.
 if(target==='--config'){
  checkTargets(targets,canonical);
  console.log(JSON.stringify(targets,null,2));return;
 }
 assert.ok(observationPath,'Usage: check-site-release.mjs preview|production SOURCE_SHA OBSERVATION.json');
 const sourceManifest=checkSource(sourceCommit);
 checkTargets(targets,sourceManifest);
 checkObservation(target,sourceCommit,readJson(resolve(observationPath)));
 checkManifest(readJson(resolve('.openai/hosting.json')),sourceManifest,targets[target].projectId);
 console.log(`PASS: ${target} ${targets[target].url} source=${sourceCommit}`);
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{main();}catch(error){console.error(error.message);process.exitCode=1;}
}
