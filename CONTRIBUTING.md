# Contribuindo

O Software Starter é uma base técnica reutilizável. Discuta mudanças de escopo
por Issue antes de iniciar trabalho amplo. Não inclua funcionalidades de
produto no starter sem alinhamento com os responsáveis pelo projeto.

## Pré-requisitos e ambiente

Use Git, Docker Desktop com Compose, Node.js 22 e pnpm. O setup local é
documentado no [README](./README.md) e no [guia do starter](./docs/software-starter.md):

```bash
pnpm install
pnpm run setup
pnpm dev
```

O Compose fornece PostgreSQL local; a aplicação Next.js roda no host. Os
comandos de ambiente validam alvos de banco e não devem ser configurados para
usar bases do sistema original, produção ou serviços externos. Preserve volumes
locais; não use reset destrutivo para corrigir o ambiente.

## Branches

Crie branches curtas a partir de `main` e use um prefixo simples:

- `feat/<assunto>`
- `fix/<assunto>`
- `refactor/<assunto>`
- `docs/<assunto>`
- `test/<assunto>` ou `chore/<assunto>` para trabalho correspondente

Abra um Pull Request para integrar alterações. Não trabalhe diretamente em
`main`; mantenha o escopo do PR revisável e sincronize a branch sem force push
na branch principal.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) no formato
`tipo(escopo-opcional): descrição`, com os tipos permitidos pelo Commitlint:

`feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `build` e `perf`.

Exemplos:

```text
feat(auth): validate tenant session
fix(example-item): reject invalid input
docs: clarify local setup
```

Husky valida arquivos staged com lint-staged antes do commit e valida a
mensagem no hook `commit-msg`. Os hooks ajudam localmente; a CI é a verificação
compartilhada e obrigatória.

## Qualidade e testes

Antes de abrir o PR, execute:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test` executa a suíte uma vez usando o banco local de testes já
preparado. Para iniciar o PostgreSQL, aplicar a migration de teste e executar
a suíte em sequência, use `pnpm test:local`. O setup inicial prepara os dois
bancos; o seed fica somente em desenvolvimento. `pnpm build` usa o alvo local
validado, enquanto CI/deploy pode usar `pnpm build:production` com um banco
efêmero/de build isolado.

## Criando uma feature

Use [ExampleItem](./src/features/example-item) como referência para a
organização de schema Zod, Server Actions, repository Prisma, tipos de consulta,
componentes, rota e testes. Mantenha acesso a dados em
`src/features/<feature>/`; compartilhe componentes genéricos somente quando
houver reutilização real.

Para dados tenant-scoped, derive `tenantId` do ator autenticado, passe-o
explicitamente ao repository e aplique o filtro em cada leitura/alteração.
Verifique autorização dentro das ações do servidor; esconder controles na UI
não é uma medida de segurança. Cubra validação, autorização e isolamento nos
testes. Não altere migrations existentes para reconstruir uma baseline.

O Plop pode acelerar scaffolds apenas para modelos habilitados pela política
em `plop/generators/crud-policy.ts`. Revise cada saída, relações, RBAC e testes;
geração não é aprovação automática para uso.

## Issues e Pull Requests

Use o template de bug, user story ou tarefa técnica. PRs devem referenciar a
Issue quando aplicável, explicar risco/impacto e registrar evidências de teste.
Inclua screenshots para mudanças visuais e logs sanitizados quando ajudarem na
revisão. Responda aos comentários e resolva conversas antes do merge.

### Proteções manuais do GitHub

As seguintes políticas precisam ser configuradas nas regras de branch do
repositório GitHub; arquivos versionados e workflows, isoladamente, não as
ativam:

1. Exigir Pull Request para atualizar `main`.
2. Exigir pelo menos uma aprovação e descartar aprovações obsoletas após novos
   commits, se adequado à equipe.
3. Exigir a verificação CI do job `quality` e bloquear merge quando falhar ou
   estiver pendente.
4. Exigir resolução das conversas de revisão.
5. Desabilitar force push e exclusão de `main`.
6. Preferir squash merge e desabilitar os outros métodos se essa for a política
   do projeto.

Confirme o nome do check exibido pelo GitHub após uma execução da workflow.
Confirme também quais controles estão disponíveis conforme o plano e as
permissões do repositório. Não presuma que estas regras estejam habilitadas.

## Uso de ferramentas de IA

Ferramentas de IA podem apoiar exploração, implementação e testes, mas a pessoa
autora do PR continua responsável pela alteração. Revise e compreenda o código,
valide as saídas geradas, remova dados sensíveis de prompts e não aceite
mudanças sem testes adequados. Informe brevemente no PR qual ferramenta foi
usada e em que parte, ou declare que IA não foi utilizada. Não submeta
credenciais, dados pessoais ou código de terceiros não autorizado a serviços
de IA.

Consulte também as [orientações de IA](./docs/ai-assisted-development.md).

## Governança

- [Código de Conduta](./CODE_OF_CONDUCT.md)
- [Política de Segurança](./SECURITY.md)
- [Licença MIT](./LICENSE)
