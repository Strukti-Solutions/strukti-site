#!/bin/sh
# vqa.sh <video> <tag> : consecutive-pair PSNR (whole + steam crop), identical pairs, seam 249->0
V=$1; T=$2; Q=qa; mkdir -p $Q
CROP="crop=96:128:951:330"
ffmpeg -v error -i "$V" -i "$V" -filter_complex "[0]trim=start_frame=1,setpts=PTS-STARTPTS[a];[1]trim=end_frame=249,setpts=PTS-STARTPTS[b];[a][b]psnr=stats_file=$Q/$T-pairs.txt" -f null - 
ffmpeg -v error -i "$V" -i "$V" -filter_complex "[0]trim=start_frame=1,setpts=PTS-STARTPTS,$CROP[a];[1]trim=end_frame=249,setpts=PTS-STARTPTS,$CROP[b];[a][b]psnr=stats_file=$Q/$T-steam.txt" -f null -
ffmpeg -v error -i "$V" -i "$V" -filter_complex "[0]select='eq(n\,249)',setpts=PTS-STARTPTS[a];[1]select='eq(n\,0)',setpts=PTS-STARTPTS[b];[a][b]psnr=stats_file=$Q/$T-seam.txt" -f null -
node -e "
const fs=require('fs');const rd=f=>fs.readFileSync(f,'utf8').trim().split(/\r?\n/).map(l=>{const m=l.match(/mse_avg:([0-9.]+).*psnr_avg:([0-9.inf]+)/);return {mse:+m[1],p:m[2]==='inf'?Infinity:+m[2]};});
const P=rd('$Q/$T-pairs.txt'),S=rd('$Q/$T-steam.txt'),Z=rd('$Q/$T-seam.txt')[0];
const idP=P.filter(x=>x.p===Infinity).length, idS=S.filter(x=>x.p===Infinity).length; const fin=P.filter(x=>isFinite(x.p)).map(x=>x.p);
const worst=Math.min(...fin); const maxS=Math.max(...S.map(x=>x.mse));
console.log('$T pairs',P.length,'identical whole',idP,'steam identical',idS,'('+(100*idS/S.length).toFixed(1)+'%)','steam maxMSE',maxS.toFixed(3),'in-clip worst step',worst.toFixed(2)+'dB','seam 249->0',Z.p===Infinity?'inf':Z.p.toFixed(2)+'dB');"
