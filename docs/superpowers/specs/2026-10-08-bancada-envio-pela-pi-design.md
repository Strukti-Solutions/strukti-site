# Bancada do replay: envio pela Raspberry Pi (design adiado)

**Data:** 08/10/2026
**Status:** adiado. O desenho foi aprovado para uso futuro. A fase de testes atual envia direto do aplicativo da câmera (ou de uma automação), sem a Pi: a página, o armazenamento e o envio em duas etapas já foram implementados para essa fase (ver `docs/bancada/README.md`). Quando a Pi entrar, ela usa o mesmo fluxo de duas etapas (`upload-url` → PUT → `confirmar`), com `origem` igual a `pi`.
**Base:** `Downloads/contexto-replay.md`, seção "Como o sistema funciona".

## Objetivo

Uma aba provisória no site (`/bancada`) para os testes de bancada do replay. A Raspberry Pi envia os clipes para a nuvem (Cloudflare R2), e a equipe vê, baixa e apaga os clipes numa página protegida. A página também aceita upload manual, para testar sem a Pi.

## Decisões tomadas

| Tema | Decisão |
|---|---|
| Como os arquivos chegam | Pela Pi, via API com token, e também por upload manual na página. |
| Armazenamento | Cloudflare R2, bucket privado. |
| Banco de dados | Nenhum nesta fase: os dados de cada clipe ficam no nome do próprio objeto no R2. Na implementação, o nome substituiu os metadados `x-amz-meta-*` porque uma URL assinada não garante esses cabeçalhos. |
| Visibilidade | A rota `/bancada` não aparece no menu nem no sitemap, tem `noindex` e é bloqueada no `robots`. |
| Código | Isolado em `src/app/bancada`, `src/app/api/bancada` e `src/lib/bancada`, para remover de uma vez. |

## Proteção

- **Página:** senha da equipe, na variável `BANCADA_SENHA`.
- **Pi:** token próprio, enviado como `Authorization: Bearer <BANCADA_TOKEN>`.
- **Desligada por padrão:** sem essas variáveis, toda a rota responde 404.

## Fluxo da Pi

O fluxo segue o documento de arquitetura. A Pi só faz conexões de saída, então funciona atrás de CGNAT.

1. `POST /api/bancada/upload-url` com `{quadra, camera, botao, apertadoEm, tamanho}`. A API responde `{chave, urlUpload}`, onde `urlUpload` é um PUT assinado no R2, válido por 15 minutos.
2. A Pi faz o PUT do `.mp4` direto no R2. O arquivo não passa pelo servidor, então não esbarra no limite de 4,5 MB do corpo das funções na Vercel.
3. `POST /api/bancada/confirmar` com `{chave}`. A API confere o objeto no R2 (HEAD) e responde com o tamanho. **Só então** a Pi apaga a cópia local.

## A página

- Lista os clipes, dos mais novos para os mais antigos, com quadra, câmera, botão, horário do aperto e tamanho.
- Mostra o **atraso** entre o aperto e a chegada no R2 (`LastModified − apertadoEm`).
- Tem player com URL de leitura assinada, válida por 1 hora, e os botões Baixar e Apagar.
- Aceita upload manual: arrastar um `.mp4`, que segue os mesmos três passos da Pi.

## Armazenamento

- Os objetos ficam no prefixo `bancada/`, com os dados no nome: `bancada/AAAA-MM-DD/<quadra>/<camera>/<botao>/<AAAAMMDDTHHMMSSZ>--<origem>--<id>.mp4`.
- Opcional: uma regra de ciclo de vida no bucket apaga os objetos depois de 7 dias, como no produto.

## Dependência

- `aws4fetch`, para assinar as requisições S3 do R2. É pequena e sem dependências. Entra com versão exata e respeitando a quarentena de 7 dias.

## Política de conteúdo (CSP)

- Só a rota `/bancada` libera o endpoint do R2 em `connect-src` (upload) e `media-src` (player). O restante do site continua só com `'self'`.

## O que a equipe configura na Cloudflare

O Claude não cria contas nem digita chaves.

- Criar o bucket.
- Criar um token R2 com permissão de leitura e escrita de objetos.
- Liberar o CORS do bucket para PUT e GET a partir de `http://localhost:3000` e do domínio do site.
- Opcional: a regra de ciclo de vida de 7 dias.
- Colocar no `.env.local`: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `BANCADA_TOKEN` e `BANCADA_SENHA`.

## Para a Pi

- Um script de exemplo com `curl` para os três passos, e um README.

## Testes previstos

- A API recusa requisições sem token.
- Montagem e validação dos nomes dos arquivos.
- A rota responde 404 quando está desligada.
- Chamadas ao R2 simuladas nos testes.
