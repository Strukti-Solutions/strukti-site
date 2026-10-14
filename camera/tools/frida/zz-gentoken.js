/*
 * zz-gentoken.js — captura a derivação do UserName do login TOKEN
 * (Fun_GenPWDToken) e o devlist/AuthCodes, pra generalizar o acesso remoto
 * a QUALQUER câmera sem precisar de creds locais em cache.
 *
 * Escreve 'ARMED' na hora (confirma attach) em files/gen.txt.
 * Dispara ao ABRIR uma câmera (login TOKEN): p1, p2 -> UserName.
 */
(function () {
  var PKG = "com.cz.czeye", OUT = "/data/data/" + PKG + "/files/gen.txt", LIB = "libFunSDK.so";
  function save(l){ console.log("[gen] "+l.substring(0,160)); try{var f=new File(OUT,"a");f.write(l+"\n");f.flush();f.close();}catch(e){} }
  function cs(p){ try{return p.readUtf8String();}catch(e){return "<e>";} }
  function find(sym){ return Module.findExportByName(LIB,sym) || Module.findExportByName(null,sym); }

  var SYMS = {
    GenPWDToken: "_Z15Fun_GenPWDTokenPKcS0_Pc",
    DecHttp: "_Z15Fun_DecHttpDataiPKciS0_PcRi",
    EncHttp: "_Z15Fun_EncHttpDataiPKciS0_PcRi",
    GetDevListXM: "_Z29GetDevList_ByUserName_XMCloudRPN6FUNSDK8UserInfoERPN12XMAccountAPI16SDevAuthCodeInfoEPKcS8_R8SZStringi",
  };
  var armed = [];
  for (var k in SYMS) { var a = find(SYMS[k]); armed.push(k + "=" + (a ? a : "NULL")); }
  save("ARMED " + armed.join("  "));

  var g = find(SYMS.GenPWDToken);
  if (g) Interceptor.attach(g, {
    onEnter: function (a) { this.p1 = a[0]; this.p2 = a[1]; this.out = a[2]; },
    onLeave: function () { save("GenPWDToken p1=" + cs(this.p1) + "  p2=" + cs(this.p2) + "  -> UserName=" + cs(this.out)); }
  });

  var d = find(SYMS.DecHttp);
  if (d) Interceptor.attach(d, {
    onEnter: function (a) { this.out = a[4]; this.pl = a[5]; },
    onLeave: function () { var n=0; try{n=this.pl.readS32();}catch(e){}
      var s=""; try{var b=this.out.readByteArray(n>0&&n<60000?n:4096);var u=new Uint8Array(b);for(var i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);}catch(e){}
      if (s && /c_[a-z0-9]{18}|AuthCode|SDevAuth|accessToken|DevList/.test(s)) save("DEC " + s.replace(/[^\x20-\x7e]/g,".").substring(0,700)); }
  });

  var e = find(SYMS.EncHttp);
  if (e) Interceptor.attach(e, {
    onEnter: function (a) { this.d=a[1]; this.l=a[2].toInt32(); },
    onLeave: function () { var s=""; try{var b=this.d.readByteArray(this.l>0&&this.l<60000?this.l:4096);var u=new Uint8Array(b);for(var i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);}catch(e){}
      if (s && /login|Login|DevList|GetDev|authcode|AuthCode/.test(s)) save("ENC " + s.replace(/[^\x20-\x7e]/g,".").substring(0,700)); }
  });

  save("hooks ativos — ABRA uma câmera (f5332/9a07) no app");
})();
