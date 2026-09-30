# Contexto do projeto

## Quem somos
Grupo de amigos da faculdade que desenvolve aplicações sob demanda para empresas. O modelo atual: identificar a necessidade de um tipo de empresa, construir um MVP de preview e gravar um vídeo curto mostrando as features, para então apresentar a empresas.

Ainda não temos nenhum cliente. Estamos na fase de estruturar o negócio.

## O que já existe
- **App de gestão para representantes de vendas e entregadores**: gerencia clientes, pedidos e rotas de entrega. MVP pronto + vídeo de demonstração.
- **Ideia em avaliação**: um site-catálogo com os apps que já fizemos e uma área de captação de leads.

## Conclusões da análise do negócio
- O site-catálogo é útil como prova de credibilidade, mas não gera clientes sozinho. Quem traz conversas é a prospecção ativa. O site deve ser enxuto e feito rápido.
- Principal risco: construir antes de validar com quem paga. Próximos MVPs só depois de entrevistar empresas.
- O mercado de apps para representantes comerciais já tem concorrentes prontos e baratos (ex.: Mercos). Nosso diferencial provável: personalização, integração com o que o cliente já usa, proximidade e preço.
- Precisamos decidir se somos software house sob medida ou empresa de produto (SaaS). Não misturar a mensagem.
- Objeção esperada: "e quando vocês se formarem, quem mantém?". Resposta: planos mensais de manutenção/suporte/hospedagem, que também geram receita recorrente.
- Recomendação: escolher um nicho (o app atual aponta para distribuidoras e indústrias pequenas).

## Roadmap (5 fases, ~12 meses)
Cada fase só começa quando a anterior cumpre seu "portão".

| Fase | Período | Foco | Portão para avançar |
|---|---|---|---|
| 0. Fundação | Semanas 1–2 | Nicho, papéis (alguém responsável por vendas), acordo de sócios, contador, contrato e proposta padrão, lista de 30 empresas-alvo | Nicho escolhido, acordo assinado, lista pronta |
| 1. Descoberta | Semanas 3–6 | 10–15 entrevistas com empresas do nicho, sem vender; mostrar o vídeo só no fim | Dor repetida em 3+ empresas e 1 empresa topando piloto |
| 2. Pilotos | Semanas 6–12 | 1–2 pilotos com desconto em troca de case; escopo de 4–6 semanas; medir o "antes" | 30 dias de uso real, depoimento, 1 resultado medido |
| 3. Vendas | Meses 3–6 | Site por problema (não por app), cases com vídeo, WhatsApp em destaque, diagnóstico gratuito; prospecção semanal; funil simples | 3 clientes pagando preço cheio |
| 4. Recorrência | Meses 6–12 | Planos mensais, base de código reaproveitável, decidir entre sob medida e SaaS, documentação para sobreviver à formatura | Receita recorrente cobre custos fixos |

## Onde o Claude Code deve ajudar agora
Prioridades, em ordem:
1. **Revisão do código do app** de representantes/entregas: segurança, bugs, qualidade.
2. **Testes automatizados** para os fluxos principais (clientes, pedidos, rotas).
3. **LGPD**: identificar dados pessoais tratados e o que falta (consentimento, exclusão, acesso, logs).
4. **Documentação**: README de instalação, arquitetura e deploy, para qualquer pessoa do grupo (ou do cliente) conseguir manter.
5. **Base reaproveitável**: mapear o que é genérico (login, cadastro de clientes, pedidos, relatórios) e propor como separar num núcleo reutilizável entre clientes.
6. **Landing page** enxuta: organizada por problema do nicho, cases, botão de WhatsApp, formulário curto (nome, empresa, WhatsApp, problema), oferta de diagnóstico gratuito, seção da equipe.

## Restrições
- Não iniciar um novo MVP do zero antes das entrevistas da Fase 1.
- Priorizar o que torna o app atual mais vendável e mais fácil de manter.
- Idioma de trabalho: português.

## A preencher pelo grupo
- Stack do app (linguagem, framework, banco, hospedagem):
- Stack do site: TypeScript, Node.js, React, PostgreSQL, deploy na Vercel
- Nicho escolhido:
- Quem é responsável por vendas:
