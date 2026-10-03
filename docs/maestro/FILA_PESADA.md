# Fila pesada (RAM de 7,4 GB) — regra do Claudinho, 03/10

Pesado = npm ci / npm install, next build, next start, check:browser, Lighthouse, Playwright.

1. Antes de algo pesado: confira a RAM livre (>= 1,2 GB) e o arquivo C:\dev\negocio-wt\FILA_PESADA.lock.
2. Se o lock existir com o nome de OUTRO agente e tiver menos de 25 min, espere (faca trabalho leve e confira a cada ~2 min).
3. Se nao existir (ou estiver velho), crie com: "<SeuNome> <hora>" e rode o seu pesado.
4. Ao terminar (ou se der erro), APAGUE o lock e encerre servidor e navegador que voce abriu (nada de processo orfao).
5. Um pesado por vez na maquina inteira. Se o sistema derrubar seu processo por memoria, apague o lock e avise seu lider.
