# Fábrica de Software Virtual — Processo de Trabalho (Scrumban)

**Documento:** `04-processo-trabalho.md`  
**Versão:** 1.0 — proposta operacional para validação  
**Data:** 11/11/2026  
**Escopo:** preparação do software-base, piloto supervisionado e continuidade open-source  
**Referências internas:** `FABRICA_SOFTWARE_GUIA_MESTRE.md` v1.0; `01-visao-produto.md` v1.0; `02-benchmarking.md` v1.0; `03-product-backlog.md` v1.0.

> **Estado:** o Guia Mestre aprova a entrada dos alunos em software existente, o uso do GitHub, o piloto pequeno, revisão humana e replicação educacional. A configuração exata do quadro, limites WIP, modelos, cadências e fluxos detalhados abaixo são **recomendações (R)**, não decisões já aprovadas. Regras de produto ainda dependem do organizador do clube, e a stack depende de ADRs.

## 1. Objetivo e princípio de funcionamento

Padronizar como uma necessidade do Clube do Livro se torna uma entrega verificável, garantindo **valor real para o clube** e **aprendizagem de engenharia de software**. O processo parte de código preexistente e simula colaboração profissional sem impor carga artificial de trabalho.

**Cadeia de valor proposta:** descoberta com organizador → Product Backlog → refinamento → GitHub Issue pronta → planejamento/seleção → branch → implementação e testes → Pull Request (PR) → revisão técnica + CI → merge → validação em ambiente apropriado → registro de entrega → aprendizado e handover.

**Dois resultados diferentes, não intercambiáveis:**

- **Produto:** aplicação web funcional para catálogo, ciclos de leitura e encontros, evoluída por mudanças pequenas.
- **Experiência didática:** evidências de análise, comunicação, versionamento, testes, revisão, IA responsável, publicação e reflexão, mais um kit replicável.

A produtividade não será inferida isoladamente de commits, linhas de código, issues fechadas ou número de PRs.

## 2. Escopo e públicos do processo

| Contexto | Quem executa | Natureza do trabalho | Condição |
|---|---|---|---|
| **Preparação pré-piloto — P0** | Mentor/equipe preparatória | Construir e validar software-base, infraestrutura mínima, documentação e snapshot | **Antes** do ingresso dos alunos |
| **Piloto — P1** | 3–4 alunos com supervisão | Melhorias incrementais e correções em código existente; tarefas pequenas e revisáveis | Quatro semanas; 3–4 h por aluno/semana como hipótese operacional |
| **Evolução — P2** | Mantenedores, novas turmas/contribuidores | Funcionalidades condicionais e mudanças de maior alcance | Após validação de valor, risco e capacidade |
| **Kit didático — ED** | Mentor, com contribuições dos alunos | Onboarding, templates, exemplos auditáveis, rubricas, snapshots e replicação | Trilha separada das features do produto |

**Regra crítica:** tarefas essenciais para o funcionamento mínimo do clube **não** podem depender da conclusão de issues dos alunos. O conjunto P0 do `03-product-backlog.md` é a proposta de base; seu corte final requer aprovação.

## 3. Por que Scrumban (Scrum + Kanban)

O método recomendado é **Scrumban**: ciclos curtos de planejamento, revisão e retrospectiva inspirados em Scrum, com gestão visual, fluxo puxado e limite de trabalho em progresso inspirados em Kanban. Não afirmar que esta implementação corresponde a Scrum formal ou que exige todos os seus eventos e papéis.

| Necessidade do piloto | Prática recomendada | Benefício esperado |
|---|---|---|
| Priorizar valor e dar contexto | Product Backlog + refinamento | O aluno entende por que a mudança importa |
| Planejar semanas com capacidade limitada | Planejamento curto e objetivo de iteração | Evita aceitar mais trabalho do que cabe |
| Visualizar e limitar simultaneidade | Board e WIP | Reduz tarefas parcialmente concluídas |
| Trabalhar em software real | Branch, commits, PR e review | Exercita integração profissional |
| Qualidade e rastreabilidade | Critérios de aceite, testes e CI | Torna entrega verificável |
| Aprender com o processo | Review, retrospectiva e handover | Gera evidência e aprimoramento |

**Cadência pedagógica inicial:** semana 1 onboarding; semanas 2 e 3 duas iterações de referência; semana 4 sustentação, publicação, handover e avaliação. Os nomes “Sprint 1/2” representam janelas curtas de organização, não obrigação de entregar todas as issues previstas.

## 4. Papéis, responsabilidades e decisões

