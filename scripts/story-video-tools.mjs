import {spawnSync} from 'node:child_process';
import {existsSync, readdirSync} from 'node:fs';
import path from 'node:path';

// Explicit overrides, then PATH, then the normal Windows winget installation.
export function findTool(name) {
 const override=process.env[`${name.toUpperCase()}_PATH`];
 if(override)return override;
 if(!spawnSync(name,['-version'],{windowsHide:true}).error)return name;
 const packages=path.join(process.env.LOCALAPPDATA||'', 'Microsoft/WinGet/Packages');
 if(process.platform==='win32'&&existsSync(packages)) {
  for(const pkg of readdirSync(packages).filter(n=>n.startsWith('Gyan.FFmpeg_')).sort().reverse()) {
   const base=path.join(packages,pkg);
   for(const dir of readdirSync(base).sort().reverse()) {
    const exe=path.join(base,dir,'bin',`${name}.exe`);
    if(existsSync(exe))return exe;
   }
  }
 }
 throw new Error(`${name} が見つかりません。FFmpeg をインストールするか ${name.toUpperCase()}_PATH を指定してください。`);
}

export function runTool(command,args) {
 const result=spawnSync(command,args,{encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});
 if(result.error)throw result.error;
 if(result.status!==0)throw new Error(`${path.basename(command)} failed: ${result.stderr}`);
 return result.stdout;
}

function rate(value) {
 const [n,d=1]=String(value).split('/').map(Number);
 return n/d;
}

export function probeVideo(file,ffprobe) {
 const result=JSON.parse(runTool(ffprobe,['-v','error','-show_streams','-show_format','-of','json',file]));
 const video=result.streams.find(s=>s.codec_type==='video'&&!s.disposition?.attached_pic);
 if(!video)throw new Error(`${file}: 映像がありません。`);
 const fps=rate(video.avg_frame_rate)||rate(video.r_frame_rate);
 const duration=Number(video.duration||result.format.duration);
 if(!Number.isFinite(fps)||fps<=0||!Number.isFinite(duration)||duration<=0)throw new Error(`${file}: 時間・fpsを取得できません。`);
 if(!video.width||!video.height)throw new Error(`${file}: 解像度を取得できません。`);
 return {width:video.width,height:video.height,fps,duration,codec:video.codec_name,pixelFormat:video.pix_fmt,
  audio:result.streams.some(s=>s.codec_type==='audio'),streamCount:result.streams.length,
  sar:video.sample_aspect_ratio,transfer:video.color_transfer};
}

export function encodeVideo(source,target,profile,ffmpeg,ffprobe) {
 const input=probeVideo(source,ffprobe);
 if(input.sar&&!['1:1','N/A'].includes(input.sar))throw new Error('正方形ピクセルの元動画を使用してください。');
 if(['smpte2084','arib-std-b67'].includes(input.transfer))throw new Error('HDR動画はSDRへ変換してから追加してください。');
 const filter=`scale=w='min(iw,${profile.maxWidth})':h='min(ih,${profile.maxHeight})':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1,fps=${Math.min(input.fps,profile.maxFps)}`;
 runTool(ffmpeg,['-hide_banner','-loglevel','error','-nostdin','-n','-i',source,'-map','0:V:0',
  '-vf',filter,'-c:v','libx264','-crf',String(profile.crf),'-preset',profile.preset,'-pix_fmt','yuv420p',
  '-an','-sn','-dn','-map_metadata','-1','-map_chapters','-1','-movflags','+faststart',target]);
 const output=probeVideo(target,ffprobe);
 if(output.codec!=='h264'||output.pixelFormat!=='yuv420p'||output.audio||output.streamCount!==1||
  output.width>profile.maxWidth||output.height>profile.maxHeight||output.fps>profile.maxFps+0.01||
  Math.abs(output.duration-input.duration)>Math.max(0.15,2/output.fps))throw new Error('配信用動画の検証に失敗しました。');
 return output;
}
