# Captura dirigida do LOGIN (última milha p/ acesso remoto)

**Objetivo:** capturar a fase de **login** do app (que mint o `ClientToken` fresco) —
a captura anterior (`dump_hook.txt`) começou *depois* do login e por isso o token já
estava "velho" quando tentamos usar (`Ret:137`).

## Passos (celular Redmi, sem root, com o setup que já existe)

1. **Ligar o Frida gadget + hook** (o `dump_secret.js` já dumpa request/response em
   claro + preimages). Com o app já preparado pelo `android-unpinner`:
   ```bash
   # empurra o hook e (re)inicia o app com ele carregado
   python -m android_unpinner push-resources com.cz.czeye
   python -m android_unpinner start-app com.cz.czeye
   # (o dump_secret.js precisa estar em android_unpinner/scripts/ — foi assim que geramos dump_hook.txt)
   ```
   Confirme no logcat a linha `[dump_secret] armado — abra o app / faca login`.

2. **DENTRO DO APP: SAIR da conta (logout) e ENTRAR de novo (login com e-mail+senha).**
   Isso é o essencial — tem que ser um login *novo*, não abrir o app já logado.
   Depois, abra **uma câmera ao vivo** uma vez (p/ capturar o CLI_NEED_CON fresco também).

3. **Puxar o dump:**
   ```bash
   adb shell run-as com.cz.czeye cat files/appsecret.txt > dump_login_novo.txt
   ```

4. **Me manda o `dump_login_novo.txt`** (ou roda você mesmo):
   ```bash
   python parse_login.py dump_login_novo.txt
   ```

## O que vou extrair dele

- Formato exato do request de login (`loginExist`/login) → reproduzir em Python.
- **Onde o `ClientToken`/`AuthCode` são emitidos** → se bastar o JWT (vale 30 dias),
  dá pra mintar sem senha (atalho); senão, reproduzo o login com e-mail+senha.
- **Origem do `const36`** → se for constante de instalação, reaproveito; se nascer no
  login, extraio da resposta.

Com isso, o `xmremote.py` passa a obter credenciais frescas sozinho e o vídeo remoto
fecha ponta-a-ponta (STATUS → CLI_NEED_CON → relay :6611 → login → OPMonitor → MP4).

> Dica: se preferir não re-logar no celular, a alternativa é decompilar a cadeia de
> login no `libFunSDK.so` (Ghidra) — funciona sem o celular, mas é bem mais lento.
