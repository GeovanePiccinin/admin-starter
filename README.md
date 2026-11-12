# Software Starter

Base full-stack reutilizável para iniciar aplicações web e evoluí-las de forma
incremental. Inclui autenticação, autorização administrativa, multi-tenancy,
persistência PostgreSQL, tratamento de erros, observabilidade e uma feature CRUD
de referência. Não implementa um domínio de produto específico.

## Início rápido

Requisitos: Git, Docker Desktop com Compose, Node.js 22 e pnpm.

```bash
git clone <URL-do-repositorio>
cd <pasta-do-repositorio>
pnpm install
pnpm setup:local
pnpm dev
```

O setup cria os arquivos locais de ambiente sem sobrescrever arquivos já
existentes, inicia PostgreSQL 16 no Docker Compose, aplica a migration inicial
e carrega um administrador e um item de exemplo. A aplicação Next.js roda no
host via pnpm. Abra <http://localhost:3000>.

O acesso local inicial usa `admin@example.com` e `admin123`, definidos nos
arquivos de exemplo. Para personalizar, altere `DEMO_ADMIN_EMAIL`,
`DEMO_ADMIN_PASSWORD` e `AUTH_SECRET` em `.env.development` e rode
`pnpm db:seed`. Os valores do exemplo são somente para desenvolvimento local;
nunca os use em produção.

No PowerShell do Windows, use `pnpm.cmd` se a política de execução bloquear
`pnpm.ps1`.

Para executar a suíte completa com o banco de testes:

```bash
pnpm test:local
```

## Documentação

- [Guia do Software Starter](./docs/software-starter.md): propósito, autenticação,
  arquitetura, recursos não funcionais e onboarding.
- [Ambientes e banco de dados](./docs/database-environments.md): comandos,
  isolamento, migrations e CI.
- [Tratamento de erros e observabilidade](./docs/observability.md): logs,
  Sentry e privacidade.
- [Auditoria e rate limit](./docs/audit-and-rate-limiting.md): eventos e limites
  aplicados.

## Stack

Next.js, React, TypeScript, NextAuth, Prisma ORM, PostgreSQL, TanStack Query e
Table, React Hook Form, Zod, Tailwind CSS, Vitest, ESLint, Pino e Sentry
opcional. O schema e a feature de exemplo são próprios do starter; o histórico
de migrations do sistema de agendamentos foi arquivado e não integra o caminho
ativo.
