# Fábrica de Software Virtual — Product Backlog do Clube do Livro

**Documento:** `03-product-backlog.md`  
**Versão:** 1.0 — proposta para refinamento  
**Data:** 11/11/2026  
**Etapa:** 2 — Produto e backlog  
**Referências:** `FABRICA_SOFTWARE_GUIA_MESTRE.md` v1.0; `01-visao-produto.md` v1.0; `02-benchmarking.md` v1.0.

## 1. Objetivo e estado das decisões

Organizar demandas do produto em épicos, histórias e critérios de aceite, distinguindo **preparação do software-base**, **trabalho pedagógico dos alunos** e **evoluções condicionais**. Este é um **backlog candidato**, não uma lista de entregas aprovadas pelo professor organizador nem um compromisso de execução no piloto.

**Decisões preservadas (D):** produto centrado em um clube real; foco em catálogo, leitura coletiva, encontros e histórico; livro diferente de ciclo de leitura; primeira implantação em um clube; software preexistente no ingresso; GitHub como ambiente central; software e kit didático abertos; piloto de quatro semanas, 3–4 alunos, 3–4 horas semanais estimadas por aluno; IA sob responsabilidade humana. A escolha final de stack, hospedagem, permissões e licenças permanece aberta.

**Recomendações deste documento (R):** corte P0/P1/P2, tamanho das issues, sequência e distribuição de trabalho. **Hipóteses (H):** uma leitura principal ativa, dados de encontros públicos/privados, necessidade de votação, contas de membros e importação de metadados. **A validar (V):** regras reais e prioridades com o organizador.

## 2. Como ler e gerenciar o backlog

- **Épico:** conjunto amplo de capacidades relacionadas, normalmente dividido em várias histórias.
- **Feature:** capacidade de produto que entrega valor observável; pode envolver mais de uma história.
- **História de usuário:** necessidade expressa como “Como [papel], quero [ação], para [benefício]”.
- **Critérios de aceite (CA):** condições objetivas que permitem validar a história, preferencialmente em formato Dado/Quando/Então.
- **Issue:** unidade operacional rastreada no GitHub; pode ser uma história pequena, bug, teste, documentação ou tarefa técnica. Nem toda issue é uma história de usuário.
- **P0:** necessário para que o software-base seja utilizável **antes** do piloto; execução por mentor/equipe preparatória.
- **P1:** candidatos prioritários para issues dos alunos, sem obrigação de concluir todos no piloto.
- **P2:** oportunidades posteriores ou condicionadas a descoberta.
- **Fora de escopo:** não planejar na primeira versão.
- **Tamanho S/M/L:** esforço relativo e risco, **não** horas garantidas. S = mudança localizada; M = mudança em poucas camadas com testes; L = exige decomposição ou descoberta. Estimar novamente após escolha de stack e inspeção do código.

**Campos recomendados no GitHub Projects:** ID, título, tipo (`story`, `bug`, `chore`, `docs`, `spike`), épico, prioridade, trilha (`base`, `alunos`, `futuro`, `didatico`), status (`Backlog`, `Ready`, `In progress`, `In review`, `Done`), tamanho, responsável, dependências, sprint/iteração, evidência de validação e link de PR. Usar labels padronizadas e evitar campos redundantes. Este Markdown é o planejamento inicial; após criação das issues, o GitHub passa a registrar o estado operacional, com decisões relevantes consolidadas nos documentos versionados.

## 3. Mapa de épicos

