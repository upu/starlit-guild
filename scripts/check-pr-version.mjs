import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const VERSION_PATTERN=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const CLASSIFICATION_PATTERN=/^\s*-\s*\[[xX]\]\s*`(game-change|no-game-change)`(?:\s|$)/;

export function classifyVersionChange(body){
 const choices=new Set(String(body??'').split(/\r?\n/).map(line=>line.match(CLASSIFICATION_PATTERN)?.[1]).filter(Boolean));
 if(choices.size!==1)throw Error('PR本文のバージョン判定で `game-change` または `no-game-change` のどちらか一方だけを選択してください。');
 return [...choices][0];
}

export function parseVersion(version,label='version'){
 const match=String(version??'').match(VERSION_PATTERN);
 if(!match)throw Error(`${label} は x.y.z 形式で指定してください: ${version}`);
 return {major:Number(match[1]),minor:Number(match[2]),patch:Number(match[3])};
}

export function validateVersionChange(baseVersion,headVersion,classification){
 const base=parseVersion(baseVersion,'main の version');
 parseVersion(headVersion,'PR の version');
 const expected=classification==='game-change'
  ?`${base.major}.${base.minor}.${base.patch+1}`
  :`${base.major}.${base.minor}.${base.patch}`;
 if(headVersion!==expected){
  const action=classification==='game-change'?'ゲーム本体の変更ではパッチ版を1つ上げます':'ゲーム本体に関係しない変更ではバージョンを据え置きます';
  throw Error(`${action}。期待値: ${expected}、現在値: ${headVersion}`);
 }
 return expected;
}

export function validatePackageLock(packageVersion,lock){
 const versions=[lock.version,lock.packages?.['']?.version];
 if(versions.some(version=>version!==packageVersion))throw Error(`package.json と package-lock.json のバージョンが一致していません: ${packageVersion} / ${versions.join(' / ')}`);
}

function readJson(path){return JSON.parse(readFileSync(path,'utf8'));}
function readBasePackage(baseRef){return JSON.parse(execFileSync('git',['show',`${baseRef}:package.json`],{encoding:'utf8'}));}

function main(){
 const baseIndex=process.argv.indexOf('--base-ref');
 const baseRef=baseIndex>=0?process.argv[baseIndex+1]:'';
 if(!baseRef)throw Error('比較元を --base-ref <commit> で指定してください。');
 const classification=classifyVersionChange(process.env.PR_BODY);
 const packageInfo=readJson(new URL('../package.json',import.meta.url));
 const lock=readJson(new URL('../package-lock.json',import.meta.url));
 const basePackage=readBasePackage(baseRef);
 validatePackageLock(packageInfo.version,lock);
 validateVersionChange(basePackage.version,packageInfo.version,classification);
 console.log(`PR version check passed: ${classification} (${basePackage.version} -> ${packageInfo.version})`);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{main();}catch(error){console.error(error instanceof Error?error.message:error);process.exitCode=1;}
}
