<!--
Sync Impact Report
- Version change: unratified scaffold -> 1.0.0 (initial constitution)
- Modified principles: none
- Added principles: I. Arquitetura por funcionalidades; II. Simplicidade arquitetural;
  III. Stack e tipagem; IV. Persistência; V. Reutilização consciente; VI. Segurança;
  VII. Qualidade e testes; VIII. Requisitos enterprise; IX. Evolução incremental
- Added sections: Critérios verificáveis; Revisão e conformidade
- Removed sections: none
- Follow-up TODOs: confirm the original ratification date
-->

# Sistema de Agendamento Constitution

## Core Principles

### I. Arquitetura por funcionalidades

O código MUST ser organizado por funcionalidades, mantendo regras e fluxos específicos
próximos da funcionalidade que os possui. Novas implementações MUST priorizar Vertical Slices
que percorram as partes necessárias para entregar o comportamento, sem introduzir camadas
compartilhadas antes de existir uma necessidade real.

### II. Simplicidade arquitetural

As soluções MUST usar a menor estrutura que atenda aos requisitos presentes. Camadas,
abstrações, DTOs e indireções MUST NOT ser adicionados sem benefício concreto demonstrável.
Preferências por cenários hipotéticos futuros não justificam complexidade presente.

### III. Stack e tipagem

As rotas e páginas MUST seguir Next.js App Router, com React e TypeScript em modo strict.
O código MUST NOT usar `any`. Dados recebidos de fontes externas MUST ser validados em
runtime com Zod antes de serem usados como dados confiáveis.

### IV. Persistência

A persistência MUST usar Prisma com PostgreSQL e toda alteração de schema MUST ser
representada por uma migration versionada. O acesso a dados MUST usar Prisma diretamente
nas funcionalidades; MUST NOT criar abstrações de repositório apenas para possibilitar
uma troca hipotética de ORM.

### V. Reutilização consciente

Componentes, funções e abstrações compartilhados MUST representar comportamento genuinamente
comum. Regras específicas MUST permanecer nas funcionalidades que as definem. Compartilhamento
MUST NOT criar dependências desnecessárias ou acoplamento entre funcionalidades.

### VI. Segurança

Autenticação e autorização MUST ser aplicadas no servidor. Cada operação protegida MUST
verificar a permissão necessária, sem depender apenas de controles de interface. Quando houver
tenants, consultas e mutações MUST preservar e verificar o isolamento do tenant autorizado.

### VII. Qualidade e testes

Alterações MUST ser validadas com testes apropriados e verificações estáticas; build MUST ser
executado quando pertinente à alteração. A conclusão de uma funcionalidade exige comportamento
implementado e validado: gerar arquivos, scaffolds ou código sem teste não constitui conclusão.

### VIII. Requisitos enterprise

Cada funcionalidade MUST considerar requisitos aplicáveis de segurança, observabilidade,
auditoria, confiabilidade, desempenho e manutenibilidade. A solução MUST implementar e
verificar os requisitos relevantes ao contexto, sem adicionar mecanismos sem necessidade
justificada.

### IX. Evolução incremental

As mudanças MUST preservar comportamentos existentes, respeitar decisões arquiteturais
documentadas e limitar seu escopo ao necessário. Alterações incompatíveis ou não relacionadas
MUST ser evitadas; mudanças necessárias de comportamento MUST ser explícitas e verificadas.

## Critérios verificáveis

Em cada alteração, a implementação e sua revisão MUST confirmar, conforme aplicável, que:

- O código novo está organizado na funcionalidade pertinente e não introduz abstrações sem
  benefício concreto.
- TypeScript strict permanece ativo, não há uso de `any` no código alterado e entradas externas
  são validadas com Zod.
- Mudanças de schema têm migration Prisma versionada; queries e mutações protegidas verificam
  autorização e escopo do tenant quando aplicável.
- Testes e verificações estáticas cobrem os riscos da mudança; build é verificado quando
  pertinente. Falhas e limitações de validação são declaradas, não tratadas como sucesso.
- Requisitos enterprise relevantes e impactos em comportamento existente foram considerados.

## Revisão e conformidade

Revisões de mudanças MUST verificar os critérios aplicáveis desta constituição e as decisões
arquiteturais documentadas relacionadas ao escopo. Exceções MUST registrar a justificativa,
o risco e a aprovação explícita na revisão da mudança. A revisão MUST também confirmar que
testes e verificações apropriados foram executados e que seus resultados refletem o código
entregue.

## Governance

Esta constituição define princípios permanentes e critérios de conformidade para o projeto.
Alterações a ela MUST ser propostas em uma mudança revisável, explicando a motivação, o impacto
nos princípios e os ajustes necessários em decisões ou práticas relacionadas. A alteração só
entra em vigor após aprovação na revisão de código.

O versionamento MUST seguir Semantic Versioning: MAJOR para remover ou redefinir princípios de
forma incompatível; MINOR para adicionar princípios ou expandir materialmente as regras;
PATCH para esclarecimentos e ajustes sem mudança semântica. Revisores MUST avaliar conformidade
com esta constituição nas alterações pertinentes; desvios MUST ser justificados e aprovados
conforme a seção Revisão e conformidade.

**Version**: 1.0.0 | **Ratified**: 2026-10-25: | **Last Amended**: 2026-10-25
