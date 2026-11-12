# Auditoria e rate limit

## Auditoria

Operações bem-sucedidas de criação, atualização, exclusão e login gravam
metadados em `audit_logs`: tenant, ator, ação, entidade e identificador da
entidade. Payloads da operação são omitidos para evitar copiar dados pessoais
para o histórico.

## Limites de requisição

Server Actions autenticadas usam limites por janela fixa, mantidos no banco:

- Leituras/opções: 120 chamadas por ator, operação e minuto.
- Mutações: 30 chamadas por ator, operação e minuto.
- Login: 5 tentativas por e-mail e, quando disponível, por endereço do cliente
  em 15 minutos.

As chaves dos buckets são HMACs derivados de `AUTH_SECRET` (ou
`NEXTAUTH_SECRET`); identificadores brutos de login não são armazenados no
banco. Produção exige um desses segredos configurado.

As migrations devem ser aplicadas pelo procedimento de deploy do projeto. A
aplicação não executa migrations automaticamente ao iniciar.