| Épico | Resultado esperado | Software-base P0 | Alunos P1 | Futuro P2 |
|---|---|---|---|---|
| EP-01 — Apresentação pública | Visitante entende o clube | Página inicial e navegação | Estados vazios e acessibilidade | Conteúdo editorial avançado |
| EP-02 — Catálogo bibliográfico | Livros reutilizáveis e editáveis | Cadastro, edição e consulta manual | Busca/filtro simples e validações | Integração com APIs |
| EP-03 — Ciclos de leitura | Livro atual e histórico consistentes | Criar, editar, encerrar e consultar ciclos | Filtros/melhorias no histórico | Ciclos paralelos |
| EP-04 — Agenda de encontros | Programação consultável e administrável | CRUD mínimo e exibição pública segura | Ordenação, filtros e usabilidade | RSVP, presença, lembretes |
| EP-05 — Acesso e segurança | Administração protegida | Login administrativo e autorização | Testes de autorização e acessibilidade | Contas e papéis de membros |
| EP-06 — Participação comunitária | Escolha coletiva quando necessária | Nenhum requisito obrigatório | Sugestões simples, se validadas | Votação, comentários, resenhas |
| EP-07 — Qualidade e operação | Produto executável e sustentável | Testes, CI, deploy, README e dados de exemplo | Testes adicionais e correções | Observabilidade avançada |
| EP-08 — Experiência didática | Processo replicável | Kit, templates e snapshot inicial | PRs, reviews, retrospectiva e handover | Novos snapshots e edições |

## 4. Histórias P0 — software-base antes do ingresso

> **Responsável pela preparação:** mentor ou equipe técnica preparatória. **Condição de entrada dos alunos:** histórias P0 essenciais concluídas e verificadas; não transferir dependências críticas do produto aos trainees.

### EP-01 — Apresentação pública

**PB-001 — Consultar página do clube** · P0 · S/M  
**História:** Como visitante, quero acessar a apresentação do clube para entender sua proposta e localizar as leituras e os encontros.  
**CA:** (1) Dado acesso sem login, a página exibe identificação e descrição do clube; (2) há acesso identificável à leitura atual, agenda e histórico; (3) em tela estreita, o conteúdo continua navegável; (4) nenhum dado marcado como privado aparece na resposta pública.  
**Dependências:** conteúdo aprovado pelo organizador; definição dos campos públicos.

### EP-02 — Catálogo

**PB-002 — Consultar catálogo e detalhes** · P0 · M  
**História:** Como visitante, quero consultar os livros registrados para conhecer as obras do clube.  
**CA:** (1) A listagem mostra título e autor quando cadastrados; (2) o detalhe apresenta os campos bibliográficos disponíveis sem inventar metadados; (3) catálogo vazio exibe mensagem adequada; (4) dados não autorizados não são publicados.  
**Dependências:** modelo de livro.

**PB-003 — Cadastrar e editar livro manualmente** · P0 · M  
**História:** Como organizador autenticado, quero registrar e corrigir dados bibliográficos para manter o catálogo.  
**CA:** (1) título é obrigatório; demais campos e regras são documentados; (2) campos inválidos apresentam feedback; (3) alterações persistem; (4) visitantes não podem criar ou editar livros; (5) correções não apagam vínculos com ciclos existentes.  
**Dependências:** PB-014, modelo de livro. **Nota:** política de duplicidade/ISBN a refinar.

### EP-03 — Leitura coletiva

**PB-004 — Criar e atualizar ciclo** · P0 · M  
**História:** Como organizador, quero associar um livro a um ciclo com período e estado para organizar a leitura coletiva.  
**CA:** (1) ciclo referencia livro existente sem duplicá-lo; (2) período/estado seguem regras documentadas; (3) somente organizador autorizado altera ciclos; (4) edição mantém integridade referencial; (5) comportamento para ciclos simultâneos é explicitado antes da implementação.  
**Dependências:** PB-003, PB-014; **H:** uma leitura principal ativa.

**PB-005 — Exibir leitura atual** · P0 · S/M  
**História:** Como visitante, quero identificar a leitura coletiva atual para acompanhar o clube.  
**CA:** (1) quando há ciclo atual, exibe livro e informações públicas do ciclo; (2) quando não há, exibe estado vazio claro; (3) nunca mostra um ciclo encerrado como atual; (4) se houver múltiplos ciclos ativos por exceção, comportamento deve seguir regra validada.  
**Dependências:** PB-004.