| Papel | Decisões e atividades principais | Não deve fazer |
|---|---|---|
| **Representante do produto (professor do clube)** | Explicar necessidades, esclarecer regras, ordenar valor, validar resultado funcional | Aprovar solução técnica sem revisão especializada |
| **Tech Lead/Mentor** | Preparar P0, esclarecer escopo técnico, apoiar/refinar issues, controlar acesso, revisar PRs, autorizar merge/deploy e conduzir a experiência | Converter o piloto em produção sem supervisão; substituir aceite funcional quando este é necessário |
| **Aluno/trainee** | Entender a issue, negociar dúvidas, planejar mudança, implementar, testar, comunicar impedimentos, abrir PR e responder ao review | Fazer merge/alterações de produção sem autorização; apresentar código de IA não compreendido |
| **Mantenedor open-source** | Triar contribuições externas, manter política de qualidade, versões e segurança após o piloto | Aceitar automaticamente soluções de turmas replicadoras |

O mentor pode acumular funções de facilitação no piloto, **mas não confundir aprovação técnica com aceite do valor pelo organizador**. Responsáveis e suplentes devem ser designados antes da execução; disponibilidade ainda não está confirmada.

## 5. Artefatos e fonte de verdade

| Artefato | Função | Onde vive (proposta) |
|---|---|---|
| Guia Mestre, visão, benchmarking e backlog | Direções, decisões, hipóteses e priorização inicial | Documentos Markdown versionados |
| `04-processo-trabalho.md` | Política de trabalho e glossário | Repositório didático, referenciado no software |
| Issues de produto | Execução granular, contexto, aceite e dependências | `bookclub-platform` (GitHub Issues) |
| Issues didáticas | Preparação e melhoria do programa | `software-engineering-studio` (GitHub Issues) |
| GitHub Projects | Visão **operacional** de status, prioridade, iteração, responsável e bloqueios | Project compartilhado, se viável, com distinção de repositório/trilha |
| Pull Requests | Proposta de mudança, diffs, testes, revisão e aprovação | Repositório onde o código muda |
| Actions / CI | Checks automáticos de qualidade | Workflows de cada repositório |
| ADRs | Justificativas de decisões arquiteturais | `bookclub-platform/docs/adr/` |
| Releases/tags educacionais | Estado reproduzível de aprendizagem | Repositório de software + instruções no kit |
| Registros de retrospectiva e rubricas | Evidências pedagógicas | Área protegida quando houver dados pessoais; versão pública anonimizada, se cabível |

**Convenção:** o Markdown `03-product-backlog.md` registra a **linha de base de planejamento** (IDs PB/ED, corte e razões). Depois da migração, **GitHub Issues/Projects é a fonte operacional** para status, responsáveis, datas e PRs; mudanças de escopo, regras ou decisões relevantes devem voltar aos documentos versionados. Não manter status manual duplicado em dois lugares.

## 6. Como transformar o backlog em GitHub Issues e Projects

### 6.1 Ordem de configuração

1. **Validar o recorte** P0/P1/P2, regras do clube e dependências críticas antes da importação em massa.
2. Definir nome da organização/repositórios, licenças e permissões (ainda pendentes), criar `bookclub-platform` e `software-engineering-studio`.
3. Publicar README, `CONTRIBUTING.md`, política de segurança, templates de issues/PRs, branch protection/rulesets e CI básica.
4. Configurar um GitHub Project com campos mínimos, views e automações viáveis; separar itens de produto e didáticos por filtro/trilha.
5. Criar **primeiro somente** épicos e issues P0/P1 efetivamente refinadas e ED de preparação; manter P2 como itens documentados até ter valor validado.
6. Relacionar issues aos respectivos épicos, adicionar dependências e conferir IDs PB/ED. Selecionar itens `Ready` após cumprir a DoR.
7. Confirmar que cada issue tem proprietário de validação e um fluxo de review antes de atribuir trabalho.

**Não criar issues no GitHub agora automaticamente**: este documento descreve a configuração futura, após a etapa de planejamento e as decisões pendentes.

### 6.2 Hierarquia recomendada

- **Épico:** issue de nível superior identificada por `EP-01` a `EP-08`, com objetivo, resultado e referências. Preferir o recurso de sub-issues do GitHub quando disponível e adequado; alternativamente usar links e checklist de issues relacionadas. O épico não substitui uma issue executável.
- **História/feature:** issue `PB-###` com valor, contexto e critérios de aceite, que pode ser entregue por um PR pequeno ou decomposta.
- **Tarefa técnica / bug / spike / documentação:** issue própria, vinculada ao PB/EP quando necessário. Nem toda issue deve ser artificialmente escrita como história de usuário.
- **Kit didático:** issues `ED-###` no repositório didático; podem linkar PRs/issues do produto sem misturar os dois tipos de entrega.

**Preservar IDs:** prefixar os títulos com `PB-102`, `ED-001` ou `EP-02` e usar o número gerado pelo GitHub somente como identificador técnico adicional. Ex.: `PB-102 — Buscar livros por título/autor`. O ID do backlog não é o mesmo que `#123`.

### 6.3 Campos, labels e views (proposta mínima)

