# Guia do Software Starter

## Propósito e escopo

O Software Starter é uma base técnica para clonar, executar localmente e
transformar em uma aplicação web de domínio próprio. Mantém componentes de
infraestrutura reutilizáveis — autenticação, autorização, multi-tenancy,
persistência, validação, testes e observabilidade — sem manter o domínio do
sistema de agendamentos.

O dashboard e a feature `ExampleItem` demonstram padrões de interface e CRUD.
`ExampleItem` é apenas um exemplo para orientar novas funcionalidades; catálogo
de livros, ciclos de leitura e encontros ainda não fazem parte do starter.

## Stack e arquitetura

- Next.js App Router, React e TypeScript.
- NextAuth com provedor Credentials e sessões JWT.
- Prisma ORM 7 e PostgreSQL 16, com adapter `pg`.
- Zod, React Hook Form, TanStack Query e TanStack Table.
- Tailwind CSS e componentes UI compartilhados.
- Vitest, ESLint, Pino e integração opcional com Sentry.

### Organização de pastas

```text
src/
  app/                 Rotas, layouts, página pública e endpoints Next.js
  components/          Componentes compartilhados de UI e formulários
  config/              Configuração da navegação
  features/
    example-item/      Schema, Server Actions, repository, UI e testes do CRUD
  generated/prisma/    Prisma Client gerado; não editar manualmente
  hooks/               Hooks compartilhados, como controles de listagem
  lib/
    audit/             Escrita de eventos de auditoria
    auth/              Resolução do usuário e autorização
    db/                Prisma Client e validação de destino do banco
    errors/             Erros de domínio
    logger/             Logger Pino
    observability/      Contexto e tratamento comum de Server Actions
    rate-limit/         Limites baseados em PostgreSQL
prisma/
  schema.prisma        Modelos atuais do starter
  migrations/          Histórico ativo de migrations
  migrations-legacy/   Histórico antigo preservado, fora do caminho ativo
  seed.ts              Entrada do seed local
scripts/               Setup, isolamento de ambiente e operações de banco
plop/                  Gerador de CRUD e templates
docs/                  Documentação técnica e de produto
```

As páginas `/` e `/login` são públicas. As páginas sob o layout de
`src/app/(dashboard)/` exigem autenticação. Cada funcionalidade deve manter
seus schemas, ações, consultas, acesso a dados, componentes e testes juntos em
`src/features/<feature>/`; componentes realmente compartilhados ficam em
`src/components/` ou `src/lib/`.

### Fluxo recomendado para uma feature

1. Validar entradas com Zod no limite da ação.
2. Em Server Actions, obter o ator autenticado, verificar papel e executar a
   operação por `runServerAction`.
3. Passar o `tenantId` explicitamente ao repository e filtrar leituras e
   alterações pelo tenant.
4. Registrar operações bem-sucedidas quando forem auditáveis.
5. Cobrir schema, autorização, comportamento do repository e isolamento por
   tenant com testes.

`ExampleItem` é uma referência inicial, não um gerador de domínio. O Plop é
restrito a modelos explicitamente aprovados em sua política; o código gerado
precisa de revisão e testes de autorização e isolamento.

## Autenticação e autorização

- O NextAuth usa o provedor de credenciais (e-mail e senha).
- Senhas são verificadas com Argon2; o banco guarda o hash, nunca a senha em
  texto claro.
- A sessão usa estratégia JWT e inclui o identificador do usuário e o
  `tenantId`.
- Para operações protegidas, o ator é conferido novamente no banco pelo par
  usuário/tenant. A autorização administrativa é verificada nas Server Actions
  e nas leituras da feature `ExampleItem`.
- Não há cadastro público de usuários. O seed cria apenas um administrador
  local para desenvolvimento.

## Recursos não funcionais

### Erros e logs

Server Actions passam por `runServerAction`, que classifica erros de validação,
autenticação, autorização, domínio e rate limit. Falhas inesperadas recebem um
identificador de operação e uma mensagem segura para o cliente. O servidor usa
Pino com logs estruturados; em desenvolvimento, a saída é formatada para
leitura.

### Sentry

Sentry é opcional. Sem DSN, a captura fica desativada. Para configurá-lo, use
`SENTRY_DSN` no servidor e `NEXT_PUBLIC_SENTRY_DSN` para eventos do navegador.
A coleta é restrita para evitar envio de identidade, credenciais e payloads de
requisição. Consulte [observabilidade](./observability.md) antes de habilitar a
integração.

### Auditoria

Operações bem-sucedidas de criação, atualização, exclusão e login gravam
metadados em `audit_logs`: tenant, ator, ação, entidade e identificador da
entidade. Payloads da operação não são copiados para o log.

### Rate limit

Os limites são implementados com buckets no PostgreSQL:

- Até 120 chamadas por minuto para ações autenticadas de leitura/opções, por
  ator e operação.
- Até 30 mutações por minuto, por ator e operação.
- Até 5 tentativas de login por janela de 15 minutos, tanto por e-mail quanto
  por endereço do cliente quando disponível.

