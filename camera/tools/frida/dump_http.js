/*
 * dump_http.js — captura o HTTP inteiro em claro (antes do TLS) hookando
 * SSL_write (requests) e SSL_read (responses) da libFunSDK.so (BoringSSL estático).
 * Revela: request line, Host, headers (JFTECH-TIME/JFTECH-REQ), e o envelope de
 * TODOS os endpoints (jftechws E secu100). Grava em files/http_dump.txt.
 */
(function () {
  var PKG = "com.cz.czeye";
  var OUT = "/data/data/" + PKG + "/files/http_dump.txt";
  var LIB = "libFunSDK.so";

  function save(s) {
    console.log("[http] " + s.substring(0, 200));
    try { var f = new File(OUT, "a"); f.write(s + "\n----\n"); f.flush(); f.close(); } catch (e) {}
  }
  function rd(p, n) { try { return p.readUtf8String(n); } catch (e) { return p.readByteArray(Math.min(n, 512)); } }

  function hookW() {
    var a = Module.findExportByName(LIB, "SSL_write");
    if (!a) { console.log("[http] SSL_write nao achado"); return; }
    Interceptor.attach(a, {
      onEnter: function (ar) {
        try {
          var num = ar[2].toInt32();
          if (num <= 0 || num > 65536) return;
          var s = ar[1].readUtf8String(num);
          if (s && /^(POST|GET|PUT|DELETE) /.test(s)) save(">>> REQUEST (" + num + ")\n" + s.substring(0, 2000));
        } catch (e) {}
      }
    });
    console.log("[http] hook SSL_write @ " + a);
  }
  function hookR() {
    var a = Module.findExportByName(LIB, "SSL_read");
    if (!a) { console.log("[http] SSL_read nao achado"); return; }
    Interceptor.attach(a, {
      onEnter: function (ar) { this.buf = ar[1]; },
      onLeave: function (r) {
        try {
          var n = r.toInt32();
          if (n <= 0 || n > 65536) return;
          var s = this.buf.readUtf8String(n);
          if (s && (s.indexOf("HTTP/1") === 0 || s.indexOf("JFTECH") >= 0)) save("<<< RESPONSE (" + n + ")\n" + s.substring(0, 1500));
        } catch (e) {}
      }
    });
    console.log("[http] hook SSL_read @ " + a);
  }
  hookW(); hookR();
  console.log("[http] armado — navegue no app");
})();