| Campo | Valores / uso propostos | Observação |
|---|---|---|
| `Status` | Backlog · Ready · In Progress · In Review · Done | Estado do trabalho, não necessariamente aceitação do produto |
| `Priority` | P0 · P1 · P2 | P0 = base; P1 = candidata a aluno; P2 = evolução |
| `Track` | Base · Alunos · Futuro · Didático | Distingue **quem/para que** sem inferir prazo |
| `Size` | S · M · L | Qualitativo; L tende a exigir decomposição |
| `Iteration` | Preparação · Semana 1 · Sprint 1 · Sprint 2 · Semana 4, conforme configuração | Datas reais a definir; não atribuir tudo ao piloto |
| `Assignee` | Pessoa responsável | Preferencialmente 1 executor principal |
| `Epic` | EP-01 ... EP-08 | Pode ser representado pela relação parent/sub-issue em vez de campo duplicado |
| `Blocked` | Label `blocked` e comentário explicativo | Registrar responsável e condição para desbloqueio |

**Labels sugeridas:** `type:story`, `type:bug`, `type:chore`, `type:docs`, `type:spike`, `good-first-issue`, `security`, `accessibility`, `blocked`, `needs-product-validation`. Não duplicar Priority/Track em labels se já estiverem disponíveis como campos do Project. Adaptar aos recursos efetivamente oferecidos na conta/organização.

**Views:** (a) `Board — fluxo` por Status; (b) `Backlog — priorização` filtrado por Track/Priority; (c) `Piloto` filtrado por iteração; (d) `Preparação P0`; (e) `Kit didático`. Começar com poucas views para não gerar burocracia.

### 6.4 Entrada incremental: o que vira issue e quando

- **Antes do piloto:** EP-01...EP-08 como agrupadores, P0 indispensáveis da preparação, ED-001...ED-005 e **somente 3–6 issues P1 pequenas** realmente elegíveis a trabalho imediato (quantidade indicativa, não meta).
- **Durante o piloto:** novas issues apenas por necessidade validada, defeito reproduzível ou refinamento. `PB-109` só existe como correção concreta se for encontrado um bug; não inventar defeitos.
- **Depois:** P2 pode ficar no backlog documental ou virar issue após confirmação de valor, riscos e dependências. `PB-110` é condicional a regras de identidade, elegibilidade e publicação.

**Processo de migração:** copiar objetivo e CA do PB → acrescentar contexto de tela/arquivo/dados → resolver perguntas do domínio → recortar tarefa de tamanho adequado → associar EP e dependências → classificar no Project → marcar `Ready` apenas com DoR atendida. Atualizar no Markdown os **links de rastreabilidade**, se útil, sem replicar o status vivo.

## 7. Fluxo visual e regras de movimentação

```text
Backlog ──(refinamento + DoR)──> Ready ──(aluno assume)──> In Progress
   ^                                |                         |
   |                                |                         v
   +── mudança de escopo /          |                   In Review (PR aberto)
       bloqueio não resolvido       |                         |
                                    |                review + CI + ajustes
                                    |                         v
                                    +----------------------> Done
                                                  (merge + validação + registro)
```

| Estado | Entrada | Saída | Responsável |
|---|---|---|---|
| **Backlog** | Demanda identificada e registrada | Contexto, CA e dependências refinados | Mentor + representante do produto |
| **Ready** | DoR atendida, escopo pequeno e disponível | Aluno assume, explicita plano e abre branch | Mentor autoriza seleção; aluno assume |
| **In Progress** | Trabalho iniciado | PR com descrição, testes e vínculo à issue | Aluno |
| **In Review** | PR aberto e checks iniciados | Ajustes resolvidos, revisão aprovada, CI verde; merge conforme política | Mentor/revisor + aluno |
| **Done** | PR mergeado e critérios demonstrados; validação em ambiente apropriado e documentação de evidência | Reabertura/nova issue se surgir defeito ou aceite faltante | Mentor registra conclusão; organizador valida valor quando pertinente |

**Bloqueio:** manter a issue no estado de fluxo atual, adicionar `blocked` com causa e próxima ação; pausar WIP só por decisão explícita do mentor. Se há dúvida sobre regra de negócio, não inventar comportamento; solicitar decisão ao organizador. **PR aprovado não é automaticamente funcionalidade aceita pelo clube.** Quando a aceitação externa ainda estiver pendente, usar label `needs-product-validation` ou uma etapa explícita de validação, e não declarar aceite de produto.

**Automação sugerida:** associar o PR à issue com `Closes #...` apenas quando a política de fechamento no merge corresponder ao processo; atualizações de status podem ser automáticas, mas devem ser auditadas, sobretudo quando o deploy ou aceite ocorrer depois do merge. Não pressupor que o GitHub Projects execute todos os movimentos sem configuração.

## 8. Regras de capacidade, WIP e priorização

