# Ambientes de banco de dados

O desenvolvimento local usa PostgreSQL 16 no Docker Compose. A aplicação
Next.js executa no host via pnpm.

## Requisitos e primeira configuração

Instale Docker Desktop com Compose, Node.js 22 e pnpm. Após clonar o repositório:

```bash
pnpm install
pnpm run setup
```

No PowerShell do Windows, use `pnpm.cmd` se a política de execução bloquear
`pnpm.ps1`.

`pnpm run setup` (alias de `pnpm run setup:local`) copia `.env.development.example` e
`.env.test.example` apenas se os respectivos arquivos locais não existirem. Em
seguida, inicia PostgreSQL, aplica as migrations nos bancos de desenvolvimento
e teste, e executa o seed somente no banco de desenvolvimento. Arquivos locais
já existentes não são sobrescritos.

Use `pnpm run setup`, não `pnpm setup`: `setup` sem `run` é um comando próprio
do pnpm para configurar o gerenciador, não um script do projeto.

O serviço do Compose mantém bancos independentes:

- `software_starter_dev` para desenvolvimento e seed.
- `software_starter_test` para testes.

Ambos usam credenciais de exemplo locais e um volume nomeado do projeto. O
Compose cria o banco de teste na inicialização de um volume novo. `pnpm
db:down` para o container, mas preserva o volume. Não remova o volume sem
confirmar que os dados locais podem ser apagados.

## Comandos locais

| Comando           | Resultado                                                        |
| ----------------- | ---------------------------------------------------------------- |
| `pnpm db:up`      | Inicia PostgreSQL e aguarda o healthcheck.                       |
| `pnpm db:down`    | Para o serviço sem excluir o volume.                             |
| `pnpm db:migrate` | Aplica migrations de desenvolvimento.                            |
| `pnpm db:seed`    | Executa o seed de desenvolvimento.                               |
| `pnpm test:local` | Inicia PostgreSQL, migra o banco de teste e roda testes.         |
| `pnpm test`       | Executa uma vez a suíte contra o banco de teste já preparado.    |
| `pnpm dev`        | Executa Next.js localmente com o banco de desenvolvimento.       |
| `pnpm build`      | Executa o build local usando o alvo de desenvolvimento validado. |

Também estão disponíveis `pnpm db:migrate:development`,
`pnpm db:migrate:test`, `pnpm db:seed:development`, `pnpm test:run` e
`pnpm build:production` para um ambiente de build explicitamente configurado.
Na CI, `pnpm build` usa o `DATABASE_URL` do banco efêmero de build; fora da CI,
usa o banco local validado de desenvolvimento.

A porta padrão do host é `54329`. Para alterá-la, configure o mesmo
`STARTER_POSTGRES_PORT` em `.env.development` e `.env.test`; as URLs de banco
interpolam esse valor. Os comandos locais aceitam somente conexões loopback aos
nomes de banco esperados. Isso impede que apontem aos bancos do sistema
original.

## Testes e CI

Testes locais usam `software_starter_test`, nunca dados de desenvolvimento. O
runner exige `.env.test`, valida que `DATABASE_URL` e `TEST_DATABASE_URL`
apontam ao mesmo banco de teste, rejeita destinos inesperados/não locais e
remove variáveis PostgreSQL herdadas do processo.

A CI usa um serviço PostgreSQL 16 efêmero criado para cada execução. Ele mantém
um banco de build separado e não usa o volume local nem banco de produção.

## Produção

Comandos de produção exigem `DATABASE_URL` fornecida pelo ambiente de deploy;
setup local e testes não os invocam. Antes de uma migration ou seed em produção,
valide o destino com `pnpm db:check:production` e confirme host, banco e schema.
Não use comandos de reset em produção. O seed demonstrativo é desativado nesse
ambiente.

## Baseline do starter

O schema ativo e a migration inicial definem o starter: usuários e itens de
exemplo tenant-scoped, auditoria e rate limit. O histórico do sistema de
agendamentos está preservado em `prisma/migrations-legacy/` e não faz parte do
caminho ativo. O seed cria apenas um administrador local e um item de exemplo.
Não aponte esta configuração a um banco existente nem aplique o histórico
arquivado ao banco do sistema original.
