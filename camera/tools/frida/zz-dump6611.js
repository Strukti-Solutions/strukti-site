/*
 * zz-dump6611.js — captura a sessão :6611 EXATA (handshake token + login DVRIP)
 * da sessão ATUAL do app, hookando várias funcoes de I/O (o send() puro nao
 * disparou: FunSDK usa socket custom). Dumpa qualquer buffer contendo XXEE,
 * EncryptType, OPMonitor (saida) e Ret/SessionID (entrada).
 *
 * Saida: /data/data/com.cz.czeye/files/dump6611.txt
 * Ler:   adb shell run-as com.cz.czeye cat files/dump6611.txt
 */
(function () {
  var PKG = "com.cz.czeye";
  var OUT = "/data/data/" + PKG + "/files/dump6611.txt";
  var seen = {};
  function save(line) {
    console.log("[dump6611] " + line.substring(0, 160));
    try { var f = new File(OUT, "a"); f.write(line + "\n"); f.flush(); f.close(); } catch (e) {}
  }
  function bufToStr(p, len) {
    try {
      var b = p.readByteArray(len); if (!b) return null;
      var u = new Uint8Array(b), s = "";
      for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
      return s;
    } catch (e) { return null; }
  }
  function interesting(s, dir) {
    if (!s) return;
    var hit = (s.indexOf("XXEE") >= 0) || (s.indexOf("EncryptType") >= 0) ||
              (s.indexOf("OPMonitor") >= 0) || (s.indexOf("DVRIP") >= 0) ||
              (s.indexOf("LoginEncryptionType") >= 0) ||
              (dir === "IN" && s.indexOf("\"Ret\"") >= 0);
    if (!hit) return;
    var key = dir + s.substring(0, 64);
    if (seen[key]) return; seen[key] = 1;
    // printa de forma legivel (recorta ate ~600 bytes)
    var clean = s.replace(/[^\x20-\x7e]/g, ".").substring(0, 600);
    save("[" + dir + "] " + clean);
  }
  // funcoes de ENVIO: arg1=buf, arg2=len   (send/sendto/write tem buf no arg1)
  ["send", "sendto", "write", "__write_chk", "writev"].forEach(function (name) {
    var p = Module.findExportByName(null, name);
    if (!p) return;
    try {
      Interceptor.attach(p, {
        onEnter: function (a) {
          var len = a[2] ? a[2].toInt32() : 0;
          if (name === "writev") return; // iovec, ignora
          if (len > 0 && len < 65536) interesting(bufToStr(a[1], len), "OUT");
        }
      });
      console.log("[dump6611] hook OUT " + name);
    } catch (e) {}
  });
  // funcoes de RECEBIMENTO: onLeave retorno = nbytes, buf=arg1
  ["recv", "recvfrom", "read"].forEach(function (name) {
    var p = Module.findExportByName(null, name);
    if (!p) return;
    try {
      Interceptor.attach(p, {
        onEnter: function (a) { this.buf = a[1]; },
        onLeave: function (r) {
          var n = r.toInt32();
          if (n > 0 && n < 65536) interesting(bufToStr(this.buf, n), "IN");
        }
      });
      console.log("[dump6611] hook IN " + name);
    } catch (e) {}
  });
  // SSL tambem, por garantia
  ["SSL_write", "SSL_read"].forEach(function (name) {
    var p = Module.findExportByName(null, name) || Module.findExportByName("libFunSDK.so", name);
    if (!p) return;
    try {
      if (name === "SSL_write") {
        Interceptor.attach(p, { onEnter: function (a) { var n = a[2].toInt32(); if (n > 0 && n < 65536) interesting(bufToStr(a[1], n), "OUT"); } });
      } else {
        Interceptor.attach(p, { onEnter: function (a) { this.buf = a[1]; }, onLeave: function (r) { var n = r.toInt32(); if (n > 0 && n < 65536) interesting(bufToStr(this.buf, n), "IN"); } });
      }
      console.log("[dump6611] hook " + name);
    } catch (e) {}
  });
  console.log("[dump6611] armado — abra uma camera ao vivo no app");
})();