- **Limite inicial proposto:** até **1 issue ativa por aluno**; máximo aproximado de **3–4 issues em desenvolvimento simultâneo** para o squad; o mentor pode reduzir esse limite conforme a fila de reviews.
- Issues em `In Review` continuam consumindo atenção; priorizar destravar PRs abertos antes de puxar novos itens.
- Em caso de capacidade insuficiente, **reduzir escopo** e não suprimir critérios essenciais, testes, CI, review ou consentimentos necessários.
- Estimativas S/M/L expressam risco e esforço relativo, não contratos de horas; recalibrar após inspeção do código e stack.
- Prioridade significa importância relativa para o produto. `P1` **não** equivale a promessa de execução no piloto.
- Selecionar trabalho com base em **valor, prontidão, dependências, risco, capacidade de supervisão e objetivo pedagógico**; não apenas na atratividade da feature.
- Decompor itens M/L em partes demonstráveis e tecnicamente verificáveis, evitando “microissues” sem aprendizado nem valor.

**Regra de segurança:** nunca escolher para tarefa inicial uma alteração que exija credenciais produtivas, acesso irrestrito a dados pessoais ou bypass de revisão.

## 9. Rituais e comunicação

As durações abaixo são **referências do Guia Mestre**, ajustáveis conforme calendário e realidade da equipe. O piloto é remoto e privilegia comunicação assíncrona.

| Ritual | Quando e duração inicial | Preparação | Condução e saída |
|---|---|---|---|
| **Onboarding** | Semana 1; ~45 min | README, acessos mínimos, checklist e issue simples | Mentor explica produto, fluxo e segurança; aluno executa aplicação/testes e identifica primeira issue. Saída: checklist e impedimentos |
| **Refinamento** | Antes de cada seleção; assíncrono ou bloco curto | PB, evidências e dúvidas do domínio | Mentor + organizador quando necessário esclarecem CA, riscos e dependências. Saída: issues Ready ou questões abertas |
| **Sprint/Iteration Planning** | Início de cada iteração; ~30 min | Capacidade e issues Ready | Definir objetivo, seleção limitada, responsáveis e riscos. Saída: iteração configurada no Project |
| **Daily assíncrona** | Exemplo: 3 vezes/semana; textual breve | Estado das issues/PRs | Cada aluno registra feito, próximo passo e impedimento. Saída: board atualizado e bloqueios identificados |
| **Code Review** | Assíncrono por PR; janelas do mentor a definir | PR descritivo e checks | Revisar comportamento, segurança, testes e legibilidade. Saída: aprovado ou mudanças solicitadas |
| **Sprint Review** | Fim de cada iteração; ~30 min | Ambiente verificável, CA e evidências | Mostrar mudanças reais; registrar avaliação técnica e feedback de produto quando disponível |
| **Retrospectiva** | Semana 4; ~20 min | Observações do fluxo | Identificar o que funcionou, fricções, ações de melhoria e responsáveis |
| **Handover/release** | Semana 4, com preparação prévia | PRs, changelog, pendências e runbook | Documentar versão, limites, riscos, próximos passos e destinatários |

**Comunicação mínima por issue:** (1) assumir atividade; (2) comunicar dúvida/impedimento sem esperar cerimônia; (3) sinalizar PR para revisão; (4) registrar resultado/pendências. Escolher apenas **um canal** complementar ao GitHub (Teams/Discord/Meet etc.) e guardar decisões duradouras no repositório/issue, não apenas no chat.

### Exemplo de atualização assíncrona

```text
Issue: PB-102 (#número real quando existir)
Concluído: analisei os componentes de listagem e escrevi o teste de filtro.
Próximo passo: implementar busca por título e autor.
Impedimento: preciso confirmar se a busca ignora acentos.
PR: ainda não aberto.
```

## 10. DoR, DoD e duas camadas de aceite

### Definition of Ready (DoR) — antes de mover para Ready

- [ ] Necessidade/resultado esperado claros; vínculo com PB/EP quando houver.
- [ ] Critérios de aceite objetivos, testáveis e sem contradição com decisões aprovadas.
- [ ] Escopo pequeno, com dependências e dados de exemplo disponíveis.
- [ ] Comportamento de permissão, privacidade e estados de erro definido quando aplicável.
- [ ] Riscos e pontos abertos identificados; nenhum bloqueio de produto indevidamente atribuído ao aluno.
- [ ] Mentor entende como revisar e existe responsável pela validação.
- [ ] Tamanho estimado após reconhecimento do código; se L, decomposição ou spike.

### Definition of Done (DoD) — antes de Done

- [ ] Critérios de aceite demonstrados e documentados na issue/PR.
- [ ] Testes pertinentes executados; CI obrigatória aprovada.
- [ ] Revisão humana realizada; feedback resolvido; regras de branch/merge cumpridas.
- [ ] Sem secrets, dados pessoais de teste reais ou mudanças não autorizadas de permissão.
- [ ] Fluxos afetados verificados quanto a acessibilidade, responsividade e falhas, conforme escopo.
- [ ] Documentação/ADR ajustados quando a mudança altera decisões ou operação.
- [ ] Uso de IA declarado conforme política; o autor consegue explicar e defender o código.
- [ ] Merge e verificação em ambiente apropriado registrados; vínculos issue–PR–release atualizados.
- [ ] Aceite funcional do organizador coletado **quando necessário**, ou pendência registrada explicitamente sem afirmar aceite.