**PB-006 — Encerrar ciclo e preservar histórico** · P0 · M  
**História:** Como organizador, quero encerrar um ciclo sem perder sua memória para manter o registro das leituras.  
**CA:** (1) encerramento atualiza estado do ciclo; (2) ciclo encerrado permanece consultável com livro, período e encontros vinculados; (3) o mesmo livro pode ser usado em novo ciclo com outro identificador; (4) não é necessário duplicar o cadastro bibliográfico.  
**Dependências:** PB-004, PB-008.

**PB-007 — Consultar histórico essencial** · P0 · S/M  
**História:** Como visitante, quero consultar ciclos encerrados para conhecer o percurso do clube.  
**CA:** (1) lista somente ciclos elegíveis à publicação; (2) identifica livro e período; (3) permite distinguir releituras da mesma obra; (4) ausência de histórico é tratada sem erro.  
**Dependências:** PB-006.

### EP-04 — Agenda

**PB-008 — Administrar encontros** · P0 · M  
**História:** Como organizador, quero cadastrar e atualizar encontros para manter a programação.  
**CA:** (1) data e horário são obrigatórios, com fuso explicitado; (2) modalidade presencial/virtual é registrada; (3) vínculo com ciclo é permitido e a obrigatoriedade deve ser validada; (4) operações de escrita exigem autorização; (5) regras para encontros passados, cancelamento e exclusão são documentadas antes do desenvolvimento.  
**Dependências:** PB-004, PB-014; **V:** campos públicos e privados.

**PB-009 — Consultar próximos encontros** · P0 · S/M  
**História:** Como visitante, quero ver os próximos encontros públicos para planejar minha participação.  
**CA:** (1) exibe data e horário com fuso coerente; (2) ordena cronologicamente os encontros futuros; (3) não expõe informações de acesso classificadas como privadas; (4) mostra estado vazio quando não há encontros futuros.  
**Dependências:** PB-008; definição de privacidade.

### EP-05 — Segurança

**PB-014 — Autenticação e autorização administrativa mínima** · P0 · M/L  
**História:** Como organizador, quero acessar uma área protegida para que apenas pessoas autorizadas alterem o clube.  
**CA:** (1) operações de escrita exigem autenticação e autorização verificadas no servidor; (2) visitante não consegue alterar dados mesmo chamando diretamente a API; (3) falha de autenticação não revela segredos; (4) credenciais não são versionadas; (5) há procedimento documentado de provisionamento/revogação de acesso.  
**Dependências:** decisão arquitetural e provedor de autenticação. **Corte:** simplificar acesso; não implementar contas de membros no P0.

### EP-07 — Engenharia e operação

**PB-015 — Testes e integração contínua** · P0 · M  
**Tipo:** tarefa técnica habilitadora.  
**CA:** (1) comando documentado executa testes; (2) pipeline verifica build e testes em PR; (3) falha relevante impede merge segundo a política definida; (4) fluxos de livro, ciclo, encontro e autorização têm cobertura de cenários críticos; (5) segredos não aparecem em logs.

**PB-016 — Publicação e operação reproduzível** · P0 · M/L  
**Tipo:** tarefa técnica habilitadora.  
**CA:** (1) aplicação acessível em ambiente publicado; (2) README permite instalar e executar com pré-requisitos e variáveis de exemplo; (3) há dados demonstrativos não pessoais; (4) procedimentos básicos de migração, backup/recuperação e rollback são documentados; (5) acesso a produção é restrito.  
**Dependências:** ADRs de arquitetura, infraestrutura e custo.

## 5. Histórias P1 — candidatas a trabalho dos alunos

**Estas histórias são um estoque de opções**, não uma sprint fechada. Atribuir apenas após validar valor, decompor e estimar; uma história M pode ser dividida em duas ou mais issues S. Sempre que possível, trabalhar em melhorias de funcionalidades já existentes.

### EP-01 / EP-02 — Usabilidade e catálogo

**PB-101 — Melhorar estados vazios e mensagens** · P1 · S · Boa primeira issue  
**História:** Como visitante, quero entender quando não há leitura, encontros ou livros cadastrados para não confundir ausência de dados com erro.  
**CA:** (1) mensagens específicas nos três cenários; (2) nenhuma data ou livro fictício é exibido como real; (3) comportamento responsivo e teste de renderização; (4) sem regressão nos estados com dados.  
**Dependências:** PB-002, PB-005, PB-009.

