# Tratamento de erros e observabilidade

## Logs estruturados

O servidor usa Pino. Configure `LOG_LEVEL` com um nível suportado (`fatal`,
`error`, `warn`, `info`, `debug`, `trace` ou `silent`); o padrão é `info`.
Logs de desenvolvimento são formatados para leitura e logs de produção são
JSON estruturado.

Server Actions passam por um tratamento compartilhado. Cada operação recebe um
`operationId`, incluído nos logs e na mensagem segura de erro para falhas
inesperadas. O tenant autenticado é associado ao contexto assíncrono da
operação. Nomes, e-mails, telefones, conteúdo clínico, credenciais, cookies e
tokens não devem ser incluídos nos logs de erro.

Erros de validação, autenticação, autorização, domínio e rate limit são
classificados separadamente de falhas inesperadas de infraestrutura. Apenas
falhas inesperadas são reportadas ao Sentry. A resposta ao cliente usa uma
mensagem genérica e a referência da operação, sem expor a exceção original.

## Sentry

Sentry é opcional. Sem DSN, inicialização e envio ficam desativados.

Configure no ambiente de deploy:

- `SENTRY_DSN`: DSN dos runtimes de servidor e Edge.
- `NEXT_PUBLIC_SENTRY_DSN`: DSN do navegador, definido durante o build do
  Next.js.
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT`: rótulo opcional para eventos do navegador.
  Eventos do servidor usam `APP_ENV` e, como alternativa, `NODE_ENV`.

Use os DSNs do projeto no Sentry; não versione DSNs ou tokens de autenticação.
O upload de source maps não está habilitado nesta configuração.

Sentry está inicializado para navegador, Node.js e Edge. Erros de requisição e
renderização do Next.js são capturados. A coleta automática de usuário,
cookies, headers/corpos HTTP, query parameters, payloads de banco e variáveis
de stack está desabilitada. O scrubber de eventos restringe dados e substitui
mensagens de exceção por texto genérico.

## Verificação operacional

Depois de configurar DSNs, publique um build de teste e provoque uma falha
controlada em ambiente não produtivo. Confirme que o evento contém ambiente e
tags de correlação (`operation`/`operation_id`), sem payload de requisição,
identidade de usuário ou mensagem da exceção. Não provoque falhas de teste
contra usuários reais ou dados de produção.
