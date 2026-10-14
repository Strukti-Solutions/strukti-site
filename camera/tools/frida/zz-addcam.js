/*
 * zz-addcam.js — ASSISTENTE: captura tudo que uma câmera nova precisa p/ o
 * config.py (SN + AuthCode + usuário/senha local), ao abrir a câmera no app.
 *
 *   - hook de ENVIO (send/write/sendto): pega o handshake "<base64>XXEE" do :6611
 *     -> decodifica -> AuthCode (campo[0]) + SN (campo[2]), por fd.
 *   - hook de LEITURA (read/recv): detecta o login (1001) -> injeta GetRandomUser
 *     -> pega o Info -> decifra com Fun_DecDevRandomUserInfo(SN) -> user/senha.
 *
 * Emite por câmera uma linha pronta:  CAM sn=.. ac=.. user=.. pass=..
 * Saída: /data/data/com.cz.czeye/files/addcam.txt
 */
(function () {
  var LIB = "libFunSDK.so", OUT = "/data/data/com.cz.czeye/files/addcam.txt";
  function save(l){ console.log("[addcam] "+l.substring(0,180)); try{var f=new File(OUT,"a");f.write(l+"\n");f.flush();f.close();}catch(e){} }
  save("LOADING addcam");

  var fdSN = {}, fdAC = {}, injected = {}, emitted = {};
  var sendFn = null, decFn = null;
  try {
    sendFn = new NativeFunction(Module.findExportByName("libc.so","send")||Module.findExportByName(null,"send"), "int", ["int","pointer","size_t","int"]);
    decFn = new NativeFunction(Module.findExportByName(LIB,"_Z24Fun_DecDevRandomUserInfoPKcS0_Pc"), "int", ["pointer","pointer","pointer"]);
    save("send+dec OK");
  } catch(e){ save("ERRO init: "+e); }

  function b64dec(s){
    var T="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    s=s.replace(/[^A-Za-z0-9+/]/g,""); var out="",i=0;
    while(i+1<s.length){
      var a=T.indexOf(s[i++]),b=T.indexOf(s[i++]),c=i<s.length?T.indexOf(s[i++]):64,d=i<s.length?T.indexOf(s[i++]):64;
      out+=String.fromCharCode((a<<2)|(b>>4));
      if(c!==64) out+=String.fromCharCode(((b&15)<<4)|(c>>2));
      if(d!==64) out+=String.fromCharCode(((c&3)<<6)|d);
    }
    return out;
  }
  function scan(buf,n){ try{var m=n>4096?4096:n; var b=buf.readByteArray(m); if(!b)return null; var u=new Uint8Array(b),s=""; for(var i=0;i<u.length;i++)s+=String.fromCharCode(u[i]); return s;}catch(e){return null;} }

  function frame(json,sid,msgid,seq){
    var body=[]; for(var i=0;i<json.length;i++) body.push(json.charCodeAt(i)&0xff); body.push(0);
    var n=body.length;
    var h=[0xFF,1,0,0, sid&0xff,(sid>>8)&0xff,(sid>>16)&0xff,(sid>>24)&0xff, seq&0xff,(seq>>8)&0xff,(seq>>16)&0xff,(seq>>24)&0xff,0,0, msgid&0xff,(msgid>>8)&0xff, n&0xff,(n>>8)&0xff,(n>>16)&0xff,(n>>24)&0xff];
    var all=h.concat(body); var buf=Memory.alloc(all.length); buf.writeByteArray(all); return {ptr:buf,len:all.length};
  }
  function decrypt(sn,info){
    try{ var out=Memory.alloc(512); out.writeByteArray(new Array(512).fill(0));
      var r=decFn(Memory.allocUtf8String(sn), Memory.allocUtf8String(info), out);
      var s=null; try{s=out.readUtf8String();}catch(e){}
      if(r===0 && s){ var mu=s.match(/p1:(\S+)\s+p2:(\S+)/); if(mu) return {user:mu[1],pass:mu[2]}; }
    }catch(e){}
    return null;
  }

  // ENVIO: captura handshake <base64>XXEE
  ["send","sendto","write"].forEach(function(nm){
    var p=Module.findExportByName("libc.so",nm)||Module.findExportByName(null,nm); if(!p) return;
    try{ Interceptor.attach(p,{ onEnter:function(a){
      var fd=a[0].toInt32(), len=a[2]?a[2].toInt32():0;
      if(len<60||len>512) return;                         // handshake ~136B
      var s=scan(a[1],len); if(!s || s.indexOf("XXEE")<0 || s.indexOf("aaaaaaaa")<0) return;
      try{
        var tok=s.substring(0, s.indexOf("XXEE"));
        var dec=b64dec(tok); var f=dec.split(":");
        if(f.length>=3 && /^aaaaaaaa/.test(f[0]) && f[2].length>=16){
          fdAC[fd]=f[0]; fdSN[fd]=f[2];
          save("handshake fd="+fd+" sn="+f[2]+" ac="+f[0]);
        }
      }catch(e){}
    }}); }catch(e){}
  });

  // LEITURA: login -> inject GetRandomUser; Info -> decifra -> emite record
  function onRead(fd,buf,n){
    if(n<20||n>262144) return;
    var s=scan(buf,n); if(!s) return;
    if(s.indexOf("AliveInterval")>=0 && s.indexOf("SessionID")>=0 && !injected[fd]){
      var m=s.match(/"SessionID"\s*:\s*"?(0x[0-9a-fA-F]+)"?/);
      if(m && sendFn){ injected[fd]=1;
        var f=frame('{"Name":"GetRandomUser","SessionID":"'+m[1]+'"}', parseInt(m[1],16), 1660, 600);
        sendFn(fd, f.ptr, f.len, 0);
      }
    }
    var mi=s.match(/"Info"\s*:\s*"([A-Za-z0-9+/=]+)"/);
    if(mi){
      var sn=fdSN[fd];
      if(sn && !emitted[sn]){
        var cr=decrypt(sn, mi[1]);
        if(cr){ emitted[sn]=1;
          save("CAM sn="+sn+" ac="+(fdAC[fd]||"?")+" user="+cr.user+" pass="+cr.pass);
        }
      }
    }
  }
  ["read","recv","recvfrom"].forEach(function(nm){
    var p=Module.findExportByName("libc.so",nm)||Module.findExportByName(null,nm); if(!p) return;
    try{ Interceptor.attach(p,{onEnter:function(a){this.fd=a[0].toInt32();this.buf=a[1];},onLeave:function(r){onRead(this.fd,this.buf,r.toInt32());}}); }catch(e){}
  });
  save("ARMED addcam — abra a câmera NOVA no app");
})();
