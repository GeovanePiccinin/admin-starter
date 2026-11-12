# Fábrica de Software Virtual — Visão do Produto

**Produto:** Plataforma do Clube do Livro  
**Documento:** `01-visao-produto.md`  
**Versão:** 1.0  
**Data:** 11/11/2026  
**Status:** Visão inicial aprovada como diretriz de planejamento; regras operacionais ainda sujeitas à validação com o professor responsável pelo clube.  
**Documento de referência:** `FABRICA_SOFTWARE_GUIA_MESTRE.md`, versão 1.0.

## 1. Contexto e propósito

A Plataforma do Clube do Livro é o primeiro produto real da **Fábrica de Software Virtual**, iniciativa educacional extracurricular, voluntária, independente e remota. A aplicação apoiará um clube do livro já existente, organizado por um professor parceiro, ao centralizar informações sobre a comunidade, as obras, as leituras coletivas, os encontros e, progressivamente, a participação dos membros.

O projeto tem dois resultados complementares: (1) um software livre útil à comunidade de leitores e (2) uma experiência de formação profissional em engenharia de software, acompanhada de um kit didático aberto para replicação por outros professores.

A plataforma **não pretende competir com redes sociais literárias** nem reproduzir todo o escopo de Goodreads, Fable ou StoryGraph. Seu foco inicial é a **organização de leituras e encontros de uma comunidade real**. As interações sociais serão incorporadas gradualmente quando agregarem valor comprovado.

## 2. Problema a resolver

Clubes de leitura precisam coordenar informações que frequentemente ficam dispersas: qual livro está em leitura, quando ocorrerá o próximo encontro, quais livros já foram lidos, quais obras foram sugeridas e como os participantes podem acompanhar as decisões do grupo.

A plataforma propõe oferecer um lugar único para consultar e administrar essas informações. A existência, a intensidade e as formas atuais desses problemas **ainda precisam ser confirmadas em conversa com o organizador**; não devem ser tratadas como diagnóstico já validado.

## 3. Declaração de visão

> Para organizadores e participantes de clubes do livro que desejam acompanhar suas leituras coletivas, a Plataforma do Clube do Livro é uma aplicação web que reúne informações sobre livros, ciclos de leitura e encontros, apoiando a continuidade da comunidade. Diferentemente de uma rede social literária generalista, concentra-se na rotina e na memória de um clube real, começando com um escopo simples e evolutivo.

## 4. Objetivos do produto

1. Tornar visíveis o livro atual, os próximos encontros e o histórico do clube.
2. Facilitar a administração de informações bibliográficas e da agenda.
3. Preservar o histórico de leituras coletivas, inclusive quando uma obra for relida.
4. Permitir evolução gradual para sugestões, votações, comentários e resenhas.
5. Viabilizar manutenção por equipes sucessivas de alunos, com código legível, testes, documentação e entrega contínua.
6. Disponibilizar software livre que possa ser implantado ou adaptado por outros professores e comunidades.

## 5. Público e papéis

| Ator | Necessidade central | Possíveis ações |
|---|---|---|
| Visitante | Conhecer o clube e sua programação pública | Consultar apresentação, livros e encontros públicos |
| Membro | Acompanhar a leitura coletiva e participar da comunidade | Consultar leituras, encontros e, em fases posteriores, sugerir, votar, comentar e resenhar |
| Organizador | Conduzir o funcionamento do clube | Administrar livros, ciclos de leitura, encontros e, posteriormente, participação e moderação |
| Mantenedor técnico | Preservar qualidade, segurança e disponibilidade | Corrigir falhas, revisar PRs, executar releases e manter a aplicação |

**Hipóteses de acesso:** visitantes terão acesso às informações públicas; ações administrativas exigirão autenticação e autorização; a necessidade de contas para membros dependerá das funcionalidades efetivamente selecionadas. O desenho exato de permissões ainda será refinado.

## 6. Modelo de domínio e relações

| Conceito | Significado | Relações principais |
|---|---|---|
| Usuário | Pessoa com conta na plataforma | Pode integrar clubes e produzir conteúdo |
| Clube | Comunidade organizada de leitores | Possui membros, ciclos de leitura e encontros |
| Membro / associação | Vínculo entre usuário e clube, com papel e estado | Relaciona usuário a clube |
| Livro | Obra bibliográfica cadastrada | Pode ser selecionada em diversos ciclos e clubes |
| Leitura coletiva | Ocorrência de um clube ler determinado livro em certo período | Pertence a um clube; referencia um livro; pode ter encontros e discussões |
| Encontro | Reunião presencial ou virtual | Pertence a um clube e pode estar associado a uma leitura coletiva |
| Sugestão de livro | Proposta feita por participante | Indica livro candidato para leitura futura |
| Votação / voto | Processo e manifestação de escolha | Relaciona clube, opções de livros e membros habilitados |
| Comentário | Mensagem inserida em uma discussão | Vincula autor a uma leitura ou tópico; regras de spoilers a definir |
| Resenha | Avaliação mais estruturada de uma obra | Vincula autor e livro; associação ao ciclo é opcional a avaliar |