**Dois aceites:** (1) **técnico**: revisão, testes e integração autorizados pelo mentor; (2) **de produto**: o representante do clube confirma que a funcionalidade atende à necessidade e às regras definidas. Não tratar checks verdes como substituto do segundo. Para P0, adicionar validação de fluxo mínimo ponta a ponta, publicação, operação e snapshot estável.

## 11. Convenções de branches, commits, PR e reviews

### Branches (proposta)

- Principal estável: `main` (nome final depende da configuração).
- Mudanças: `feat/pb-102-busca-livros`, `fix/pb-109-descricao-curta`, `docs/ed-002-onboarding`.
- Abrir branch a partir da versão de referência acordada e evitar trabalho diretamente em `main`.
- Commits pequenos e compreensíveis; padrão Conventional Commits é **opcional**, sujeito à decisão do projeto.
- Preferir **1 PR por mudança coerente**, com descrição e revisão viáveis; exceções para dependências explícitas.

### Regras mínimas para PR

1. Título claro com ID da issue quando houver.
2. Descrição do problema e da solução; o que ficou fora.
3. Referência à issue (`Refs #123`, ou `Closes #123` se o encerramento automático for apropriado).
4. Lista de critérios de aceite e evidências de teste (comandos/resultado; screenshots quando úteis).
5. Riscos de segurança, migração, deploy, regressão e rollback quando aplicável.
6. Declaração de uso de IA e como o código foi verificado.
7. Solicitação de revisão de pessoa habilitada; não fazer autoaprovação como substituta.

**Review observa:** correção funcional, limites do escopo, domínio Livro × Ciclo × Encontro, segurança/autorização, dados públicos/privados, testes, acessibilidade no fluxo afetado, legibilidade e efeitos colaterais. Comentários devem ser específicos e educativos. O aluno deve responder, corrigir e, se discordar, justificar tecnicamente.

**Política proposta para produção:** checks obrigatórios e aprovação humana antes de merge; deploy de produção somente por responsável autorizado; ambientes, backups, migrations e rollback definidos na etapa de arquitetura. Permissões concretas de GitHub e rulesets dependem dos recursos da organização.

## 12. Template de Issue — história de usuário

```md
# PB-102 — Buscar livros por título/autor

Tipo: História de usuário
Épico: EP-02 — Catálogo bibliográfico
Trilha: Alunos | Prioridade: P1 | Tamanho inicial: S/M
Estado inicial: Backlog (mover para Ready apenas após DoR)

## Contexto e valor
O visitante precisa encontrar um livro no catálogo sem percorrer toda a lista.

## História
Como visitante, quero filtrar o catálogo por título ou autor para localizar uma obra.

## Critérios de aceite
- [ ] A busca considera título e autor.
- [ ] Uma consulta sem resultados exibe mensagem apropriada.
- [ ] Limpar a busca restaura a listagem.
- [ ] A consulta não expõe informações privadas.
- [ ] Existem testes para correspondência e ausência de resultados.

## Questões de refinamento
- Busca será local ou no servidor? Depende do volume de dados.
- Qual comportamento para acentos, maiúsculas e espaços? Definir antes de Ready.

## Dependências
PB-002 — Consultar catálogo e detalhes.

## Orientações de teste
Usar dados sintéticos; incluir título que coincide e autor que coincide.

## Evidências e vínculos
PR: (preencher)
Validação: (preencher)
```

**Importante:** o exemplo reproduz PB-102 e torna explícitas perguntas adicionais; a busca ainda não está aprovada como issue pronta.

## 13. Template de Issue — bug, tarefa técnica e spike

**Bug:** descrever ambiente/versão, passos mínimos para reproduzir, comportamento esperado × observado, impacto e evidências (sem dados sensíveis), critérios de correção, teste de regressão. Não criar bug fictício para cumprir cronograma (`PB-109`).

**Chore/tarefa técnica:** registrar necessidade de engenharia, risco que reduz, resultado observável, testes e dependências. Não forçar fórmula “Como usuário...” quando não houver usuário direto.

**Spike (investigação com tempo limitado):** formular pergunta específica, saídas esperadas (ex.: alternativas e recomendação), restrição de escopo/tempo e decisão pendente. Spike não equivale a licença para alterar arquitetura sem ADR.

### Exemplo de spike (hipotético, não cadastrado)

```md
Título: SPIKE — avaliar estratégias de filtragem do catálogo
Pergunta: para o volume de dados esperado, filtragem no cliente é suficiente?
Saída: comparação curta de opções, restrições e recomendação ao mentor.
Fora de escopo: implementar a feature inteira ou mudar o banco.
Decisão: registrar na issue; ADR apenas se houver decisão arquitetural relevante.
```

## 14. Template de Pull Request (exemplo)

