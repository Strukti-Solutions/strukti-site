/*
 * token_hook.js — extrai o token fresco do handshake NetIP (porta 6611) do
 * app Tris Home (com.cz.czeye), em tempo de execução, via Frida Gadget.
 *
 * O gadget (injetado pelo android-unpinner, SEM root) roda todos os .js de
 * /data/local/tmp/android-unpinner/. Este script engancha o send() nativo,
 * acha o pacote "<base64>XXEE" do handshake e grava em um arquivo dentro da
 * área do app (lido depois com: adb shell run-as com.cz.czeye cat files/...).
 */
(function () {
  var PKG = "com.cz.czeye";
  var OUT = "/data/data/" + PKG + "/files/token6611.txt";
  var fdServer = {};   // fd -> "ip:port" para conexões na 6611
  var dumped = {};     // evita gravar o mesmo token várias vezes

  function hook(name) {
    var p = Module.findExportByName(null, name);
    if (!p) return;
    Interceptor.attach(p, {
      onEnter: function (args) {
        try {
          var fd = args[0].toInt32();
          var len = args[2].toInt32();
          if (len <= 0 || len > 8192) return;
          var bytes = args[1].readByteArray(len);
          if (!bytes) return;
          var u8 = new Uint8Array(bytes);
          // monta string ASCII do buffer
          var s = "";
          for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
          var xx = s.indexOf("XXEE");
          if (xx > 0 && s.indexOf("aaaaaaaa") !== -1) {
            var token = s.substring(0, xx); // base64, sem o XXEE
            if (dumped[token]) return;
            dumped[token] = true;
            var server = fdServer[fd] || "?";
            console.log("\n[token_hook] TOKEN :6611 capturado (" + server + ")");
            console.log("[token_hook] " + token);
            try {
              var f = new File(OUT, "w");
              f.write("SERVER=" + server + "\n");
              f.write("TOKEN=" + token + "\n");
              f.flush();
              f.close();
              console.log("[token_hook] gravado em " + OUT);
            } catch (e) {
              console.log("[token_hook] (não gravou arquivo: " + e + ")");
            }
          }
        } catch (e) {}
      }
    });
  }

  // captura o IP:porta das conexões na 6611 (connect)
  var pc = Module.findExportByName(null, "connect");
  if (pc) {
    Interceptor.attach(pc, {
      onEnter: function (args) {
        try {
          var fd = args[0].toInt32();
          var sa = args[1];
          if (sa.readU16() !== 2) return;              // AF_INET
          var port = (sa.add(2).readU8() << 8) | sa.add(3).readU8();
          var ip = sa.add(4).readU8() + "." + sa.add(5).readU8() + "." +
                   sa.add(6).readU8() + "." + sa.add(7).readU8();
          if (port === 6611) fdServer[fd] = ip + ":" + port;
        } catch (e) {}
      }
    });
  }

  ["send", "write", "sendto"].forEach(hook);
  console.log("[token_hook] armado — abra uma câmera no app para disparar o handshake :6611");
})();