**PB-102 — Buscar livros por título/autor** · P1 · S/M  
**História:** Como visitante, quero filtrar o catálogo por título ou autor para localizar uma obra.  
**CA:** (1) busca considera título e autor; (2) termo sem resultados exibe estado apropriado; (3) limpar busca restaura listagem; (4) consulta não expõe campos privados; (5) teste cobre correspondência e ausência.  
**Dependências:** PB-002. **Nota:** decidir volume de dados e estratégia local/servidor no refinamento.

**PB-103 — Validar e melhorar formulário de livro** · P1 · S  
**História:** Como organizador, quero feedback claro ao preencher dados inválidos para corrigir erros antes de salvar.  
**CA:** (1) erros de campos obrigatórios aparecem próximos ao campo; (2) não duplica mensagens indevidamente; (3) validação no servidor permanece obrigatória; (4) teste cobre envio inválido e correção.  
**Dependências:** PB-003.

### EP-03 / EP-04 — Histórico e agenda

**PB-104 — Filtrar histórico por ano** · P1 · S  
**História:** Como visitante, quero filtrar ciclos encerrados por ano para encontrar leituras anteriores.  
**CA:** (1) anos disponíveis derivam dos dados; (2) filtro preserva ciclos distintos do mesmo livro; (3) limpar filtro recupera o histórico; (4) sem resultados mostra mensagem; (5) teste cobre releitura.  
**Dependências:** PB-007; regra sobre ano do ciclo a definir.

**PB-105 — Melhorar ordenação e exibição da agenda** · P1 · S  
**História:** Como visitante, quero visualizar encontros em ordem cronológica e com data legível para compreender a programação.  
**CA:** (1) ordenação é estável por data/hora; (2) fuso horário é respeitado; (3) datas passadas não aparecem como próximas; (4) testes cobrem virada de dia e ausência de eventos.  
**Dependências:** PB-009.

**PB-106 — Melhorar validações do encontro** · P1 · S/M  
**História:** Como organizador, quero mensagens claras para datas e horários inválidos para evitar publicar programação incorreta.  
**CA:** (1) campos obrigatórios e formatos são verificados; (2) regra de data passada segue decisão do organizador; (3) falhas do servidor não deixam impressão falsa de sucesso; (4) testes verificam cenários válidos e inválidos.  
**Dependências:** PB-008; regra de datas passadas.

### EP-05 / EP-07 — Qualidade

**PB-107 — Adicionar testes de autorização** · P1 · S  
**Tipo:** tarefa técnica.  
**CA:** (1) casos negativos para criação/edição de livro, ciclo e encontro; (2) testes verificam negação efetiva no servidor; (3) pipeline executa testes; (4) nenhuma permissão é ampliada para facilitar o teste.  
**Dependências:** PB-014, PB-015.

**PB-108 — Revisar acessibilidade de um fluxo** · P1 · S/M  
**História:** Como pessoa que navega por teclado, quero operar a busca ou a agenda sem barreiras para consultar o clube.  
**CA:** (1) fluxo escolhido é navegável por teclado; (2) controles têm nomes acessíveis; (3) foco visível e ordem lógica; (4) revisão manual e teste automatizado quando aplicável são registrados.  
**Dependências:** escolha do fluxo com o mentor.

**PB-109 — Corrigir bug reproduzível em homologação** · P1 · S  
**Tipo:** bug; **escopo só será definido após identificação real**.  
**CA:** (1) issue documenta passos, esperado e observado; (2) teste reproduz defeito antes da correção quando viável; (3) correção não quebra fluxo adjacente; (4) PR inclui evidência de verificação.  
**Nota:** não inventar bug para preencher a sprint.

### EP-06 — Participação (condicionada à descoberta)