### Regra de modelagem central

**Livro não é o mesmo que leitura coletiva.** Um livro integra o catálogo bibliográfico; uma leitura coletiva registra que um clube leu essa obra em determinado período. O mesmo livro pode gerar vários ciclos, com encontros e discussões distintos. Essa distinção deve orientar o futuro modelo de dados.

**Direção de escopo:** a primeira implantação atenderá um único clube. A modelagem poderá preservar a possibilidade de múltiplos clubes, mas **não será exigido suporte multiclube completo no MVP**.

## 7. Jornada principal do clube

1. **Apresentação e consulta:** visitantes conhecem o clube, sua leitura atual e a agenda pública.
2. **Organização do catálogo:** o organizador registra ou seleciona um livro existente na plataforma.
3. **Escolha da leitura:** inicialmente o organizador pode indicar a obra; sugestões e votação são possíveis evoluções.
4. **Abertura do ciclo:** o organizador associa o livro a um período de leitura coletiva e comunica o encontro.
5. **Acompanhamento:** os participantes consultam livro atual, calendário e informações relevantes; comentários durante a leitura poderão ser habilitados em fase posterior.
6. **Encontro:** a comunidade se reúne para discutir a obra, presencial ou virtualmente.
7. **Encerramento e memória:** o ciclo passa ao histórico, preservando informações de leitura e encontros; resenhas e discussões poderão complementar esse registro.
8. **Repetição:** o clube inicia outro ciclo, mantendo o histórico dos anteriores.

**Fluxo conceitual:** Clube → catálogo / seleção de livro → leitura coletiva atual → encontro(s) → histórico → próximo ciclo. Interações sociais são recursos transversais e incrementais, não pré-requisitos para o primeiro ciclo operacional.

## 8. Capacidades do produto e evolução proposta

| Capacidade | MVP funcional inicial | Evolução candidata |
|---|---|---|
| Página pública do clube | Sim | Conteúdo editorial mais rico |
| Catálogo com detalhes dos livros | Sim | Busca, filtros avançados e importação por API |
| Cadastro e manutenção de livros | Sim, manual | Integração com Open Library e/ou Google Books |
| Livro atual / leitura coletiva | Sim | Vários ciclos paralelos, se houver necessidade real |
| Agenda / encontros | Consulta e administração básica, conforme corte do software-base | Inscrições, presença, lembretes e integrações |
| Histórico das leituras | Registro e consulta essenciais | Resumos, métricas e arquivo enriquecido |
| Autenticação e autorização | Apenas o mínimo exigido para administrar o sistema | Gestão de membros e papéis mais granular |
| Sugestão e votação | Não obrigatórias no MVP inicial | Primeiras candidatas de evolução |
| Comentários e resenhas | Fora do MVP inicial | Discussões e resenhas moderadas |
| Progresso individual, chat e recomendações por IA | Fora do MVP | Avaliar somente mediante demanda comprovada |

A composição exata do MVP e, especialmente, a divisão entre **software-base pré-existente** e **features reservadas aos alunos** serão fechadas no backlog, após validação funcional. A orientação atual é iniciar o piloto com **uma base funcional**, não um projeto vazio: autenticação administrativa mínima, catálogo, leitura atual e consulta básica de agenda, com infraestrutura de testes e CI já operante. As features destinadas aos alunos deverão ser pequenas, úteis e incrementais.

## 9. Regras e princípios de negócio preliminares

- Um clube possui organizador(es) e pode ter membros associados.
- Cada ciclo de leitura coletiva está vinculado a um livro e a um clube.
- Um livro pode aparecer em vários ciclos, sem duplicar a obra no catálogo.
- **Hipótese inicial:** uma leitura principal ativa por clube em cada momento; exceções serão discutidas com o organizador.
- Encontros podem ter modalidade presencial ou virtual; detalhes públicos e privados devem ser separados quando necessário.
- Ações administrativas requerem permissões apropriadas.
- Dados cadastrais, comentários e resenhas não se tornam públicos automaticamente; publicação, moderação e privacidade precisam de regras específicas antes de implementação.
- Integrações bibliográficas deverão respeitar atribuição, licenças e limites dos provedores; correção manual de metadados deve permanecer possível.

## 10. Experiência de uso priorizada

- **Visitante:** entende rapidamente o propósito do clube, identifica a leitura atual e encontra a programação.
- **Organizador:** consegue atualizar livros, leituras e encontros sem conhecimento técnico.
- **Membro:** encontra as informações necessárias com pouca navegação; na evolução futura, participa das escolhas e discussões.
- **Acessibilidade e responsividade:** considerar desde o design inicial, com verificação progressiva ao implementar telas e fluxos.

## 11. Limites e não objetivos do MVP

Não são objetivos iniciais: comércio de livros, biblioteca digital com textos protegidos, chat em tempo real, algoritmo de recomendações, feed social completo, acompanhamento individual sofisticado, múltiplas comunidades independentes com administração completa, aplicativos móveis nativos ou automações complexas de IA.