```md
## Issue vinculada
Refs #<número-da-issue>

## O que mudou e por quê
[Resumo objetivo da alteração]

## Critérios de aceite / evidências
- [ ] [Critério 1 e como verificar]
- [ ] [Critério 2 e como verificar]

## Testes
Comandos executados:
Resultado:
Testes manuais/visualizações:

## Riscos, segurança e operação
[Permissões, dados, migrações, efeitos colaterais, deploy, ou "não se aplica" com razão]

## Uso de IA
[Não usei / Usei para ...]
[O que revisei, testei e adaptei pessoalmente]

## Pendências
[Itens conhecidos e limitações]
```

**Nota:** não usar literalmente `#<número-da-issue>` em um PR real; substituir pelo número gerado pelo GitHub. O template é exemplo de conteúdo, não arquivo de configuração já publicado.

## 15. Política de IA, segurança e dados

**Direção aprovada:** IA pode auxiliar análise, testes, implementação e revisão, mas toda alteração exige compreensão, verificação e responsabilidade humana. Recomendações operacionais:

- Declarar de forma sucinta o uso relevante da IA no PR: finalidade, trechos afetados, checagens e correções próprias.
- Testar o comportamento, examinar código e dependências; não aceitar resposta do assistente como evidência suficiente.
- Nunca enviar tokens, secrets, dados pessoais reais ou conteúdo privado do clube a ferramentas sem autorização e avaliação de tratamento de dados.
- Não conceder a agentes privilégios de escrita/produção sem controle humano; integrações MCP são opcionais.
- Usar dados fictícios ou anonimizados em exemplos educacionais; não publicar conversas privadas, registros pessoais ou avaliações identificadas.
- Validar licenças, direitos de capas/sinopses e termos de APIs se houver integração bibliográfica; integração está fora da base inicialmente.
- Se houver coleta de evidências para pesquisa, definir procedimentos éticos, base aplicável, consentimento quando necessário e armazenamento restrito antes da coleta.

**Informações públicas/privadas de encontros, identidade de membros e regras de moderação são questões em aberto**; não preencher essas lacunas com permissões presumidas.

## 16. Planejamento do piloto de quatro semanas

**Capacidade nominal:** 3–4 alunos × 3–4 horas/semana × 4 semanas = **36–64 horas-aluno brutas**. Inclui onboarding, análise, comunicação, testes, revisão e documentação; **não é** uma promessa de horas líquidas de programação. O tempo disponível do mentor é condição separada de viabilidade.

| Momento | Foco | Pool de backlog (candidato) | Evidência mínima |
|---|---|---|---|
| **Pré-piloto** | Preparar P0, CI, deploy, GitHub, ED-001...ED-005 e snapshot | PB-001...PB-009, PB-014...PB-016 conforme corte aprovado | Base utilizável, testada, documentada; issues Ready disponíveis |
| **Semana 1** | Onboarding, leitura do código e primeiro PR simples | PB-101 ou tarefa documental/teste S | Ambiente executado, 1 PR revisado, relato breve |
| **Semana 2 — Sprint 1** | Modificação funcional pequena | PB-102, PB-103 ou PB-105 (refinar e selecionar) | Mudança testada, revisada e demonstrável |
| **Semana 3 — Sprint 2** | Maior autonomia e qualidade | PB-104, PB-106, PB-107 ou PB-108 | PR, testes e resposta a feedback |
| **Semana 4** | Sustentação, release, documentação e reflexão | PB-109 somente se existir bug real; pendências S | Handover, registro de release, retrospectiva e avaliação |

**O plano é uma reserva de opções, não compromisso fechado por aluno.** Qualquer tarefa que ultrapasse a capacidade deve ser decomposta, adiada ou devolvida ao backlog. `PB-110`/votação não são objetivos obrigatórios do piloto.

## 17. Demonstração didática ponta a ponta

Manter ao menos **uma feature/alteração de referência auditável**: issue refinada → branch → implementação → teste → PR → comentários reais ou exemplares rotulados como tal → correção → CI → merge → publicação/validação → lições aprendidas.

**Sugestão inicial:** usar uma melhoria pequena em fluxo já existente (por exemplo, `PB-105 — Melhorar ordenação e exibição da agenda`) na **edição demonstrativa**, ou outra issue escolhida após o código-base existir. A **agenda mínima** (PB-008/PB-009) permanece P0; não retirar do software-base apenas para gerar uma feature didática. Se for produzida uma simulação de review, identificá-la explicitamente como simulação; não apresentá-la como histórico real.

Dois níveis de material:

- **Manual do aluno:** contexto, o que fazer, critérios, fluxo, perguntas de revisão, sem solução pronta completa.
- **Manual do professor:** contexto de facilitação, possíveis implementações, erros esperados, guia de review, evidências e avaliação.

## 18. Releases, snapshots e replicação

Os nomes `edu/base-auth`, `edu/catalogo-v1`, `edu/agenda-v1`, `edu/votacao-v1` e `edu/resenhas-v1` do Guia Mestre são **exemplos de possíveis estágios**, não tags existentes nem compromissos de implementação.

