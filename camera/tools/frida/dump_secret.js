/*
 * dump_secret.js — extrai o appSecret/certificado da plataforma do FunSDK em
 * runtime, hookando as funcoes nativas que a RE identificou:
 *   IXMEncrypt::SetParmeValue(this, appKey, appSecret, cert, n)   <- os 3 char*
 *   IXMEncrypt::GetEncryptStr(this, &out, inData)                 <- out = MD5-chave
 *   IXMAccountData::SetPlatformCertificateInfo(this, s1, s2, s3, n)
 *
 * Grava em /data/data/com.cz.czeye/files/appsecret.txt (ler com:
 *   adb shell run-as com.cz.czeye cat files/appsecret.txt) e no logcat.
 */
(function () {
  var PKG = "com.cz.czeye";
  var OUT = "/data/data/" + PKG + "/files/appsecret.txt";
  var LIB = "libFunSDK.so";
  var SYM = {
    SetParmeValue: "_ZN12XMAccountAPI10IXMEncrypt13SetParmeValueEPKcS2_S2_i",
    GetEncryptStr: "_ZN12XMAccountAPI10IXMEncrypt13GetEncryptStrERNSt6__ndk112basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEEPc",
    SetPlatCert:   "_ZN12XMAccountAPI14IXMAccountData26SetPlatformCertificateInfoERKNSt6__ndk112basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEES9_S9_i",
    ToMD5:         "_ZN2OS5ToMD5EPhPvi"
  };
  var APPKEY = "<APP_KEY>";
  var logged = {};

  function save(line) {
    console.log("[dump_secret] " + line);
    try {
      var f = new File(OUT, "a");
      f.write(line + "\n"); f.flush(); f.close();
    } catch (e) {}
  }

  // le std::string (__ndk1 libc++): bit0 do 1o byte = modo long
  function readStdStr(p) {
    try {
      var b0 = p.readU8();
      if (b0 & 1) return p.add(16).readPointer().readUtf8String();  // long: ptr em +16
      return p.add(1).readUtf8String();                              // short: inline em +1
    } catch (e) { return "<err:" + e + ">"; }
  }
  function cstr(p) { try { return p.readUtf8String(); } catch (e) { return "<err>"; } }

  function hook(name, sym, fn) {
    var addr = null;
    try { addr = Module.getExportByName(LIB, sym); } catch (e) {}
    if (!addr) { try { addr = Module.findExportByName(LIB, sym); } catch (e) {} }
    if (!addr) { console.log("[dump_secret] NAO achei " + name); return; }
    Interceptor.attach(addr, fn);
    console.log("[dump_secret] hook em " + name + " @ " + addr);
  }

  hook("SetParmeValue", SYM.SetParmeValue, {
    onEnter: function (a) {
      var l = "SetParmeValue  p1=" + cstr(a[1]) + "  p2=" + cstr(a[2]) + "  p3=" + cstr(a[3]) + "  n=" + a[4].toInt32();
      if (!logged[l]) { logged[l] = 1; save(l); }
    }
  });

  hook("SetPlatformCertificateInfo", SYM.SetPlatCert, {
    onEnter: function (a) {
      var l = "SetPlatCert  s1=" + readStdStr(a[1]) + "  s2=" + readStdStr(a[2]) + "  s3=" + readStdStr(a[3]) + "  n=" + a[4].toInt32();
      if (!logged[l]) { logged[l] = 1; save(l); }
    }
  });

  hook("GetEncryptStr", SYM.GetEncryptStr, {
    onEnter: function (a) {
      // o certificado da plataforma fica em campos std::string do objeto 'this'
      var self = a[0];
      var cert = "CERT this+0x10=" + readStdStr(self.add(0x10)) +
                 " | +0x28=" + readStdStr(self.add(0x28)) +
                 " | +0x40=" + readStdStr(self.add(0x40)) +
                 " | +0x58=" + readStdStr(self.add(0x58));
      if (!logged[cert]) { logged[cert] = 1; save(cert); }
      this.out = a[1];
    },
    onLeave: function (r) {
      var key = readStdStr(this.out);
      var l = "GetEncryptStr -> key(MD5)=" + key;
      if (!logged[l]) { logged[l] = 1; save(l); }
    }
  });

  // XorEncrypt(in, inlen, key, keylen, out, outcap): 'in' = REQUEST em texto claro
  hook("XorEncrypt", "XorEncrypt", {
    onEnter: function (a) {
      try {
        var inlen = a[1].toInt32();
        var txt = a[0].readUtf8String(inlen > 0 && inlen < 4096 ? inlen : 256);
        var key = a[2].readUtf8String(a[3].toInt32());
        var l = "XorEncrypt REQ-claro=" + txt + "  ||KEY=" + key;
        if (!logged[l]) { logged[l] = 1; save(l); }
      } catch (e) {}
    }
  });

  // Base64DecodeAndXorDecrypt(b64in, key, keylen, out): out = RESPOSTA decifrada
  hook("Base64DecodeAndXorDecrypt", "Base64DecodeAndXorDecrypt", {
    onEnter: function (a) { this.key = (function(){try{return a[1].readUtf8String(a[2].toInt32());}catch(e){return "<?>";}})(); this.out = a[3]; },
    onLeave: function (r) {
      try {
        var n = r.toInt32();
        if (n > 0) {
          var txt = this.out.readUtf8String(n < 4096 ? n : 4096);
          var l = "DecResp RESP-claro=" + txt + "  ||KEY=" + this.key;
          if (!logged[l]) { logged[l] = 1; save(l); }
        }
      } catch (e) {}
    }
  });

  // XorDecrypt(in, inlen, key, keylen, out, outcap): out = texto claro (caminho hex, ex. loginExist)
  hook("XorDecrypt", "XorDecrypt", {
    onEnter: function (a) {
      this.key = (function(){try{return a[2].readUtf8String(a[3].toInt32());}catch(e){return "<?>";}})();
      this.out = a[4];
    },
    onLeave: function (r) {
      try {
        var n = r.toInt32();
        if (n > 0) {
          var txt = this.out.readUtf8String(n < 4096 ? n : 4096);
          var l = "XorDec claro=" + txt + "  ||KEY=" + this.key;
          if (!logged[l]) { logged[l] = 1; save(l); }
        }
      } catch (e) {}
    }
  });

  // ToMD5(out, in, len): dumpa o PREIMAGE exato (so os que contem o appKey)
  hook("ToMD5", SYM.ToMD5, {
    onEnter: function (a) {
      try {
        var ln = a[2].toInt32();
        if (ln > 0 && ln < 1024) {
          var s = a[1].readUtf8String(ln);
          if (s && s.indexOf(APPKEY) >= 0) {
            var l = "ToMD5 preimage(" + ln + ")=" + s;
            if (!logged[l]) { logged[l] = 1; save(l); }
          }
        }
      } catch (e) {}
    }
  });

  console.log("[dump_secret] armado — abra o app / faca login");
})();
