#!/bin/sh
# uso: vqa.sh <video> <tag> [recorte w:h:x:y] [cartao.png]   (de dentro da pasta da cena; as medidas vão para qa/)
# Adaptado do vqa.sh do hero para o loop do cartão (125 quadros): PSNR de cada par de quadros seguidos (no quadro
# inteiro e no recorte de onde há movimento), quantos pares são idênticos (o codificador repetiu o quadro), o pior
# passo e a emenda 124 -> 0 (limite: pelo menos 45 dB). Com o cartao.png, mede também o quadro 0 contra o cartão
# reduzido a 600 x 900 (lanczos): o quadro 0 tem de ser o cartão (a diferença é só a da compressão).
V=$1; T=$2; CROP=${3:-}; CART=${4:-}; Q=qa; mkdir -p $Q
N=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$V")
L=$((N - 1))
ffmpeg -v error -i "$V" -i "$V" -filter_complex "[0]trim=start_frame=1,setpts=PTS-STARTPTS[a];[1]trim=end_frame=$L,setpts=PTS-STARTPTS[b];[a][b]psnr=stats_file=$Q/$T-pares.txt" -f null -
if [ -n "$CROP" ]; then
  ffmpeg -v error -i "$V" -i "$V" -filter_complex "[0]trim=start_frame=1,setpts=PTS-STARTPTS,crop=$CROP[a];[1]trim=end_frame=$L,setpts=PTS-STARTPTS,crop=$CROP[b];[a][b]psnr=stats_file=$Q/$T-recorte.txt" -f null -
else cp $Q/$T-pares.txt $Q/$T-recorte.txt; fi
ffmpeg -v error -i "$V" -i "$V" -filter_complex "[0]select='eq(n\,$L)',setpts=PTS-STARTPTS[a];[1]select='eq(n\,0)',setpts=PTS-STARTPTS[b];[a][b]psnr=stats_file=$Q/$T-emenda.txt" -f null -
: > $Q/$T-q0.txt
if [ -n "$CART" ]; then
  ffmpeg -v error -i "$V" -i "$CART" -filter_complex "[0]select='eq(n\,0)',setpts=PTS-STARTPTS,format=rgb24[a];[1]scale=600:900:flags=lanczos,format=rgb24[b];[a][b]psnr=stats_file=$Q/$T-q0.txt" -f null -
fi
node -e "
const fs=require('fs');const rd=f=>{const s=fs.readFileSync(f,'utf8').trim();return s?s.split(/\r?\n/).map(l=>{const m=l.match(/mse_avg:([0-9.]+).*psnr_avg:([0-9.inf]+)/);return {mse:+m[1],p:m[2]==='inf'?Infinity:+m[2]};}):[];};
const P=rd('$Q/$T-pares.txt'),S=rd('$Q/$T-recorte.txt'),Z=rd('$Q/$T-emenda.txt')[0],F=rd('$Q/$T-q0.txt')[0];
const idP=P.filter(x=>x.p===Infinity).length,idS=S.filter(x=>x.p===Infinity).length;
const fin=P.filter(x=>isFinite(x.p)).map(x=>x.p).sort((a,b)=>a-b),finS=S.filter(x=>isFinite(x.p)).map(x=>x.p).sort((a,b)=>a-b);
const f=v=>v===undefined?'-':v===Infinity?'inf':v.toFixed(2)+' dB';
console.log('$T: $N quadros, '+P.length+' pares');
console.log('  pares idênticos: quadro inteiro '+idP+', recorte '+idS+' ('+(100*idS/S.length).toFixed(1)+'%)');
console.log('  passo (quadro inteiro): pior '+f(fin[0])+', mediana '+f(fin[fin.length>>1])+' | recorte: pior '+f(finS[0])+', mediana '+f(finS[finS.length>>1]));
console.log('  emenda $L->0: '+f(Z.p)+(Z.p>=45?' (ok, >= 45)':' (REPROVA, < 45)'));
if(F)console.log('  quadro 0 x cartão (600x900, lanczos): '+f(F.p));"