Para publicar um snapshot educacional:

1. Selecionar commit estável e verificável; confirmar testes e ausência de segredos/dados reais.
2. Criar tag/release com estado funcional explícito: recursos presentes e ausentes, limitações e pré-requisitos.
3. Registrar instalação, versão de runtime, variáveis de ambiente de exemplo, migrations, seed e instruções de execução (conforme stack escolhida).
4. Disponibilizar instruções para copiar **uma versão específica** de modo independente, inclusive sem depender do repositório oficial no futuro.
5. Incluir contexto didático, questões e issues candidatas adequadas ao snapshot.
6. Testar replicação por pessoa que não preparou o ambiente e anotar falhas.
7. Não reescrever arbitrariamente tags educacionais já publicadas; criar nova versão quando necessário.

Um repositório criado a partir de template normalmente não permite ao usuário selecionar arbitrariamente uma tag histórica pelo fluxo de template; documentar cópia/checkout da tag e a criação de novo repositório, ou oferecer branches-template quando isso for validado.

## 19. Medidas de acompanhamento e avaliação exploratória

| Dimensão | Evidências úteis | Interpretação cuidadosa |
|---|---|---|
| Aprendizagem | Explicação oral/escrita do código, decisões e testes | Qualidade da argumentação importa mais que volume de código |
| Colaboração | Comunicação, impedimentos e respostas a reviews | Considerar condições reais de disponibilidade |
| Qualidade | CA demonstrados, resultados de CI, regressões e retrabalho | Não reduzir a avaliação a checks verdes |
| Operação | Tempo de mentor, lead time de issues, fila de PR, bloqueios | Amostra pequena: interpretar qualitativamente |
| Valor para o clube | Feedback do organizador e uso real dos fluxos | Confirmar necessidade, não presumir adoção |
| Replicabilidade | Teste do README/snapshot por outro docente | Registrar dificuldades e retrabalhos |

**Limite científico:** o piloto é exploratório e pequeno, não sustenta conclusão causal sobre impacto de IA ou superioridade do método. Instrumentos de pesquisa e cuidados de privacidade/ética devem ser definidos antes da coleta.

## 20. Glossário essencial — Scrum, Kanban, GitHub e engenharia

| Termo | Explicação prática neste projeto |
|---|---|
| **Ágil / Agile** | Abordagem iterativa que adapta o trabalho a feedback e evidências, sem significar ausência de planejamento |
| **Scrum** | Framework com papéis, artefatos e eventos definidos; aqui inspira planejamento, revisão e retrospectiva, sem alegar adoção integral |
| **Kanban** | Estratégia de gestão de fluxo com visualização, controle de WIP e melhoria contínua |
| **Scrumban** | Combinação pragmática de cadência e gestão de fluxo para equipes pequenas |
| **Product Backlog** | Lista ordenada e evolutiva de necessidades, mudanças e descobertas do produto |
| **Épico / Epic** | Objetivo amplo agrupador de histórias/entregas |
| **Feature** | Capacidade observável que entrega valor ao usuário |
| **História de usuário** | Declaração sucinta de necessidade na perspectiva de um ator, com benefício esperado |
| **Critério de aceite** | Condição verificável de que uma demanda foi atendida |
| **Dado/Quando/Então (Gherkin)** | Forma de especificar cenário: contexto, ação e resultado esperado |
| **Sprint / iteração** | Janela de trabalho focada; nesta proposta, usada de modo leve nas semanas 2–3 |
| **Sprint Planning** | Momento de decidir objetivo, capacidade e itens elegíveis da iteração |
| **Daily** | Inspeção frequente de progresso e bloqueios; aqui preferencialmente assíncrona |
| **Sprint Review** | Demonstração e discussão de resultados para obter feedback |
| **Retrospectiva** | Revisão do modo de trabalhar e escolha de melhorias de processo |
| **Refinamento** | Esclarecimento e divisão de demandas antes de iniciá-las |
| **Board** | Quadro visual de itens por estado de trabalho |
| **WIP (Work in Progress)** | Quantidade de trabalho iniciado e ainda não concluído; limitar reduz dispersão |
| **Fluxo puxado / Pull** | Iniciar novo trabalho quando há capacidade, não empurrar todas as tarefas para execução |
| **Lead time** | Tempo entre dois marcos definidos do fluxo, por exemplo de item pronto até conclusão; declarar quais marcos foram usados |
| **Cycle time** | Tempo entre início efetivo do trabalho e conclusão, conforme definição local |
| **DoR (Definition of Ready)** | Acordo local sobre informações mínimas para iniciar uma issue; não é compromisso obrigatório do Scrum |
| **DoD (Definition of Done)** | Acordo de qualidade e completude da entrega; difere do aceite de produto específico |
| **Issue** | Registro executável de história, bug, tarefa, documentação ou investigação no GitHub |
| **GitHub Projects** | Visão e acompanhamento estruturados de issues/PRs e itens de planejamento |
| **Branch** | Linha de desenvolvimento isolada para uma alteração |
| **Commit** | Registro versionado de mudanças no repositório |
| **Pull Request (PR)** | Proposta de integrar código, com diff, discussão e checks |
| **Code Review** | Inspeção crítica por outro desenvolvedor, com feedback e aprovação/mudanças solicitadas |
| **CI (integração contínua)** | Execução automatizada de checks/testes sobre mudanças integráveis |
| **CD (entrega/publicação contínua)** | Automação de preparação/entrega ou deploy; grau de automação a definir |
| **Merge** | Integração de uma branch a outra conforme política |
| **Deploy** | Publicação de uma versão em ambiente executável |
| **Release** | Versão comunicada/identificada do produto, com escopo e limites |
| **Snapshot educacional** | Estado estável e documentado do software para replicar uma edição |
| **ADR (Architecture Decision Record)** | Registro breve de contexto, decisão, alternativas e consequências arquiteturais |
| **Spike** | Investigação limitada para reduzir incerteza antes de implementar |
| **Handover** | Transferência explícita de conhecimento, pendências e responsabilidade |
| **Stakeholder** | Pessoa impactada pelo produto, com interesse e contribuições relevantes; aqui, destaque para organizador e leitores |
| **MVP** | Menor conjunto funcional capaz de validar valor e operar o fluxo essencial, não protótipo necessariamente descartável |