**PB-110 — Registrar sugestão de livro** · P1 condicional · M/L  
**História:** Como participante habilitado, quero sugerir uma obra para consideração na próxima leitura.  
**CA candidatos:** (1) sugestão referencia livro existente ou segue fluxo de cadastro definido; (2) registro contém estado e autoria conforme política aprovada; (3) duplicidade e moderação seguem regras explícitas; (4) pessoas não autorizadas não podem criar sugestões; (5) listagem distingue sugestões de leituras efetivamente escolhidas.  
**Bloqueios:** definir identidade de participante, elegibilidade, publicação e moderação. **Não assumir que cabe no piloto.**

## 6. P2 — evolução condicional, sem compromisso de entrega

| ID | Épico | História/feature candidata | Critério para avançar | Principal dependência |
|---|---|---|---|---|
| PB-201 | EP-06 | Votação simples da próxima leitura | Organizador confirma processo de escolha e elegibilidade | Membros/identidade, opções, prazo e regra de desempate |
| PB-202 | EP-02 | Busca/importação por Open Library ou Google Books | Benefício supera digitação e dependência externa | Licenças, atribuição, limites, deduplicação e edição manual |
| PB-203 | EP-05 | Gestão de membros e papéis | Há ações restritas por membro ou conteúdo privado | Política de cadastro, convite e privacidade |
| PB-204 | EP-06 | Comentários vinculados ao ciclo | Clube deseja discussão na plataforma | Moderação, publicação, autoria e spoilers |
| PB-205 | EP-06 | Resenhas vinculadas a autor e livro | Demanda real por memória opinativa | Privacidade, moderação, vínculo opcional com ciclo |
| PB-206 | EP-04 | Confirmação de presença / lembretes | Logística atual gera problema relevante | Identidade, consentimento, notificações |
| PB-207 | EP-03 | Leituras paralelas | Clube realmente opera múltiplos ciclos simultâneos | Rever hipótese de leitura principal única |
| PB-208 | EP-07 | Observabilidade operacional adicional | Operação exige diagnóstico além do mínimo | Custos, privacidade e hospedagem |

**Fora do MVP:** chat em tempo real, vídeo integrado, feed social amplo, IA de recomendação, gamificação, estatísticas individuais sofisticadas, comércio de livros, distribuição de e-books protegidos, app nativo e multiclube completo. Não transformar esses itens em issues sem nova decisão de produto.

## 7. Backlog de habilitação didática — separado das features de produto

Estas são entregas da **Fábrica**, não funcionalidades para o leitor. Devem ser geridas no repositório `software-engineering-studio` ou como tarefas de governança do projeto, com vínculos para issues do software quando pertinente.

| ID | Entrega / responsável sugerido | Critério verificável | Momento |
|---|---|---|---|
| ED-001 | Templates de issue/PR e convenções — mentor | Templates incluem contexto, CA, testes, evidências, riscos e declaração de uso de IA | Antes do piloto |
| ED-002 | Guia de onboarding — mentor | Aluno consegue instalar, executar testes e localizar arquitetura/fluxo de PR | Antes do piloto |
| ED-003 | DoR, DoD e fluxo Scrumban — mentor | Regras publicadas e aplicáveis às issues e revisões | Antes do piloto |
| ED-004 | Snapshot educacional inicial — mentor | Tag estável, instruções de execução, limites funcionais e dados de exemplo | Antes do piloto |
| ED-005 | Feature de referência ponta a ponta — mentor | Exemplo auditável de issue → PR → review → CI → merge → validação; pode usar edição demonstrativa ou outra feature, sem retirar função crítica da base | Antes/durante preparação |
| ED-006 | Registro de aprendizagem e handover — alunos, mentor | Cada participante registra decisões, testes, feedback recebido, uso de IA e pendências | Durante piloto |
| ED-007 | Retrospectiva e avaliação exploratória — mentor/alunos | Registro de dificuldades, horas de supervisão, qualidade e percepção de aprendizagem; dados tratados eticamente | Semana 4 |
| ED-008 | Guia de replicação — mentor | Outro professor encontra instruções de cópia da versão educacional e operação da edição | Após validação do piloto |