## 12. Relação com a Fábrica de Software Virtual

A plataforma será mantida como produto open-source real, enquanto o repositório didático documentará a experiência de engenharia. Os alunos ingressarão em **código preexistente** e percorrerão demandas reais por meio de issues, refinamento, planejamento, implementação, testes, Pull Requests, Code Review, CI, merge e validação da entrega.

O piloto previsto tem **quatro semanas, 3 a 4 alunos e dedicação estimada de 3–4 horas semanais por participante**, sujeito à validação operacional. O processo será um **híbrido de Scrum e Kanban (Scrumban)**, documentado em guia específico, e permitirá uso responsável de IA com compreensão e validação humana das alterações.

O projeto publicará também snapshots educacionais e instruções para que professores possam reproduzir a atividade sem depender do mesmo clube ou do estado mais recente do produto.

## 13. Indicadores iniciais de sucesso

**Valor para o clube (a validar com stakeholder):** organizador consegue manter a leitura atual e agenda; participantes conseguem localizar essas informações; o histórico é preservado de forma consistente; o organizador considera a solução útil e utilizável.

**Viabilidade técnica:** aplicação publicada e operante; dados consistentes; fluxo básico testado; PRs revisados e CI executado; documentação de instalação e operação reproduzível.

**Valor didático:** ingressantes compreendem um código existente, refinam issues, entregam alterações revisadas, justificam decisões inclusive sobre uso de IA e registram aprendizado. Os instrumentos detalhados serão definidos no plano de avaliação do piloto.

Não interpretar quantidade bruta de commits, linhas de código ou PRs como medida isolada de aprendizagem.

## 14. Benchmarking de referência

Esta visão foi orientada por padrões de produto presentes em:

- **Bookclubs** — gestão de clubes, encontros, escolhas de leitura e membros: https://bookclubs.com
- **Fable** — discussões e experiências de leitura social: https://fable.co
- **Goodreads** — catálogo, avaliações, resenhas e listas pessoais: https://www.goodreads.com
- **The StoryGraph** — acompanhamento de leituras e recursos sociais: https://thestorygraph.com

O benchmarking detalhado, incluindo matriz de funcionalidades, evidências, data de consulta e decisões de adoção ou descarte, será registrado em `02-benchmarking.md`. As referências servem para compreender padrões de funcionamento, não para copiar conteúdos, marca, identidade visual ou designs.

## 15. Pendências de descoberta com o organizador

1. Como os livros são escolhidos atualmente: decisão do organizador, indicação, votação ou combinação?
2. Com que frequência há encontros e como são divulgados? São presenciais, remotos ou híbridos?
3. Há uma leitura principal por vez? Existem leituras paralelas?
4. Quantos participantes ativos há e como se comunicam entre encontros?
5. A comunidade precisa efetivamente de comentários e resenhas dentro da plataforma ou já utiliza outro canal?
6. Quais informações devem ser públicas e quais precisam de acesso restrito?
7. Quem manterá o catálogo e a agenda no dia a dia?
8. Existe material histórico de livros e encontros a importar?
9. Quais dificuldades concretas com o processo atual justificam a adoção do sistema?
10. Quais funcionalidades o organizador considera indispensáveis para experimentar o MVP?

## 16. Decisões e estado

| ID | Decisão / direção | Situação |
|---|---|---|
| VP-001 | Produto centrado no clube e nas leituras coletivas, não em rede social geral | Direção aprovada |
| VP-002 | Primeiro foco: organização de leituras e encontros | Direção aprovada |
| VP-003 | Interação social como evolução incremental | Direção aprovada |
| VP-004 | Distinguir livro de ciclo de leitura coletiva | Direção de modelagem aprovada |
| VP-005 | Primeira implantação focada em um clube | Proposta operacional a validar |
| VP-006 | Base funcional preexistente para entrada dos alunos | Direção recomendada; corte detalhado pendente |
| VP-007 | Uma leitura principal ativa por clube | Hipótese a validar |
| VP-008 | Funcionalidades e permissões finais do MVP | Pendentes de refinamento e validação |

## 17. Próximos entregáveis

1. `02-benchmarking.md` — matriz de referência, fontes, decisões de inclusão e exclusão.
2. `03-product-backlog.md` — épicos, features, histórias, critérios de aceite, prioridades e divisão base/alunos.
3. `04-processo-trabalho.md` — fluxo Scrumban, glossário Scrum/Kanban e práticas de engenharia assistida por IA.
4. Entrevista de descoberta com o organizador, seguida de atualização controlada dos documentos.
5. Configuração do GitHub Projects e dos repositórios depois da primeira versão refinada do backlog.

---

**Controle de alteração:** versão 1.0 gerada a partir do Guia Mestre e das direções de produto aprovadas na etapa de concepção. Não substitui a validação de requisitos com o responsável pelo clube e não fixa stack ou arquitetura detalhada.
