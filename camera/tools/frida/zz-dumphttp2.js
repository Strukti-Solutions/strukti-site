/*
 * zz-dumphttp2.js — captura TODO o HTTP (req+resp) em texto claro hookando o
 * chokepoint universal do FunSDK, pra pegar o MINT do ClientToken (c_...) e a
 * lista de dispositivos (AuthCodes). Também o gerador do UserName TOKEN.
 *
 * Funções (de nm -D libFunSDK.so):
 *   Fun_EncHttpData(mode,data,len,key,out,&outlen)  _Z15Fun_EncHttpDataiPKciS0_PcRi  -> data=req claro
 *   Fun_DecHttpData(mode,data,len,key,out,&outlen)  _Z15Fun_DecHttpDataiPKciS0_PcRi  -> out=resp claro
 *   Fun_GenPWDToken(a,b,out)                         _Z15Fun_GenPWDTokenPKcS0_Pc      -> out=UserName TOKEN
 *   TalkToShadowServer(...)                          _Z18TalkToShadowServerRK8SZStringiiiS1_S1_RS_i
 *
 * Saída: /data/data/com.cz.czeye/files/http2.txt
 */
(function () {
  var PKG = "com.cz.czeye", OUT = "/data/data/" + PKG + "/files/http2.txt", LIB = "libFunSDK.so";
  var seen = {};
  function save(l){ console.log("[http2] "+l.substring(0,140)); try{var f=new File(OUT,"a");f.write(l+"\n");f.flush();f.close();}catch(e){} }
  function rd(p,len){ try{ if(len<=0||len>200000) len=4096; var b=p.readByteArray(len); if(!b) return null;
      var u=new Uint8Array(b),s=""; for(var i=0;i<u.length;i++) s+=String.fromCharCode(u[i]); return s; }catch(e){return null;} }
  function clean(s){ return s? s.replace(/[^\x20-\x7e]/g,".") : ""; }
  function once(tag,s){ if(!s) return; var k=tag+s.substring(0,80); if(seen[k])return; seen[k]=1; save(tag+" "+clean(s).substring(0,900)); }
  function H(sym){ var a=Module.findExportByName(LIB,sym); if(!a) a=Module.findExportByName(null,sym); return a; }

  var enc=H("_Z15Fun_EncHttpDataiPKciS0_PcRi");
  if(enc){ Interceptor.attach(enc,{ onEnter:function(a){ this.mode=a[0].toInt32(); this.d=a[1]; this.l=a[2].toInt32(); },
    onLeave:function(){ once("ENC(req,mode="+this.mode+")", rd(this.d,this.l)); } }); console.log("[http2] hook Fun_EncHttpData"); }

  var dec=H("_Z15Fun_DecHttpDataiPKciS0_PcRi");
  if(dec){ Interceptor.attach(dec,{ onEnter:function(a){ this.mode=a[0].toInt32(); this.out=a[4]; this.pout=a[5]; },
    onLeave:function(){ var n=0; try{n=this.pout.readS32();}catch(e){} once("DEC(resp,mode="+this.mode+")", rd(this.out,n>0?n:4096)); } }); console.log("[http2] hook Fun_DecHttpData"); }

  var pwt=H("_Z15Fun_GenPWDTokenPKcS0_Pc");
  if(pwt){ Interceptor.attach(pwt,{ onEnter:function(a){ this.p1=a[0]; this.p2=a[1]; this.out=a[2]; },
    onLeave:function(){ try{ save("GenPWDToken  p1="+clean(this.p1.readUtf8String())+"  p2="+clean(this.p2.readUtf8String())+"  -> "+clean(this.out.readUtf8String())); }catch(e){} } }); console.log("[http2] hook Fun_GenPWDToken"); }

  console.log("[http2] armado — faça LOGOUT e LOGIN no app");
})();