**Observação:** exemplos de tags no Guia Mestre (`edu/base-auth`, `edu/catalogo-v1` etc.) são ilustrativos; não afirmar que já existem. A feature de agenda é uma candidata histórica para demonstração do fluxo, mas o corte aqui mantém a agenda essencial na base, como recomendado no benchmarking.

## 8. Sugestão de seleção para o piloto (não sprint comprometida)

Capacidade nominal: **3–4 alunos × 3–4 h/semana × 4 semanas = 36–64 horas-aluno brutas**, incluindo onboarding, comunicação, leitura de código, testes e revisões. **Não** converter integralmente esse total em horas de implementação. A disponibilidade do mentor é uma restrição independente.

| Semana | Objetivo didático | Pool candidato de issues | Evidência |
|---|---|---|---|
| 1 | Onboarding e primeiro PR de risco baixo | PB-101 ou ajuste documental/teste S | PR pequeno revisado e CI verde |
| 2 | Sprint 1: valor observável e testes | PB-102, PB-103 ou PB-105, após refinamento | Mudança publicada e validada |
| 3 | Sprint 2: autonomia e qualidade | PB-104, PB-106, PB-107 ou PB-108 | PR com testes, revisão e feedback |
| 4 | Sustentação, handover e retrospectiva | PB-109 somente se houver bug real; pendências pequenas | Release/validação, registro de aprendizado |

**Política de seleção:** priorizar 1 issue S por aluno de cada vez; limitar trabalho em progresso; manter issues reservas; reduzir escopo em vez de sacrificar review, testes e validação. Não prometer PB-110 nem PB-201 no piloto sem regras e capacidade. Um mesmo item pode atravessar semanas se a revisão exigir ajustes.

## 9. Definition of Ready (DoR) e Definition of Done (DoD) — propostas

**DoR para uma issue de aluno:** problema e usuário/benefício claros; CA testáveis; dependências resolvidas; dados de teste disponíveis; escopo cabe em PR revisável; riscos de privacidade e permissões identificados; mentor e responsável pelo produto sabem como validar; tamanho estimado após inspeção. Se não cumprir, permanece em refinamento.

**DoD para história/bug:** CA demonstrados; testes adequados executados; CI aprovada; PR revisado e aprovado por pessoa autorizada; comentários resolvidos; documentação ajustada quando necessário; acessibilidade e autorização verificadas nos fluxos afetados; sem secrets/dados pessoais; uso de IA declarado conforme política; merge e validação em ambiente apropriado; issue atualizada com evidência. **DoD não substitui aceite funcional do organizador** quando aplicável.

**DoD para P0/base:** além dos itens anteriores, fluxo mínimo ponta a ponta operante, publicação reproduzível, contas administrativas provisionadas com segurança, histórico/releitura testados, estados vazios tratados, documentação de instalação/operação e snapshot estável preparado.

## 10. Dependências e ordem de implementação da base

1. **Descoberta e decisões mínimas:** validar campos públicos/privados, regras de ciclo, encontro, identidade do organizador e dados históricos.
2. **Arquitetura e dados:** definir stack, persistência, autenticação, ambiente, custos e modelo Livro × Ciclo × Encontro; registrar ADRs.
3. **Fundação:** PB-014, PB-015 e estrutura inicial de PB-016.
4. **Fluxo de domínio:** PB-002/003 → PB-004/005 → PB-008/009 → PB-006/007.
5. **Apresentação e validação:** PB-001, testes de fluxo, deploy, documentação, dados de exemplo e aceite do organizador.
6. **Preparação pedagógica:** ED-001 a ED-005 e seleção de issues P1 refinadas.

A sequência é lógica, não um cronograma de execução. A implementação pode ser paralelizada desde que preserve dependências e segurança.

## 11. Critérios de aceite do MVP operacional

