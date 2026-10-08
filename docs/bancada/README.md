# Bancada do replay (provisória)

`/bancada` é uma aba provisória do site para os testes de bancada do replay. O aplicativo da câmera, ou uma automação, envia os clipes para o Cloudflare R2, e a equipe vê, baixa e apaga os clipes numa página protegida por senha.

- **Visibilidade:** a aba fica fora do menu e do sitemap, tem `noindex` e é bloqueada no `robots.txt`.
- **Desligada por padrão:** sem as variáveis abaixo, a página e a API respondem 404.
- **O que vem depois:** o envio pela Raspberry Pi, já desenhado, fica para a próxima fase. Ver `docs/superpowers/specs/2026-10-08-bancada-envio-pela-pi-design.md`.

## 1. Configurar na Cloudflare (feito pela equipe)

1. **Bucket:** em R2, crie um bucket privado (por exemplo, `replay-bancada`). Não ative o acesso público.
2. **Token de API:** em R2 › Manage API Tokens, crie um token com permissão **Object Read & Write**, só para esse bucket. Anote o *Access Key ID*, o *Secret Access Key* e o *Account ID*.
3. **CORS do bucket:** em Settings › CORS policy. É necessário para o upload manual e o player da página, que falam direto com o R2.

   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000"],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedHeaders": ["content-type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   Quando o site estiver publicado, acrescente o domínio em `AllowedOrigins`.
4. **Opcional:** uma regra de ciclo de vida (Object lifecycle rules) que apaga os objetos do prefixo `bancada/` depois de 7 dias, como no produto.

## 2. Variáveis no `.env.local` (nunca commitado)

```
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=replay-bancada
BANCADA_TOKEN=...   # do app/automação; 16+ caracteres
BANCADA_SENHA=...   # da página; 16+ caracteres
```

Para gerar um valor aleatório: `node -e "console.log(crypto.randomBytes(24).toString('base64url'))"`.

Depois, reinicie o `npm run dev` e abra `http://localhost:3000/bancada`.

Para o app da câmera alcançar o notebook, os dois precisam estar na mesma rede. Use o endereço "Network" que o `next dev` mostra, por exemplo `http://192.168.0.10:3000`. Na Vercel, as mesmas variáveis vão nas configurações do projeto (só quando a equipe decidir publicar).

## 3. Como enviar

### Em uma chamada só (aplicativo da câmera, automação simples)

```
POST /api/bancada/receber?token=TOKEN&quadra=q1&camera=c1&botao=b1&apertadoEm=2026-10-08T20:37:12Z
```

- **Corpo:** o vídeo bruto (`Content-Type: video/mp4`) ou multipart com o campo `arquivo`.
- **Token:** vai em `?token=` ou no cabeçalho `Authorization: Bearer TOKEN`.
- **Campos opcionais:** `quadra`, `camera` e `botao` (padrão `teste`), e `apertadoEm`. Este aceita ISO 8601 ou epoch em segundos ou milissegundos; sem ele, vale o horário de chegada. Esses campos podem ir na URL ou como campos do multipart.
- **`origem`:** padrão `app`. Use `automacao` quando vier de uma automação.
- **Resposta `201`:** `{ "ok": true, "chave": "bancada/…mp4", "tamanho": 123, "apertadoEm": "…" }`.
- **Limites:** 300 MB no notebook. Na Vercel, o corpo das funções vai só até **4,5 MB**: para clipes maiores, use as duas etapas.

```bash
curl -X POST "http://localhost:3000/api/bancada/receber?token=TOKEN&quadra=q1&camera=c1" -H "Content-Type: video/mp4" --data-binary @lance.mp4
```

```bash
curl -X POST "http://localhost:3000/api/bancada/receber" -H "Authorization: Bearer TOKEN" -F "arquivo=@lance.mp4" -F "quadra=q1"
```

### Em duas etapas (arquivos grandes; mesmo fluxo que a Pi vai usar)

```bash
# 1. pede a URL assinada (válida por 15 min)
curl -X POST "http://localhost:3000/api/bancada/upload-url" -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"quadra":"q1","camera":"c1","botao":"b1","apertadoEm":"2026-10-08T20:37:12Z"}'
# resposta: { "chave": "bancada/…mp4", "urlUpload": "https://…r2.cloudflarestorage.com/…", "metodo": "PUT", … }

# 2. sobe o arquivo direto no R2
curl -X PUT "URL_UPLOAD" -H "Content-Type: video/mp4" --data-binary @lance.mp4

# 3. confirma (só depois do 200 dá para apagar a cópia local)
curl -X POST "http://localhost:3000/api/bancada/confirmar" -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"chave":"bancada/…mp4"}'
```

### Câmera que só envia por FTP

Não há suporte nesta fase: a Vercel não recebe FTP. Se for o caso, a saída é um intermediário que recebe por FTP e chama `/api/bancada/receber`.

## 4. Como os clipes ficam guardados

Os dados de cada clipe vão no próprio nome do objeto. Assim a listagem já traz tudo, sem banco e sem metadados extras:

```
bancada/2026-10-08/<quadra>/<camera>/<botao>/20261008T203712Z--<origem>--<id>.mp4
```

A página mostra os clipes dos mais novos para os mais antigos. Para cada um: player, aperto, chegada, atraso (chegada − aperto), quadra, câmera, botão, origem e tamanho. A lista se atualiza sozinha a cada 10 segundos. O upload manual mostra a velocidade em MB/s.

## 5. Segurança

- **Senha da página:** vira um cookie `httpOnly` com o HMAC da senha, válido por 12 horas. Trocar a `BANCADA_SENHA` derruba todas as sessões. O login tem limite de tentativas.
- **Token na URL:** pode aparecer em logs. **Troque o `BANCADA_TOKEN` ao fim dos testes.**
- **Bucket:** é privado. O player e o "Abrir / baixar" usam URLs assinadas, válidas por 1 hora.
- **Política de conteúdo (CSP):** só `/bancada` libera `https://*.r2.cloudflarestorage.com`. O resto do site continua só com `'self'`.

## 6. Como remover depois

Apague:

- `src/app/bancada`, `src/app/api/bancada`, `src/lib/bancada` e `docs/bancada`;
- o bloco `/bancada` do `next.config.ts` e do `src/app/robots.ts`;
- a dependência `aws4fetch`, se nada mais a usar.