## 21. Checklist de prontidão para iniciar o piloto

### Produto e infraestrutura
- [ ] Organizador revisou regras fundamentais, publicação de dados e mínimo de valor.
- [ ] Corte P0/P1/P2 aprovado ou ajustado e registrado.
- [ ] Stack, custos, ambientes, permissões e licenças decididos e documentados.
- [ ] P0 essencial concluído: catálogo, ciclo, agenda, histórico, autenticação, testes/CI e operação reproduzível.
- [ ] Testes cobrem releitura sem duplicação, autorização e estados vazios.
- [ ] Aplicação publicada em ambiente adequado; credenciais e backup/rollback protegidos.

### Processo e kit didático
- [ ] Repositórios criados e política de contribuição publicada.
- [ ] Project, templates, controles de branch e CI configurados e testados.
- [ ] ED-001...ED-005 concluídos: templates, onboarding, DoR/DoD, snapshot, exemplo ponta a ponta.
- [ ] Ao menos uma issue P1 pequena em `Ready` para cada ingresso inicial, sem impor meta quantitativa artificial.
- [ ] Agenda de acompanhamento, canais e janelas de Code Review acordados.
- [ ] Mentor e organizador conhecem seus papéis e a regra de aceite funcional.
- [ ] Procedimentos éticos/de privacidade definidos para eventual pesquisa com participantes.

Se itens críticos não estiverem cumpridos, **adiar o piloto ou reduzir a proposta operacional**, em vez de transferir os riscos estruturais aos alunos.

## 22. Pendências, decisões e próximos passos

| ID | Decisão/questão | Estado |
|---|---|---|
| PT-001 | Scrumban com quadro simples, WIP e rituais leves | **R — proposta**; consistente com Guia Mestre |
| PT-002 | 1 issue ativa por aluno e fila curta de review | **R — proposta operacional** |
| PT-003 | GitHub Issues/Projects como fonte operacional e Markdown como registro de planejamento | **R — proposta**, alinhada ao uso de GitHub aprovado |
| PT-004 | Critérios DoR/DoD e templates apresentados nas seções 10–14 | **R — proposta**, validar com mentor |
| PT-005 | P0 antes do piloto; P1 incremental; P2 condicional; ED separado | **Direção aprovada**; corte exato **R pendente** |
| PT-006 | Uma leitura principal ativa; dados privados, identidade de membros e votação | **H — validar com organizador** |
| PT-007 | Stack, hospedagem, custos, licenças, rulesets, CI/CD e permissões | **Pendente de decisões técnicas/ADRs** |
| PT-008 | Ritmo exato, horários e janelas de review | **H operacional — validar capacidade do mentor/alunos** |
| PT-009 | Feature de agenda como demonstração | **Exemplo histórico, não obrigação**; sugerida melhoria incremental |

**Sequência recomendada:** (1) validar produto com organizador; (2) aprovar recorte do backlog e este processo; (3) decidir arquitetura, infraestrutura e custos via ADRs; (4) criar GitHub e migrar **apenas issues refinadas**; (5) implementar/validar P0; (6) concluir kit inicial e snapshot; (7) executar piloto; (8) registrar aprendizados, revisar releases e atualizar documentos mestres.

---

**Controle de alterações:** v1.0 criada a partir dos quatro documentos da Fábrica de Software Virtual disponíveis em 11/11/2026. Nenhum repositório, issue, Project, pipeline, deploy ou tag foi criado por este documento. Nenhuma proposta operacional altera automaticamente decisões aprovadas nos materiais de origem.