A base estará apta para o piloto quando for possível demonstrar, com dados de exemplo e sem expor dados pessoais: (1) visitante encontra clube, leitura atual, encontros futuros e histórico; (2) organizador autorizado cadastra/edita livro, ciclo e encontro; (3) visitante não consegue executar escrita, inclusive via requisição direta; (4) encerramento preserva histórico e encontros; (5) releitura usa o mesmo registro de livro em ciclos diferentes; (6) ausência de leitura/encontro/histórico é tratada; (7) testes e CI executam; (8) aplicação publicada é inicializável conforme README; (9) snapshot educacional e ao menos uma issue P1 estão preparados. A aceitação de valor pelo organizador deve ser coletada separadamente.

## 12. Perguntas bloqueantes e pontos para refinamento

| ID | Questão | Impacto |
|---|---|---|
| Q-01 | Uma leitura principal ativa ou ciclos paralelos? | PB-004/005 e PB-207 |
| Q-02 | Quais dados do encontro são públicos? Links, endereços e contatos podem ser restritos? | PB-001/008/009 e segurança |
| Q-03 | Encontro precisa sempre estar associado a ciclo? Como lidar com cancelamento e datas passadas? | PB-008/106 |
| Q-04 | Quem administra? Como provisionar/revogar acessos? | PB-014 |
| Q-05 | Há histórico real a importar e qual sua qualidade? | PB-006/007 e preparação de dados |
| Q-06 | O clube realmente quer sugestões e votações digitais? Quem pode participar? | PB-110/201/203 |
| Q-07 | Qual é o mínimo útil para o organizador testar a aplicação? | Aceite do MVP e priorização |
| Q-08 | Há disponibilidade de mentor, orçamento e hospedagem? | Arquitetura e viabilidade do piloto |
| Q-09 | Qual licença será adotada para software e kit? | Distribuição e replicação |

## 13. Rastreabilidade e controle de mudanças

| Direção de origem | Reflexo no backlog | Estado |
|---|---|---|
| VP-001/002; BM-002 | EP-01 a EP-04 como núcleo | Direção aprovada; detalhamento proposto |
| VP-004; BM-004 | PB-004/006/007; teste de releitura | Direção aprovada |
| VP-003; BM-006 | PB-110 e PB-201 a PB-205 como evolução | Recomendação/hipótese |
| VP-005; BM-009 | Primeiro deploy para um clube | Proposta operacional |
| VP-006; BM-009 | P0 antes dos alunos; P1 incremental | Direção aprovada; corte proposto |
| VP-007; BM-007 | Regra de leitura principal | Hipótese aberta |
| DEC-003/005/006/007/010 | EP-07, EP-08, ED-001 a ED-008 | Princípios aprovados; execução pendente |
| DEC-011 | Agenda como feature demonstrativa | Exemplo, não obrigação |
| DEC-012 | Stack candidata | Pendente de ADR |

**Decisões propostas para aprovação:** (R-01) P0 inclui CRUD mínimo de livros/ciclos/encontros e histórico; (R-02) alunos priorizam melhorias S em fluxos existentes; (R-03) sugestão só entra no piloto após descoberta e definição de identidade; (R-04) kit didático tem backlog próprio; (R-05) estimativas são relativas e reavaliadas após arquitetura. Nenhuma destas propostas altera automaticamente o Guia Mestre.

## 14. Próximos passos

1. Entrevistar o organizador e registrar respostas às questões Q-01 a Q-07.
2. Aprovar ou ajustar corte P0/P1/P2 e critérios de aceite.
3. Produzir `04-processo-trabalho.md` com Scrumban, glossário, políticas de issue/PR e rituais.
4. Definir arquitetura/stack/custos e registrar ADRs, sem presumir Next.js ou provedor.
5. Configurar repositórios e GitHub Projects, migrando **apenas issues refinadas** e mantendo IDs como referência.
6. Implementar/validar base, preparar snapshots e selecionar o pool do piloto.

---

**Controle de alteração:** v1.0 elaborada a partir da visão, benchmarking e Guia Mestre em 11/11/2026. É uma proposta de planejamento e não substitui descoberta com stakeholder, decisões de arquitetura nem aprovação formal do backlog.