Os identificadores dos buckets são HMACs, não os identificadores brutos.
Produção exige `AUTH_SECRET` (ou `NEXTAUTH_SECRET`) forte e privado.

## Ambientes e banco de dados

O Docker Compose executa PostgreSQL 16 com dois bancos independentes:

| Banco                   | Uso                                  |
| ----------------------- | ------------------------------------ |
| `software_starter_dev`  | Aplicação local e seed demonstrativo |
| `software_starter_test` | Testes de integração que usam banco  |

O volume é nomeado e mantido entre paradas. A aplicação Next.js executa no host
via pnpm; o container fornece somente PostgreSQL. A porta padrão do host é
`54329`, configurável por `STARTER_POSTGRES_PORT` nos dois arquivos locais.

Os scripts validam ambiente, host e nome do banco antes de conectar, limpam
variáveis de conexão `PG*` herdadas e recusam destinos locais diferentes dos
bancos permitidos. A CI usa seu próprio PostgreSQL efêmero. Não use esses
comandos para apontar ao banco do sistema original.

`prisma/schema.prisma` e `prisma/migrations/` representam a baseline limpa do
starter. `prisma/migrations-legacy/` é apenas arquivo histórico, não deve ser
movido para a pasta ativa nem aplicado. Os comandos locais aplicam migrations;
eles não fazem reset. O seed é idempotente e limitado a desenvolvimento/teste.

## Clonar e executar

### Requisitos

- Git.
- Docker Desktop com Docker Compose ativo.
- Node.js 22.
- pnpm.

### Primeira execução

```bash
git clone <URL-do-repositorio>
cd <pasta-do-repositorio>
pnpm install
pnpm run setup
```

O script copia `.env.development.example` e `.env.test.example` apenas quando
os arquivos locais não existem. O seed inicial usa as credenciais de exemplo:
`admin@example.com` / `admin123`. Para personalizá-las, edite
`DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD` (mínimo de 8 caracteres) e
`AUTH_SECRET` em `.env.development` e execute `pnpm db:seed` novamente. Os
valores do exemplo são públicos e servem somente para uma máquina local.

Em seguida, inicie a aplicação:

```bash
pnpm dev
```

Acesse <http://localhost:3000> e entre com o e-mail e senha definidos no
ambiente local. `pnpm run setup` inicia o container, aplica migrations nos bancos
de desenvolvimento e teste e executa o seed somente em desenvolvimento.

### Comandos úteis

| Comando                 | Uso                                                        |
| ----------------------- | ---------------------------------------------------------- |
| `pnpm db:up`            | Inicia o PostgreSQL e aguarda o healthcheck.               |
| `pnpm db:down`          | Para o container sem excluir o volume.                     |
| `pnpm db:migrate`       | Aplica migrations no banco de desenvolvimento.             |
| `pnpm db:seed`          | Executa o seed de desenvolvimento.                         |
| `pnpm test`             | Executa a suíte uma vez usando o banco de teste preparado. |
| `pnpm test:local`       | Inicia o banco, migra o banco de teste e roda Vitest.      |
| `pnpm lint`             | Executa ESLint.                                            |
| `pnpm format`           | Formata arquivos suportados pelo Prettier.                 |
| `pnpm format:check`     | Verifica formatação sem modificar arquivos.                |
| `pnpm typecheck`        | Executa `tsc --noEmit` mantendo TypeScript strict.         |
| `pnpm build`            | Faz build local usando o alvo de desenvolvimento validado. |
| `pnpm build:production` | Faz build com destino explícito e `DATABASE_URL`.          |
| `pnpm db:generate`      | Gera Prisma Client a partir do schema.                     |

No PowerShell do Windows, use `pnpm.cmd` se a política de execução bloquear
`pnpm.ps1`.

Para mudar a porta, configure o mesmo `STARTER_POSTGRES_PORT` em
`.env.development` e `.env.test`. Não remova o volume Docker como solução de
problemas sem antes considerar os dados locais que serão apagados.

### Variáveis principais

- `DATABASE_URL`: URL do banco selecionado pelo script de ambiente.
- `TEST_DATABASE_URL`: URL de teste, que deve apontar ao mesmo destino
  validado por `DATABASE_URL` no ambiente de teste.
- `DATABASE_SCHEMA`: schema PostgreSQL; o setup local usa `public`.
- `STARTER_POSTGRES_PORT`: porta local publicada pelo Compose.
- `AUTH_SECRET`: segredo de sessão/rate-limit; use um valor forte e privado
  fora do exemplo local.
- `DEMO_ADMIN_EMAIL` e `DEMO_ADMIN_PASSWORD`: credenciais do administrador do
  seed local.
- `LOG_LEVEL`: nível Pino; padrão `info`.
- `SENTRY_DSN` e `NEXT_PUBLIC_SENTRY_DSN`: DSNs opcionais do Sentry.

Não versionar arquivos `.env` locais, DSNs, senhas reais ou segredos. Para
produção, configure secrets no provedor de deploy; os comandos de
desenvolvimento/teste não substituem o procedimento de deploy e migration de
produção.
