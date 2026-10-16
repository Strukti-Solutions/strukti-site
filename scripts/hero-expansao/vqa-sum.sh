#!/bin/sh
# re-summarise existing qa stats: vqa-sum.sh <tag>
T=$1; Q=qa
node -e "
const fs=require('fs');const rd=f=>fs.readFileSync(f,'utf8').trim().split(/\r?\n/).map(l=>{const m=l.match(/mse_avg:([0-9.]+).*psnr_avg:([0-9.inf]+)/);return {mse:+m[1],p:m[2]==='inf'?Infinity:+m[2]};});
const P=rd('$Q/$T-pairs.txt'),S=rd('$Q/$T-steam.txt'),Z=rd('$Q/$T-seam.txt')[0];
const idP=P.filter(x=>x.p===Infinity).length, idS=S.filter(x=>x.p===Infinity).length; const fin=P.filter(x=>isFinite(x.p)).map(x=>x.p);
const worst=Math.min(...fin); const maxS=Math.max(...S.map(x=>x.mse));
console.log('$T pairs',P.length,'identical whole',idP,'steam identical',idS,'('+(100*idS/S.length).toFixed(1)+'%)','steam maxMSE',maxS.toFixed(3),'in-clip worst step',worst.toFixed(2)+'dB','seam 249->0',Z.p===Infinity?'inf':Z.p.toFixed(2)+'dB');"
